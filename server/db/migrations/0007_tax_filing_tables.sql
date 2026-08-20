-- ═══════════════════════════════════════════════════════════════
-- Migration 0007: Autonomous tax filing tables
-- ═══════════════════════════════════════════════════════════════
-- Adds the source-document store, the per-year filing draft, and the
-- mutual fund holdings extracted from a CAMS/KFintech CAS.
--
-- Every table is RLS-scoped on app.current_user_id, matching the pattern
-- established in migration 0002. The finflow_app role has no BYPASSRLS.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Enums ───────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE tax_document_type AS ENUM ('form16', 'ais', 'tis', 'form26as', 'cas', 'capital_gains');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tax_document_status AS ENUM ('pending', 'parsed', 'failed', 'superseded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE itr_form AS ENUM ('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE filing_status AS ENUM ('draft', 'reconciled', 'ready', 'json_generated', 'filed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE holding_category AS ENUM ('EQUITY', 'DEBT', 'HYBRID', 'ELSS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. tax_documents ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  financial_year VARCHAR(9) NOT NULL,
  document_type tax_document_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_hash VARCHAR(64),
  s3_key VARCHAR(512),
  file_size INTEGER,
  status tax_document_status NOT NULL DEFAULT 'pending',
  parsed_data JSONB,
  confidence REAL,
  missing_fields JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  parsed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_documents_user_fy_idx ON tax_documents (user_id, financial_year);
-- Re-uploading an identical file for the same year is a no-op, not a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS tax_documents_user_hash_unique
  ON tax_documents (user_id, financial_year, file_hash);

-- ─── 3. tax_filings ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  financial_year VARCHAR(9) NOT NULL,
  assessment_year VARCHAR(7) NOT NULL,
  status filing_status NOT NULL DEFAULT 'draft',
  itr_form itr_form,
  itr_form_rationale JSONB,
  computation_input JSONB,
  computation_result JSONB,
  reconciliation_findings JSONB,
  selected_regime VARCHAR(4),
  gross_total_income DECIMAL(14,2),
  taxable_income DECIMAL(14,2),
  total_tax_payable DECIMAL(14,2),
  tax_credit_claimed DECIMAL(14,2),
  net_payable DECIMAL(14,2),
  itr_json JSONB,
  validation_issues JSONB,
  json_generated_at TIMESTAMP,
  acknowledgement_number VARCHAR(32),
  filed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tax_filings_user_fy_unique
  ON tax_filings (user_id, financial_year);

-- ─── 4. portfolio_holdings ──────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES tax_documents(id) ON DELETE SET NULL,
  folio_number VARCHAR(64) NOT NULL,
  scheme_name VARCHAR(255) NOT NULL,
  amc VARCHAR(128),
  isin VARCHAR(12),
  category holding_category NOT NULL DEFAULT 'OTHER',
  units DECIMAL(18,4) NOT NULL DEFAULT 0,
  current_nav DECIMAL(12,4),
  invested_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  current_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_elss BOOLEAN NOT NULL DEFAULT FALSE,
  xirr REAL,
  statement_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_holdings_user_idx ON portfolio_holdings (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_holdings_user_folio_scheme_unique
  ON portfolio_holdings (user_id, folio_number, scheme_name);

-- ─── 5. Row-Level Security ──────────────────────────────────

ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- tax_documents
DROP POLICY IF EXISTS tax_documents_select ON tax_documents;
CREATE POLICY tax_documents_select ON tax_documents FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS tax_documents_insert ON tax_documents;
CREATE POLICY tax_documents_insert ON tax_documents FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS tax_documents_update ON tax_documents;
CREATE POLICY tax_documents_update ON tax_documents FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS tax_documents_delete ON tax_documents;
CREATE POLICY tax_documents_delete ON tax_documents FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- tax_filings
DROP POLICY IF EXISTS tax_filings_select ON tax_filings;
CREATE POLICY tax_filings_select ON tax_filings FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS tax_filings_insert ON tax_filings;
CREATE POLICY tax_filings_insert ON tax_filings FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS tax_filings_update ON tax_filings;
CREATE POLICY tax_filings_update ON tax_filings FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS tax_filings_delete ON tax_filings;
CREATE POLICY tax_filings_delete ON tax_filings FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- portfolio_holdings
DROP POLICY IF EXISTS portfolio_holdings_select ON portfolio_holdings;
CREATE POLICY portfolio_holdings_select ON portfolio_holdings FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS portfolio_holdings_insert ON portfolio_holdings;
CREATE POLICY portfolio_holdings_insert ON portfolio_holdings FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS portfolio_holdings_update ON portfolio_holdings;
CREATE POLICY portfolio_holdings_update ON portfolio_holdings FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
DROP POLICY IF EXISTS portfolio_holdings_delete ON portfolio_holdings;
CREATE POLICY portfolio_holdings_delete ON portfolio_holdings FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ─── 6. Grants ──────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON tax_documents TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_filings TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_holdings TO finflow_app;
