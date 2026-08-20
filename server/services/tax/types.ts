/**
 * server/services/tax/types.ts
 *
 * Shared vocabulary for the tax subsystem: what the parsers produce, what the
 * statutory engine consumes, and what the ITR builder emits.
 *
 * Every monetary value is a plain number of rupees (not paise, not a string).
 * Parsers are responsible for normalising "1,23,456.78" into 123456.78.
 */

// ─── Financial years ────────────────────────────────────────

/** Financial years the statutory engine has slab tables for. */
export type FinancialYear = "2023-2024" | "2024-2025" | "2025-2026"

export type Regime = "OLD" | "NEW"

/** FY "2025-2026" → AY "2026-27", the value ITR JSON expects. */
export function assessmentYearFor(fy: FinancialYear): string {
  const [, endYear] = fy.split("-").map(Number)
  return `${endYear}-${String((endYear! + 1) % 100).padStart(2, "0")}`
}

/** Short display form used across the app's aggregates: "2025-26". */
export function shortFinancialYear(fy: FinancialYear): string {
  const [start, end] = fy.split("-")
  return `${start}-${end!.slice(2)}`
}

/** Accepts "2025-26" or "2025-2026" and normalises to the long form. */
export function normaliseFinancialYear(value: string): FinancialYear | null {
  const match = value.trim().match(/^(\d{4})-(\d{2}|\d{4})$/)
  if (!match) return null
  const start = Number(match[1])
  const end = match[2]!.length === 2 ? Number(`${String(start).slice(0, 2)}${match[2]}`) : Number(match[2])
  if (end !== start + 1) return null
  const candidate = `${start}-${end}` as FinancialYear
  return (["2023-2024", "2024-2025", "2025-2026"] as string[]).includes(candidate) ? candidate : null
}

/** The FY a given date falls in (Indian FY runs 1 April – 31 March). */
export function financialYearOf(date: Date): string {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 3 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

// ─── Chapter VI-A and other deductions ──────────────────────

export interface DeductionInput {
  /** Sec 80C — EPF, PPF, ELSS, LIC, principal repayment, tuition. Cap 1,50,000. */
  section80C: number
  /** Sec 80CCD(1B) — additional NPS Tier-1. Cap 50,000, over and above 80C. */
  section80CCD1B: number
  /** Sec 80CCD(2) — employer NPS. Allowed under BOTH regimes. */
  section80CCD2: number
  /** Sec 80D — health insurance, self/family + parents. Cap 25k–1,00,000. */
  section80D: number
  /** Sec 80DD — maintenance of a disabled dependant. 75,000 or 1,25,000. */
  section80DD: number
  /** Sec 80DDB — treatment of specified illnesses. 40,000 or 1,00,000. */
  section80DDB: number
  /** Sec 80E — interest on an education loan. No ceiling, 8 years. */
  section80E: number
  /** Sec 80EEA — affordable housing loan interest. Cap 1,50,000. */
  section80EEA: number
  /** Sec 80EEB — electric vehicle loan interest. Cap 1,50,000. */
  section80EEB: number
  /** Sec 80G — donations, already net of the 50%/100% qualifying rate. */
  section80G: number
  /** Sec 80GG — rent paid when no HRA is received. Cap 60,000. */
  section80GG: number
  /** Sec 80TTA — savings interest, non-seniors. Cap 10,000. */
  section80TTA: number
  /** Sec 80TTB — interest income for seniors. Cap 50,000. Overrides 80TTA. */
  section80TTB: number
  /** Sec 80U — taxpayer's own disability. 75,000 or 1,25,000. */
  section80U: number
  /** Sec 24(b) — home loan interest. Cap 2,00,000 for a self-occupied house. */
  section24b: number
  /** Anything else the user asserts; passed through uncapped. */
  otherDeductions: number
}

export function emptyDeductions(): DeductionInput {
  return {
    section80C: 0,
    section80CCD1B: 0,
    section80CCD2: 0,
    section80D: 0,
    section80DD: 0,
    section80DDB: 0,
    section80E: 0,
    section80EEA: 0,
    section80EEB: 0,
    section80G: 0,
    section80GG: 0,
    section80TTA: 0,
    section80TTB: 0,
    section80U: 0,
    section24b: 0,
    otherDeductions: 0,
  }
}

// ─── Engine input / output ──────────────────────────────────

export interface TaxComputationInput {
  financialYear: FinancialYear
  /** 60+ gets a higher basic exemption under the old regime; 80+ higher still. */
  age?: number

  // Head 1 — Salary (Sec 15–17)
  salaryIncome: number
  hraExemption: number
  ltaExemption: number
  professionalTax: number

  // Head 2 — House Property (Sec 22–27). Negative when loan interest exceeds rent.
  housePropertyIncome: number

  // Head 3 — PGBP (Sec 28–44)
  presumptiveIncome44ADA: number
  presumptiveIncome44AD: number
  businessIncome: number

  // Head 4 — Capital Gains (Sec 45–55A), each taxed at its own special rate
  shortTermCapitalGains111A: number
  longTermCapitalGains112A: number
  /** STCG/LTCG taxed at slab rates (debt funds post-Apr-2023, unlisted, etc). */
  otherCapitalGains: number

  // Head 5 — Other Sources (Sec 56–59)
  otherSourcesIncome: number
  /** Savings-bank interest, tracked separately to size the 80TTA/80TTB claim. */
  savingsInterest: number

  deductions: DeductionInput

  /** Taxes already paid: TDS, TCS, advance tax and self-assessment tax. */
  taxesPaid?: number
}

export interface RegimeComputation {
  regime: Regime
  grossTotalIncome: number
  totalDeductions: number
  taxableIncome: number
  /** Portion of taxable income charged at slab rates. */
  slabIncome: number
  /** Tax on slab income before rebate. */
  slabTax: number
  /** Tax on capital gains charged at special rates (111A / 112A). */
  specialRateTax: number
  taxBeforeRebate: number
  rebate87A: number
  taxAfterRebate: number
  surcharge: number
  /** Relief where surcharge exceeds the income crossing the threshold. */
  marginalRelief: number
  cess: number
  totalTaxPayable: number
  /** totalTaxPayable minus taxesPaid; negative means a refund is due. */
  netPayable: number
  /** Human-readable trace of every step, for the audit report. */
  workings: string[]
}

export interface TaxComputationResult {
  financialYear: FinancialYear
  assessmentYear: string
  grossTotalIncome: number

  old: RegimeComputation
  new: RegimeComputation

  recommendedRegime: Regime
  savingsWithRecommended: number

  totalDeductionsOld: number
  totalDeductionsNew: number
  taxableIncomeOld: number
  taxableIncomeNew: number
  totalTaxPayableOld: number
  totalTaxPayableNew: number

  breakdown: string[]
}

// ─── Parsed source documents ────────────────────────────────

export interface Form16Data {
  /** Sec 17(1) salary as per provisions. */
  grossSalary: number
  /** Sec 17(2) perquisites. */
  perquisites: number
  /** Sec 17(3) profits in lieu of salary. */
  profitsInLieu: number
  /** Sec 10 exemptions, itemised where the PDF names them. */
  exemptions: {
    hra: number
    lta: number
    gratuity: number
    other: number
    total: number
  }
  /** Sec 16(ia) standard deduction as certified by the employer. */
  standardDeduction: number
  /** Sec 16(iii) professional tax. */
  professionalTax: number
  /** Sec 24(b) loss from house property reported to the employer. */
  housePropertyIncome: number
  otherSourcesIncome: number
  /** Chapter VI-A amounts as certified, keyed by section label ("80C"). */
  chapterVIA: Record<string, number>
  /** Total TDS deposited against the employee's PAN. */
  totalTdsDeposited: number
  employer: {
    name?: string
    tan?: string
    pan?: string
  }
  employee: {
    name?: string
    pan?: string
  }
  assessmentYear?: string
  /** Quarterly TDS rows from Part A, used for the 26AS reconciliation. */
  quarterlyTds: Array<{ quarter: string; receiptNumber?: string; amountDeposited: number }>
  /** Fields the parser could not locate, surfaced to the user for confirmation. */
  missingFields: string[]
  /** 0–1 heuristic: share of expected anchors found in the document. */
  confidence: number
}

export interface AISEntry {
  /** Information category as reported, e.g. "Salary", "Interest from savings bank". */
  category: string
  /** Deductor / reporting entity name. */
  source?: string
  amount: number
  tdsDeducted: number
  /** Section under which tax was deducted, e.g. "192", "194A". */
  section?: string
}

export interface AISData {
  pan?: string
  financialYear?: string
  entries: AISEntry[]
  totals: {
    salary: number
    interestSavings: number
    interestDeposits: number
    dividend: number
    rent: number
    securitiesSaleValue: number
    mutualFundPurchases: number
    other: number
    totalTds: number
  }
  /** "AIS" (detailed) or "TIS" (summary). */
  documentType: "AIS" | "TIS"
  parseWarnings: string[]
}

export interface CASHolding {
  amc: string
  schemeName: string
  folioNumber: string
  isin?: string
  units: number
  /** NAV on the statement date. */
  currentNav: number
  /** Total cost of the units still held. */
  investedValue: number
  currentValue: number
  category: "EQUITY" | "DEBT" | "HYBRID" | "ELSS" | "OTHER"
  /** ELSS holdings feed the Sec 80C total automatically. */
  isELSS: boolean
}

export interface CASData {
  investorPan?: string
  investorEmail?: string
  statementPeriod?: { from: string; to: string }
  holdings: CASHolding[]
  totals: {
    invested: number
    current: number
    /** Sum of ELSS purchases inside the requested FY, i.e. the 80C claim. */
    elss80CContribution: number
  }
  parseWarnings: string[]
}

/** Everything the filing wizard needs, harmonised across sources. */
export interface HarmonisedTaxData {
  financialYear: FinancialYear
  form16?: Form16Data
  ais?: AISData
  cas?: CASData
  /** Deduction and income signals detected from bank transactions. */
  bankDerived?: {
    salaryCredits: number
    savingsInterest: number
    rentalIncome: number
    detectedDeductions: Record<string, number>
  }
}
