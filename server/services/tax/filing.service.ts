/**
 * server/services/tax/filing.service.ts
 *
 * Orchestrates a filing: gather the parsed source documents and bank-derived
 * aggregates for a financial year, reconcile them, run the statutory engine,
 * pick the ITR form, and persist the draft.
 *
 * Every database call receives an already-user-scoped Drizzle client from the
 * caller's `withUserScopedDb`, so this module never opens a connection of its
 * own and never sees a userId that did not come from a verified JWT.
 */

import { and, eq, sql } from "drizzle-orm"
import {
  taxDocuments,
  taxFilings,
  taxSummaries,
  userProfiles,
  bankAccounts,
  users,
} from "@/server/db/schema"
import { computeIndianTax } from "./tax-calculator"
import { harmoniseTaxSources, type ReconciliationResult } from "./reconciliation"
import { determineITRForm, type ITRSelection, type TaxpayerProfile } from "./itr-form-selector"
import {
  assessmentYearFor,
  normaliseFinancialYear,
  shortFinancialYear,
  type AISData,
  type CASData,
  type DeductionInput,
  type FinancialYear,
  type Form16Data,
  type HarmonisedTaxData,
  type TaxComputationResult,
} from "./types"

import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type * as schema from "@/server/db/schema"

/** The user-scoped Drizzle client handed in by withUserScopedDb. */
export type ScopedDb = NodePgDatabase<typeof schema>

// ─── Bank-derived signals ───────────────────────────────────

/**
 * Maps the aggregate `tax_summaries` rows into the harmoniser's bank shape.
 *
 * These aggregates are produced by the statement pipeline, which tags each
 * transaction with a section ("80C", "80D", "salary", ...). Reading the
 * aggregate rather than raw transactions keeps this fast and keeps raw
 * transaction data out of the tax path.
 */
export async function loadBankDerivedData(
  db: ScopedDb,
  userId: string,
  financialYear: FinancialYear
): Promise<HarmonisedTaxData["bankDerived"]> {
  const fy = shortFinancialYear(financialYear)

  const rows: Array<{ section: string; category: string; type: string; totalAmount: string }> =
    await db
      .select({
        section: taxSummaries.section,
        category: taxSummaries.category,
        type: taxSummaries.type,
        totalAmount: taxSummaries.totalAmount,
      })
      .from(taxSummaries)
      .where(and(eq(taxSummaries.userId, userId), eq(taxSummaries.fy, fy)))

  const sum = (predicate: (row: (typeof rows)[number]) => boolean) =>
    rows.filter(predicate).reduce((total, row) => total + (parseFloat(row.totalAmount) || 0), 0)

  const detectedDeductions: Record<string, number> = {}
  for (const row of rows) {
    // Only debit-side rows tagged with a Chapter VI-A section are deductions;
    // an "80C" credit would be a redemption, not an investment.
    if (row.type !== "debit" || !/^8\d/.test(row.section)) continue
    detectedDeductions[row.section] = (detectedDeductions[row.section] ?? 0) + (parseFloat(row.totalAmount) || 0)
  }

  return {
    salaryCredits: sum((row) => row.category === "salary" && row.type === "credit"),
    savingsInterest: sum(
      (row) => row.type === "credit" && /interest/i.test(row.category)
    ),
    rentalIncome: sum((row) => row.category === "rental_income" && row.type === "credit"),
    detectedDeductions,
  }
}

// ─── Document loading ───────────────────────────────────────

export interface LoadedDocuments {
  form16?: Form16Data
  ais?: AISData
  cas?: CASData
  /** Document ids that contributed, for the audit trail. */
  documentIds: string[]
}

/**
 * Loads the most recent successfully-parsed document of each type.
 *
 * A user can upload two Form 16s (job change) — the latest wins here, and the
 * reconciler separately flags the AIS-vs-Form-16 salary gap that a job change
 * produces, so the under-reporting is surfaced rather than hidden.
 */
export async function loadParsedDocuments(
  db: ScopedDb,
  userId: string,
  financialYear: FinancialYear
): Promise<LoadedDocuments> {
  const rows = await db
    .select({
      id: taxDocuments.id,
      documentType: taxDocuments.documentType,
      parsedData: taxDocuments.parsedData,
      createdAt: taxDocuments.createdAt,
    })
    .from(taxDocuments)
    .where(
      and(
        eq(taxDocuments.userId, userId),
        eq(taxDocuments.financialYear, financialYear),
        eq(taxDocuments.status, "parsed")
      )
    )
    .orderBy(sql`${taxDocuments.createdAt} DESC`)

  const result: LoadedDocuments = { documentIds: [] }

  for (const row of rows as Array<{ id: string; documentType: string; parsedData: unknown }>) {
    if (!row.parsedData) continue

    if (row.documentType === "form16" && !result.form16) {
      result.form16 = row.parsedData as Form16Data
      result.documentIds.push(row.id)
    } else if ((row.documentType === "ais" || row.documentType === "tis") && !result.ais) {
      result.ais = row.parsedData as AISData
      result.documentIds.push(row.id)
    } else if (row.documentType === "cas" && !result.cas) {
      result.cas = row.parsedData as CASData
      result.documentIds.push(row.id)
    }
  }

  return result
}

// ─── Taxpayer profile ───────────────────────────────────────

export interface FilingContext {
  age: number
  pan?: string
  fullName?: string
  email?: string
  city?: string
  state?: string
  dob?: string
  housePropertyCount: number
  bankAccountCount: number
}

export async function loadFilingContext(db: ScopedDb, userId: string): Promise<FilingContext> {
  const [profile] = await db
    .select({
      dob: userProfiles.dob,
      panNumber: userProfiles.panNumber,
      city: userProfiles.city,
      state: userProfiles.state,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  const [account] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const banks = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)))

  // Age drives the old-regime basic exemption and the 80TTB/80D ceilings, so a
  // missing DOB defaults to a non-senior rather than silently granting relief.
  let age = 35
  if (profile?.dob) {
    const dob = new Date(profile.dob)
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date()
      age = now.getFullYear() - dob.getFullYear()
      const beforeBirthday =
        now.getMonth() < dob.getMonth() ||
        (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
      if (beforeBirthday) age--
    }
  }

  return {
    age,
    pan: profile?.panNumber ?? undefined,
    fullName: account?.name ?? undefined,
    email: account?.email ?? undefined,
    city: profile?.city ?? undefined,
    state: profile?.state ?? undefined,
    dob: profile?.dob ?? undefined,
    // Rental income is the only house-property signal available today; a second
    // property has to be declared by the user in the wizard.
    housePropertyCount: 1,
    bankAccountCount: banks.length,
  }
}

// ─── Draft assembly ─────────────────────────────────────────

export interface BuildFilingOptions {
  /** Deduction overrides asserted by the user in the wizard. */
  userDeductions?: Partial<DeductionInput>
  /** Capital gains the user entered from a broker P&L, which CAS cannot give. */
  capitalGains?: {
    stcg111A: number
    ltcg112A: number
    otherCapitalGains: number
  }
  /** Presumptive business income declared in the wizard. */
  presumptive?: {
    scheme: "44AD" | "44ADA" | "44AE"
    turnover: number
    income: number
  }
  /** Advance tax and self-assessment tax paid outside TDS. */
  advanceTaxPaid?: number
  /** Regime the user explicitly chose, overriding the engine's recommendation. */
  regimeOverride?: "OLD" | "NEW"
  /** Facts only the user can supply, feeding the ITR form decision. */
  declarations?: {
    hasForeignAssets?: boolean
    hasForeignIncome?: boolean
    isCompanyDirector?: boolean
    holdsUnlistedEquity?: boolean
    hasFnOTrading?: boolean
    housePropertyCount?: number
    agriculturalIncome?: number
  }
}

export interface FilingDraft {
  financialYear: FinancialYear
  assessmentYear: string
  reconciliation: ReconciliationResult
  computation: TaxComputationResult
  itrSelection: ITRSelection
  context: FilingContext
  documents: LoadedDocuments
  /** Regime carried into the return — the override if given, else the engine's. */
  selectedRegime: "OLD" | "NEW"
}

/**
 * Runs the full pipeline for one financial year. Pure with respect to the
 * database beyond the reads it performs — persistence is a separate step so the
 * wizard can preview a change without committing it.
 */
export async function buildFilingDraft(
  db: ScopedDb,
  userId: string,
  financialYear: FinancialYear,
  options: BuildFilingOptions = {}
): Promise<FilingDraft> {
  const [documents, bankDerived, context] = await Promise.all([
    loadParsedDocuments(db, userId, financialYear),
    loadBankDerivedData(db, userId, financialYear),
    loadFilingContext(db, userId),
  ])

  const harmonised: HarmonisedTaxData = {
    financialYear,
    form16: documents.form16,
    ais: documents.ais,
    cas: documents.cas,
    bankDerived,
  }

  const reconciliation = harmoniseTaxSources(harmonised, {
    age: context.age,
    userDeductions: options.userDeductions,
    advanceTaxPaid: options.advanceTaxPaid,
  })

  // Capital gains and presumptive income can only come from the user — no
  // uploaded source in this app carries them reliably.
  const input = { ...reconciliation.input }
  if (options.capitalGains) {
    input.shortTermCapitalGains111A = options.capitalGains.stcg111A
    input.longTermCapitalGains112A = options.capitalGains.ltcg112A
    input.otherCapitalGains = options.capitalGains.otherCapitalGains
  }
  if (options.presumptive) {
    if (options.presumptive.scheme === "44ADA") {
      input.presumptiveIncome44ADA = options.presumptive.income
    } else {
      input.presumptiveIncome44AD = options.presumptive.income
    }
  }

  const computation = computeIndianTax(input)
  const selectedRegime = options.regimeOverride ?? computation.recommendedRegime

  const declarations = options.declarations ?? {}
  const hasCapitalGains =
    input.shortTermCapitalGains111A > 0 ||
    input.longTermCapitalGains112A > 0 ||
    input.otherCapitalGains > 0

  const taxpayer: TaxpayerProfile = {
    grossIncome: computation.grossTotalIncome,
    residentialStatus: "RESIDENT",
    age: context.age,
    hasSalaryIncome: input.salaryIncome > 0,
    housePropertyCount: declarations.housePropertyCount ?? context.housePropertyCount,
    hasBusinessIncome: Boolean(options.presumptive) || input.businessIncome > 0,
    hasPresumptiveIncome: Boolean(options.presumptive),
    presumptiveTurnover: options.presumptive?.turnover,
    presumptiveScheme: options.presumptive?.scheme,
    hasFnOTrading: declarations.hasFnOTrading ?? false,
    hasCapitalGains,
    hasForeignAssets: declarations.hasForeignAssets ?? false,
    hasForeignIncome: declarations.hasForeignIncome ?? false,
    agriculturalIncome: declarations.agriculturalIncome ?? 0,
    isCompanyDirector: declarations.isCompanyDirector ?? false,
    holdsUnlistedEquity: declarations.holdsUnlistedEquity ?? false,
  }

  const itrSelection = determineITRForm(taxpayer)

  return {
    financialYear,
    assessmentYear: assessmentYearFor(financialYear),
    reconciliation: { ...reconciliation, input },
    computation,
    itrSelection,
    context,
    documents,
    selectedRegime,
  }
}

/** Upserts the draft into tax_filings, keyed on (userId, financialYear). */
export async function persistFilingDraft(
  db: ScopedDb,
  userId: string,
  draft: FilingDraft,
  wizardInputs: BuildFilingOptions = {}
): Promise<void> {
  const chosen = draft.selectedRegime === "OLD" ? draft.computation.old : draft.computation.new

  const values = {
    userId,
    financialYear: draft.financialYear,
    assessmentYear: draft.assessmentYear,
    status: "reconciled" as const,
    itrForm: draft.itrSelection.form,
    itrFormRationale: {
      reasons: draft.itrSelection.reasons,
      disqualifiers: draft.itrSelection.disqualifiers,
      warnings: draft.itrSelection.warnings,
    },
    wizardInputs,
    computationInput: draft.reconciliation.input,
    computationResult: draft.computation,
    reconciliationFindings: draft.reconciliation.findings,
    selectedRegime: draft.selectedRegime,
    grossTotalIncome: String(Math.round(chosen.grossTotalIncome)),
    taxableIncome: String(Math.round(chosen.taxableIncome)),
    totalTaxPayable: String(Math.round(chosen.totalTaxPayable)),
    taxCreditClaimed: String(Math.round(draft.reconciliation.totalTaxCredit)),
    netPayable: String(Math.round(chosen.netPayable)),
    updatedAt: new Date(),
  }

  await db
    .insert(taxFilings)
    .values(values)
    .onConflictDoUpdate({
      target: [taxFilings.userId, taxFilings.financialYear],
      set: values,
    })
}

/** Parses and validates an `fy` query parameter, defaulting to the latest year. */
export function resolveFinancialYear(raw: string | null): FinancialYear | null {
  if (!raw) return "2025-2026"
  return normaliseFinancialYear(raw)
}

/**
 * Reads back the wizard inputs saved with a draft, so a rebuild triggered by a
 * new document upload does not discard what the user already declared.
 */
export async function loadWizardInputs(
  db: ScopedDb,
  userId: string,
  financialYear: FinancialYear
): Promise<BuildFilingOptions> {
  const [row] = await db
    .select({ wizardInputs: taxFilings.wizardInputs })
    .from(taxFilings)
    .where(and(eq(taxFilings.userId, userId), eq(taxFilings.financialYear, financialYear)))
    .limit(1)

  return (row?.wizardInputs as BuildFilingOptions | null) ?? {}
}
