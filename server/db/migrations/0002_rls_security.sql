-- ═══════════════════════════════════════════════════════════════
-- Migration 0002: Row-Level Security for all user-data tables
-- ═══════════════════════════════════════════════════════════════
-- This migration enables RLS on every table containing user data
-- and creates policies scoping every row to the current session's
-- app.current_user_id setting (set from verified JWT only).
--
-- The finflow_app role is used by the application connection pool
-- and explicitly has NO BYPASSRLS privilege.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Create application role (no BYPASSRLS) ──────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finflow_app') THEN
    CREATE ROLE finflow_app NOLOGIN;
  END IF;
END
$$;

-- Grant connect + usage but NOT superuser/bypassrls
GRANT USAGE ON SCHEMA public TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO finflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO finflow_app;

-- Ensure future tables also get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO finflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO finflow_app;


-- ─── 2. Enable RLS on all user-data tables ──────────────────
-- Tables with user_id column (varchar)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_access_policies ENABLE ROW LEVEL SECURITY;

-- Tables with user_id column (uuid FK → users.id)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;


-- ─── 3. Create RLS policies ─────────────────────────────────
-- Policy pattern: scope to current_setting('app.current_user_id')
-- For varchar user_id columns, compare directly.
-- For uuid user_id columns, cast the setting to uuid.

-- ── transactions (user_id: varchar) ──
CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ── cluster_metadata (user_id: varchar) ──
CREATE POLICY cluster_metadata_select ON cluster_metadata FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY cluster_metadata_insert ON cluster_metadata FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY cluster_metadata_update ON cluster_metadata FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY cluster_metadata_delete ON cluster_metadata FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ── cluster_runs (user_id: varchar) ──
CREATE POLICY cluster_runs_select ON cluster_runs FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY cluster_runs_insert ON cluster_runs FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY cluster_runs_update ON cluster_runs FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY cluster_runs_delete ON cluster_runs FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ── statement_uploads (user_id: uuid as varchar comparison) ──
CREATE POLICY statement_uploads_select ON statement_uploads FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY statement_uploads_insert ON statement_uploads FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY statement_uploads_update ON statement_uploads FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY statement_uploads_delete ON statement_uploads FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── ai_chat_logs (user_id: uuid) ──
CREATE POLICY ai_chat_logs_select ON ai_chat_logs FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_chat_logs_insert ON ai_chat_logs FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_chat_logs_update ON ai_chat_logs FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_chat_logs_delete ON ai_chat_logs FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── ai_access_policies (user_id: uuid) ──
CREATE POLICY ai_access_policies_select ON ai_access_policies FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_access_policies_insert ON ai_access_policies FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_access_policies_update ON ai_access_policies FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_access_policies_delete ON ai_access_policies FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── user_profiles (user_id: uuid) ──
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── bank_accounts (user_id: uuid) ──
CREATE POLICY bank_accounts_select ON bank_accounts FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY bank_accounts_insert ON bank_accounts FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY bank_accounts_update ON bank_accounts FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY bank_accounts_delete ON bank_accounts FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── accounts (NextAuth - user_id: uuid) ──
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY accounts_insert ON accounts FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY accounts_update ON accounts FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY accounts_delete ON accounts FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── sessions (NextAuth - user_id: uuid) ──
CREATE POLICY sessions_select ON sessions FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY sessions_insert ON sessions FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY sessions_update ON sessions FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY sessions_delete ON sessions FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── user_totp_secrets (user_id: uuid, also PK) ──
CREATE POLICY user_totp_secrets_select ON user_totp_secrets FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_totp_secrets_insert ON user_totp_secrets FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_totp_secrets_update ON user_totp_secrets FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_totp_secrets_delete ON user_totp_secrets FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── user_2fa_backup_codes (user_id: uuid) ──
CREATE POLICY user_2fa_backup_codes_select ON user_2fa_backup_codes FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_2fa_backup_codes_insert ON user_2fa_backup_codes FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_2fa_backup_codes_update ON user_2fa_backup_codes FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_2fa_backup_codes_delete ON user_2fa_backup_codes FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ── user_subscriptions (user_id: uuid) ──
CREATE POLICY user_subscriptions_select ON user_subscriptions FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_subscriptions_insert ON user_subscriptions FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_subscriptions_update ON user_subscriptions FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY user_subscriptions_delete ON user_subscriptions FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));


-- ─── 4. Force RLS for finflow_app role ──────────────────────
-- FORCE means RLS applies even to the table owner for this role
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE cluster_metadata FORCE ROW LEVEL SECURITY;
ALTER TABLE cluster_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE statement_uploads FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_access_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_totp_secrets FORCE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_backup_codes FORCE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions FORCE ROW LEVEL SECURITY;


-- ─── 5. NOTE: users table has NO RLS ────────────────────────
-- The `users` table is intentionally excluded from RLS because:
-- 1. Auth flows (login, signup, OTP verification) need to look up users by email
-- 2. The `users` table itself doesn't contain financial data
-- 3. Password hashes are protected by bcrypt, not row isolation
-- All tables that reference users.id and contain user-specific data ARE covered.

-- ─── 6. NOTE: otp_verifications has NO RLS ──────────────────
-- OTP lookups are by email (pre-auth), not user_id. Excluded intentionally.

-- ─── 7. NOTE: verification_tokens has NO RLS ────────────────
-- NextAuth verification tokens are looked up by token value, not user_id.

-- ─── 8. NOTE: payments table has NO user_id ─────────────────
-- The payments table doesn't have a user_id column (it's Stripe-oriented).
-- user_subscriptions (which does have user_id) IS covered above.
