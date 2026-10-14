#!/usr/bin/env bash
# End-to-end test: real production build, real Postgres, real HTTP requests.
#
#   pnpm test:e2e
#
# Creates a throwaway Postgres cluster on 127.0.0.1:55432, applies every
# migration, seeds two users with bank accounts, builds and starts the app on
# 127.0.0.1:3123 with test-only secrets, runs scripts/e2e/http.test.mjs, then
# stops everything and deletes the cluster.
#
# Requires: postgres (initdb, pg_ctl, psql), qpdf, python3 with reportlab;
# tesseract for the scanned-statement check. No LLM key is set, so the LLM
# tier is unavailable by design and its fallback paths are exercised.
#
# Refuses to run when .env / .env.local exist: Next.js would load them for any
# variable this script does not set (a real database URL, real API keys).
# Run it from a clean clone or CI, or move those files aside first.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

for f in .env .env.local .env.production .env.production.local; do
  if [[ -e "$f" ]]; then
    echo "Refusing to run: $f exists and would be loaded by Next.js. Use a clean clone or move it aside." >&2
    exit 1
  fi
done

for bin in initdb pg_ctl psql qpdf python3; do
  command -v "$bin" >/dev/null || { echo "Missing required tool: $bin" >&2; exit 1; }
done

WORK="$(mktemp -d "${TMPDIR:-/tmp}/finflow-e2e.XXXXXX")"
PGDATA="$WORK/pg"
PORT_DB=55432
PORT_APP=3123
SERVER_PID=""

cleanup() {
  [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null || true
  pg_ctl -D "$PGDATA" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

psqlq() { PGOPTIONS="-c client_min_messages=warning" psql -h 127.0.0.1 -p "$PORT_DB" -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

echo "── Postgres"
initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PORT_DB -c unix_socket_directories='' -c listen_addresses=127.0.0.1" -l "$WORK/pg.log" start >/dev/null
for _ in $(seq 1 30); do psqlq -c "select 1" >/dev/null 2>&1 && break; sleep 0.5; done
psqlq -c "CREATE DATABASE finflow"
for m in $(ls server/db/migrations/*.sql | sort); do psqlq -d finflow -f "$m" >/dev/null; done
psqlq -d finflow -c "CREATE ROLE finflow_app_login LOGIN PASSWORD 'apppass' IN ROLE finflow_app;"
psqlq -d finflow <<'SQL'
INSERT INTO users (id, email, name) VALUES
 ('11111111-1111-1111-1111-111111111111', 'e2e-a@finflow.test', 'E2E User A'),
 ('22222222-2222-2222-2222-222222222222', 'e2e-b@finflow.test', 'E2E User B');
INSERT INTO bank_accounts (id, user_id, bank_name) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'State Bank of India'),
 ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'HDFC Bank'),
 ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Progressive National Bank'),
 ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'ICICI Bank');
SQL

cat > "$WORK/e2e.env" <<EOF
DATABASE_URL=postgres://postgres@127.0.0.1:$PORT_DB/finflow
DIRECT_URL=postgres://postgres@127.0.0.1:$PORT_DB/finflow
APP_DATABASE_URL=postgres://finflow_app_login:apppass@127.0.0.1:$PORT_DB/finflow
AUTH_SECRET=e2e-$(openssl rand -hex 24)
NEXTAUTH_SECRET=e2e-$(openssl rand -hex 24)
NEXTAUTH_URL=http://127.0.0.1:$PORT_APP
AUTH_TRUST_HOST=true
ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)
NODE_ENV=production
EOF

echo "── Build and start"
set -a; source "$WORK/e2e.env"; set +a
./node_modules/.bin/next build >"$WORK/build.log" 2>&1 || { tail -40 "$WORK/build.log"; exit 1; }
./node_modules/.bin/next start -p "$PORT_APP" -H 127.0.0.1 >"$WORK/server.log" 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 60); do curl -sf "http://127.0.0.1:$PORT_APP/api/health" >/dev/null 2>&1 && break; sleep 1; done

echo "── Tests"
SCAN="eval/corpus/external/agami/raw/train/India_Bank_Statement_Scanned_Type1/00003.pdf"
if ! node scripts/e2e/http.test.mjs "$ROOT" "$WORK" "$WORK/e2e.env" "$SCAN"; then
  echo "── Server errors"
  grep -E '"level":"error"' "$WORK/server.log" | grep -vE 'Groq|ECONNREFUSED|PasswordException|Incorrect Password|METADATA EXTRACTION' | cut -c1-700 | tail -10 || true
  exit 1
fi
