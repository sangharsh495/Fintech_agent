import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  text,
  jsonb,
  boolean,
  real,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { users } from "./users"

// ─── Enums ──────────────────────────────────────────────────

export const taxDocumentTypeEnum = pgEnum("tax_document_type", [
  "form16",
  "ais",
  "tis",
  "form26as",
  "cas",
  "capital_gains",
])

export const taxDocumentStatusEnum = pgEnum("tax_document_status", [
  "pending",
  "parsed",
  "failed",
  "superseded",
])

export const itrFormEnum = pgEnum("itr_form", ["ITR-1", "ITR-2", "ITR-3", "ITR-4"])

export const filingStatusEnum = pgEnum("filing_status", [
  "draft",
  "reconciled",
  "ready",
  "json_generated",
  "filed",
])

export const holdingCategoryEnum = pgEnum("holding_category", [
  "EQUITY",
  "DEBT",
  "HYBRID",
  "ELSS",
  "OTHER",
])

// ─── Tax Documents ──────────────────────────────────────────
// One row per uploaded source document (Form 16, AIS, CAS, ...). The parsed
// payload is stored as JSONB so the filing wizard can re-run reconciliation
// without re-parsing the PDF, and so a user can see exactly what was extracted.
//
// The raw file itself is NOT stored here — only its S3 key — so this table can
// be read freely by the app without exposing document contents.

export const taxDocuments = pgTable(
  "tax_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    financialYear: varchar("financial_year", { length: 9 }).notNull(), // "2025-2026"
    documentType: taxDocumentTypeEnum("document_type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    /** SHA-256 of the raw upload, for idempotent re-uploads. */
    fileHash: varchar("file_hash", { length: 64 }),
    s3Key: varchar("s3_key", { length: 512 }),
    fileSize: integer("file_size"),
    status: taxDocumentStatusEnum("status").default("pending").notNull(),
    /** Parser output: Form16Data | AISData | CASData. */
    parsedData: jsonb("parsed_data"),
    /** 0–1 parser confidence; low values prompt manual confirmation. */
    confidence: real("confidence"),
    /** Fields the parser could not find, surfaced in the wizard. */
    missingFields: jsonb("missing_fields").$type<string[]>().default([]),
    errorMessage: text("error_message"),
    parsedAt: timestamp("parsed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userFyIdx: index("tax_documents_user_fy_idx").on(table.userId, table.financialYear),
    // The same file uploaded twice for the same year is the same document.
    userHashUnique: uniqueIndex("tax_documents_user_hash_unique").on(
      table.userId,
      table.financialYear,
      table.fileHash
    ),
  })
)

// ─── Tax Filings ────────────────────────────────────────────
// One working draft per user per financial year. Holds the reconciled
// computation input, the engine's output, and the generated ITR JSON, so the
// wizard is resumable and the audit report is reproducible.

export const taxFilings = pgTable(
  "tax_filings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    financialYear: varchar("financial_year", { length: 9 }).notNull(),
    assessmentYear: varchar("assessment_year", { length: 7 }).notNull(),
    status: filingStatusEnum("status").default("draft").notNull(),
    itrForm: itrFormEnum("itr_form"),
    /** Why that form was selected — reasons, disqualifiers, warnings. */
    itrFormRationale: jsonb("itr_form_rationale"),

    /** TaxComputationInput after reconciliation. */
    computationInput: jsonb("computation_input"),
    /** TaxComputationResult, both regimes. */
    computationResult: jsonb("computation_result"),
    /** ReconciliationFinding[]. */
    reconciliationFindings: jsonb("reconciliation_findings"),

    selectedRegime: varchar("selected_regime", { length: 4 }), // "OLD" | "NEW"
    grossTotalIncome: decimal("gross_total_income", { precision: 14, scale: 2 }),
    taxableIncome: decimal("taxable_income", { precision: 14, scale: 2 }),
    totalTaxPayable: decimal("total_tax_payable", { precision: 14, scale: 2 }),
    taxCreditClaimed: decimal("tax_credit_claimed", { precision: 14, scale: 2 }),
    /** Negative means a refund is due. */
    netPayable: decimal("net_payable", { precision: 14, scale: 2 }),

    /** The generated ITD JSON, kept so the same file can be re-downloaded. */
    itrJson: jsonb("itr_json"),
    /** ValidationIssue[] from the last generation attempt. */
    validationIssues: jsonb("validation_issues"),
    jsonGeneratedAt: timestamp("json_generated_at"),

    /** Set by the user after they upload the JSON to the ITD portal. */
    acknowledgementNumber: varchar("acknowledgement_number", { length: 32 }),
    filedAt: timestamp("filed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // One live draft per year keeps the wizard unambiguous.
    userFyUnique: uniqueIndex("tax_filings_user_fy_unique").on(table.userId, table.financialYear),
  })
)

// ─── Portfolio Holdings ─────────────────────────────────────
// Mutual fund folios extracted from a CAMS/KFintech CAS.

export const portfolioHoldings = pgTable(
  "portfolio_holdings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The CAS upload this holding came from. */
    sourceDocumentId: uuid("source_document_id").references(() => taxDocuments.id, {
      onDelete: "set null",
    }),
    folioNumber: varchar("folio_number", { length: 64 }).notNull(),
    schemeName: varchar("scheme_name", { length: 255 }).notNull(),
    amc: varchar("amc", { length: 128 }),
    isin: varchar("isin", { length: 12 }),
    category: holdingCategoryEnum("category").default("OTHER").notNull(),
    /** MF units carry 3–4 decimals, so this is wider than a money column. */
    units: decimal("units", { precision: 18, scale: 4 }).notNull().default("0"),
    currentNav: decimal("current_nav", { precision: 12, scale: 4 }),
    investedValue: decimal("invested_value", { precision: 14, scale: 2 }).notNull().default("0"),
    currentValue: decimal("current_value", { precision: 14, scale: 2 }).notNull().default("0"),
    /** ELSS holdings feed the Sec 80C total. */
    isElss: boolean("is_elss").default(false).notNull(),
    /** Annualised return across the folio's dated cash flows, as a fraction. */
    xirr: real("xirr"),
    statementDate: timestamp("statement_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("portfolio_holdings_user_idx").on(table.userId),
    // A folio + scheme pair is the natural key; re-uploading a newer CAS
    // updates the same row rather than duplicating the holding.
    userFolioSchemeUnique: uniqueIndex("portfolio_holdings_user_folio_scheme_unique").on(
      table.userId,
      table.folioNumber,
      table.schemeName
    ),
  })
)

// ─── Types ──────────────────────────────────────────────────

export type TaxDocument = typeof taxDocuments.$inferSelect
export type NewTaxDocument = typeof taxDocuments.$inferInsert
export type TaxFiling = typeof taxFilings.$inferSelect
export type NewTaxFiling = typeof taxFilings.$inferInsert
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect
export type NewPortfolioHolding = typeof portfolioHoldings.$inferInsert
