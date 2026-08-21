import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!
const connectionUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "")
const sql = neon(connectionUrl)

async function setupTaxTables() {
  console.log("Setting up tax filing database tables and enums...")

  // 1. Create Enums
  await sql`
    DO $$ BEGIN
      CREATE TYPE tax_document_type AS ENUM ('form16', 'ais', 'tis', 'form26as', 'cas', 'capital_gains');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `
  console.log("✓ tax_document_type enum ready")

  await sql`
    DO $$ BEGIN
      CREATE TYPE tax_document_status AS ENUM ('pending', 'parsed', 'failed', 'superseded');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `
  console.log("✓ tax_document_status enum ready")

  await sql`
    DO $$ BEGIN
      CREATE TYPE itr_form AS ENUM ('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `
  console.log("✓ itr_form enum ready")

  await sql`
    DO $$ BEGIN
      CREATE TYPE filing_status AS ENUM ('draft', 'reconciled', 'ready', 'json_generated', 'filed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `
  console.log("✓ filing_status enum ready")

  await sql`
    DO $$ BEGIN
      CREATE TYPE holding_category AS ENUM ('EQUITY', 'DEBT', 'HYBRID', 'ELSS', 'OTHER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `
  console.log("✓ holding_category enum ready")

  // 2. Create tax_documents table
  await sql`
    CREATE TABLE IF NOT EXISTS tax_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      financial_year VARCHAR(9) NOT NULL,
      document_type tax_document_type NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_hash VARCHAR(64),
      s3_key VARCHAR(512),
      file_size INTEGER,
      status tax_document_status DEFAULT 'pending' NOT NULL,
      parsed_data JSONB,
      confidence REAL,
      missing_fields JSONB DEFAULT '[]'::jsonb,
      error_message TEXT,
      parsed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `
  await sql`CREATE INDEX IF NOT EXISTS tax_documents_user_fy_idx ON tax_documents(user_id, financial_year);`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS tax_documents_user_hash_unique ON tax_documents(user_id, financial_year, file_hash);`
  console.log("✓ tax_documents table and indexes ready")

  // 3. Create tax_filings table
  await sql`
    CREATE TABLE IF NOT EXISTS tax_filings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      financial_year VARCHAR(9) NOT NULL,
      assessment_year VARCHAR(7) NOT NULL,
      status filing_status DEFAULT 'draft' NOT NULL,
      itr_form itr_form,
      itr_form_rationale JSONB,
      wizard_inputs JSONB,
      computation_input JSONB,
      computation_result JSONB,
      reconciliation_findings JSONB,
      selected_regime VARCHAR(4),
      gross_total_income NUMERIC(14, 2),
      taxable_income NUMERIC(14, 2),
      total_tax_payable NUMERIC(14, 2),
      tax_credit_claimed NUMERIC(14, 2),
      net_payable NUMERIC(14, 2),
      itr_json JSONB,
      validation_issues JSONB,
      json_generated_at TIMESTAMP,
      acknowledgement_number VARCHAR(32),
      filed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS tax_filings_user_fy_unique ON tax_filings(user_id, financial_year);`
  console.log("✓ tax_filings table and indexes ready")

  // 4. Create portfolio_holdings table
  await sql`
    CREATE TABLE IF NOT EXISTS portfolio_holdings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_document_id UUID REFERENCES tax_documents(id) ON DELETE SET NULL,
      folio_number VARCHAR(64) NOT NULL,
      scheme_name VARCHAR(255) NOT NULL,
      amc VARCHAR(128),
      isin VARCHAR(12),
      category holding_category DEFAULT 'OTHER' NOT NULL,
      units NUMERIC(18, 4) DEFAULT '0' NOT NULL,
      current_nav NUMERIC(12, 4),
      invested_value NUMERIC(14, 2) DEFAULT '0' NOT NULL,
      current_value NUMERIC(14, 2) DEFAULT '0' NOT NULL,
      is_elss BOOLEAN DEFAULT false NOT NULL,
      xirr REAL,
      statement_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `
  await sql`CREATE INDEX IF NOT EXISTS portfolio_holdings_user_idx ON portfolio_holdings(user_id);`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS portfolio_holdings_user_folio_scheme_unique ON portfolio_holdings(user_id, folio_number, scheme_name);`
  console.log("✓ portfolio_holdings table and indexes ready")

  // 5. Grant permissions to finflow_app role (for RLS and standard operations)
  try {
    await sql`GRANT ALL ON TABLE tax_documents TO finflow_app;`
    await sql`GRANT ALL ON TABLE tax_filings TO finflow_app;`
    await sql`GRANT ALL ON TABLE portfolio_holdings TO finflow_app;`
    console.log("✓ Granted table permissions to finflow_app role")
  } catch (err) {
    console.log("Role grant notice:", err)
  }

  console.log("\n🎉 All tax filing tables successfully created and configured!")
}

setupTaxTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err)
    process.exit(1)
  })
