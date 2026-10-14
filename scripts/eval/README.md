# Evaluation scripts

These scripts produce every number reported for FinFlow's ingestion and tax
engines. None of them make network calls (fetching the external corpus does).

| Command | What it measures |
|---|---|
| `pnpm eval:parser` | Deterministic parser (Tier 1) on the E1 corpus: per-bank precision/recall/F1, balance agreement, bank fingerprinting, share of statements verified by balance continuity, latency |
| `pnpm eval:parser:heldout` | Same, on the held-out corpus (build it first, below) |
| `pnpm eval:parser:external` | Same, on the independent AgamiAI digital corpus (fetch it first, below) |
| `pnpm eval:parser:scanned` | Same, on the AgamiAI scanned corpus, OCR'd first (needs `qpdf` and `tesseract`; about 10 s per statement) |
| `pnpm eval:invariant` | Balance continuity check under five injected fault types, unanchored and anchored to the opening balance; overlap deduplication |
| `pnpm eval:tax` | Tax engine against hand-worked anchor cases and an independent reference implementation (50 profiles × 3 financial years × 2 regimes) |

## Tests

| Command | What it checks |
|---|---|
| `pnpm test:parser` | Ingestion regressions, offline (Groq stubbed): bank detection, opening balance, deduplication, deterministic acceptance with no LLM call, encryption with and without qpdf, password hints, chunking and retry, engine selection |
| `pnpm test:tax` | Tax-engine and reconciliation regressions: 24(b), hand-worked liabilities, surcharge marginal relief, input sanitising, 80D split |
| `pnpm test:e2e` | The production build against a throwaway Postgres over real HTTP: authentication, upload and storage, duplicates, encrypted and scanned statements, non-reconciling ledgers, per-user isolation (API and row-level security), size limits. Needs `postgres`, `qpdf`, `python3` with `reportlab`, and `tesseract` for the scan check; refuses to run if `.env`/`.env.local` exist (use a clean clone or CI) |

## Corpora

- **E1** (`eval/corpus/e1`, committed): 120 synthetic statements, 15 per bank
  for HDFC, ICICI, SBI, Axis, Kotak, PNB, Bank of Baroda and Yes Bank;
  5,290 transactions. Two layout families: separate debit/credit columns
  (HDFC, ICICI, Axis, PNB, Yes) and a single amount column with a Dr/Cr suffix
  (SBI, Kotak, BoB). The parser fixes in `server/services/parser/pdf.table.ts`
  were developed against this set, so treat it as a development set.
- **Held-out** (not committed, regenerate): 200 statements, 25 per bank, 40–140
  transactions each, drawn from different seeds:

  ```sh
  pip install reportlab
  python3 eval/corpus/generator/build_corpus.py --per-bank 25 --txns 40 140 --seed-base 90000 --out eval/corpus/heldout
  ```

- **External** (not committed, fetch): the AgamiAI Indian-Bank-Statements
  dataset (Apache-2.0), from a different author and generator: 200 digital and
  200 scanned statements in two layouts, fictional bank names, two-line
  headers, wrapped narrations centred on their row, `Rs.`-prefixed amounts, a
  separate Cr/Dr column and a watermark across the table.

  ```sh
  python3 eval/corpus/external/fetch_agami.py              # digital only, ~40 MB
  python3 eval/corpus/external/fetch_agami.py --scanned    # also the scans, ~1.3 GB
  ```

  About 12% of this dataset's rows do not reconcile with the previous balance
  (a property of its generator), so its statements are correctly reported as
  unverified; score it on extraction (F1), not on the Verified column.

E1 and the held-out set share one generator and eight layouts; the external
set is a genuinely independent check, and its scans exercise OCR. All three
are still synthetic: they do not contain real banks' layout drift, photographed
pages or handwritten annotations. A set of real, redacted, hand-annotated
statements is needed before claiming real-world accuracy.

## Notes on the method

- **Parser matching** is a multiset match on (date, amount, direction), so a
  repeated identical payment must be found as many times as it occurs.
- **Fault injection** corrupts ground-truth ledgers, so `eval:invariant` tests
  the check itself, not parser and check together. A fault in the first row is
  invisible without an opening balance; the anchored run shows the effect of
  using the one printed on the statement, which is what the app does.
- **Tax reference** is written separately from the engine, from the slab,
  87A rebate, surcharge and marginal relief rules. Agreement is exact to the
  rupee. Capital gains at special rates are out of scope for both.
