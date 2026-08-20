/**
 * server/services/tax/reconciliation.ts
 *
 * Harmonises the tax sources into a single computation input, and reports where
 * they disagree.
 *
 * The reconciliation matters more than the arithmetic: a return that under-
 * reports interest the bank already told the department about is what triggers
 * a Sec 143(1)(a) adjustment notice. So rather than silently picking one source,
 * this module picks the *defensible* figure (generally the higher of what the
 * department already knows and what the taxpayer's own documents say) and
 * surfaces every divergence for the user to resolve.
 */

import {
  emptyDeductions,
  type DeductionInput,
  type FinancialYear,
  type HarmonisedTaxData,
  type TaxComputationInput,
} from "./types"

// ─── Findings ───────────────────────────────────────────────

export type FindingSeverity = "info" | "warning" | "critical"

export interface ReconciliationFinding {
  /** Short label, e.g. "Salary", "Savings bank interest", "TDS credit". */
  item: string
  severity: FindingSeverity
  /** What each source said. Absent sources are omitted. */
  values: Partial<Record<"form16" | "ais" | "bank" | "cas", number>>
  /** The figure carried into the return, and why. */
  adopted: number
  message: string
  /** Statutory hook, for the audit report. */
  citation?: string
}

export interface ReconciliationResult {
  input: TaxComputationInput
  findings: ReconciliationFinding[]
  /** Total TDS/tax credit assembled from all sources. */
  totalTaxCredit: number
  /** Sources that actually contributed. */
  sourcesUsed: string[]
  /** Set when a source is missing entirely and the figure may be incomplete. */
  gaps: string[]
}

/** Divergences below this are rounding noise, not a reporting problem. */
const MATERIALITY_THRESHOLD = 100

type SourceKey = "form16" | "ais" | "bank" | "cas"

function compare(
  item: string,
  values: Partial<Record<SourceKey, number>>,
  options: {
    citation?: string
    prefer?: "highest" | "form16"
    /**
     * Sources that inform the adopted figure but must not, on their own, raise
     * a divergence. Bank credits are net of TDS and of any salary deduction, so
     * they are always lower than certified gross salary — treating that gap as
     * a discrepancy would flag every single salaried user.
     */
    contextOnly?: SourceKey[]
  } = {}
): { adopted: number; finding: ReconciliationFinding | null } {
  const present = Object.entries(values).filter(([, v]) => typeof v === "number" && v > 0) as Array<[string, number]>

  if (present.length === 0) return { adopted: 0, finding: null }

  const contextOnly = new Set<string>(options.contextOnly ?? [])
  const authoritative = present.filter(([source]) => !contextOnly.has(source))
  // Fall back to every source when all of them are context-only, so a figure is
  // still adopted rather than silently dropped.
  const forComparison = authoritative.length > 0 ? authoritative : present

  const highest = Math.max(...forComparison.map(([, v]) => v))
  const lowest = Math.min(...forComparison.map(([, v]) => v))
  const adopted = options.prefer === "form16" && values.form16 ? values.form16 : highest

  if (forComparison.length === 1 || highest - lowest <= MATERIALITY_THRESHOLD) {
    return {
      adopted,
      finding: {
        item,
        severity: "info",
        values,
        adopted,
        message:
          forComparison.length === 1
            ? `Reported by ${forComparison[0]![0]} only: Rs. ${Math.round(adopted).toLocaleString("en-IN")}.`
            : `All sources agree within Rs. ${MATERIALITY_THRESHOLD}: Rs. ${Math.round(adopted).toLocaleString("en-IN")}.`,
        citation: options.citation,
      },
    }
  }

  const detail = forComparison
    .map(([source, value]) => `${source} Rs. ${Math.round(value).toLocaleString("en-IN")}`)
    .join(", ")

  return {
    adopted,
    finding: {
      item,
      severity: highest - lowest > 10000 ? "critical" : "warning",
      values,
      adopted,
      message: `Sources disagree (${detail}). The higher figure of Rs. ${Math.round(adopted).toLocaleString("en-IN")} has been adopted, because the department already holds the reported amount and under-reporting invites a Sec 143(1)(a) adjustment. Confirm which is correct before filing.`,
      citation: options.citation,
    },
  }
}

// ─── Chapter VI-A from Form 16 ──────────────────────────────

/**
 * Folds the Form 16 Chapter VI-A table into the engine's deduction shape.
 *
 * Sec 80CCC and 80CCD(1) share the 80CCE ceiling with 80C, so they are summed
 * into `section80C` and capped once by the engine. 80CCD(1B) and 80CCD(2) are
 * kept separate because they sit outside that ceiling.
 */
function deductionsFromForm16(chapterVIA: Record<string, number>): DeductionInput {
  const deductions = emptyDeductions()
  const get = (key: string) => chapterVIA[key] ?? 0

  deductions.section80C = get("80C") + get("80CCC") + get("80CCD(1)")
  deductions.section80CCD1B = get("80CCD(1B)")
  deductions.section80CCD2 = get("80CCD(2)")
  deductions.section80D = get("80D")
  deductions.section80DD = get("80DD")
  deductions.section80DDB = get("80DDB")
  deductions.section80E = get("80E")
  deductions.section80EEA = get("80EEA") + get("80EE")
  deductions.section80EEB = get("80EEB")
  deductions.section80G = get("80G") + get("80GGA")
  deductions.section80GG = get("80GG")
  deductions.section80TTA = get("80TTA")
  deductions.section80TTB = get("80TTB")
  deductions.section80U = get("80U")

  return deductions
}

// ─── Main harmoniser ────────────────────────────────────────

export interface HarmoniseOptions {
  age?: number
  /** Deduction amounts the user asserted in the wizard, which override parsed ones. */
  userDeductions?: Partial<DeductionInput>
  /** Advance tax and self-assessment tax already paid, beyond TDS. */
  advanceTaxPaid?: number
}

export function harmoniseTaxSources(
  data: HarmonisedTaxData,
  options: HarmoniseOptions = {}
): ReconciliationResult {
  const findings: ReconciliationFinding[] = []
  const gaps: string[] = []
  const sourcesUsed: string[] = []

  const { form16, ais, cas, bankDerived } = data
  if (form16) sourcesUsed.push("Form 16")
  if (ais) sourcesUsed.push(ais.documentType)
  if (cas) sourcesUsed.push("Mutual fund CAS")
  if (bankDerived) sourcesUsed.push("Bank statements")

  const record = (finding: ReconciliationFinding | null) => {
    if (finding) findings.push(finding)
  }

  // ── Salary ──
  // Form 16 gross salary is Sec 17(1)+17(2)+17(3); AIS reports the same figure
  // from the employer's TDS return, so a gap means one of them is incomplete
  // (most often a second employer the current Form 16 does not cover).
  const salaryComparison = compare(
    "Salary",
    {
      form16: form16 ? form16.grossSalary + form16.perquisites + form16.profitsInLieu : undefined,
      ais: ais?.totals.salary || undefined,
      bank: bankDerived?.salaryCredits || undefined,
    },
    { citation: "Sec 15–17, Income Tax Act 1961", contextOnly: ["bank"] }
  )
  record(salaryComparison.finding)

  if (ais && form16 && ais.totals.salary > 0) {
    const form16Salary = form16.grossSalary + form16.perquisites + form16.profitsInLieu
    if (ais.totals.salary - form16Salary > 10000) {
      findings.push({
        item: "Multiple employers",
        severity: "critical",
        values: { form16: form16Salary, ais: ais.totals.salary },
        adopted: ais.totals.salary,
        message:
          "AIS reports more salary than this Form 16 accounts for, which usually means you changed jobs during the year. Collect the Form 16 from every employer — filing on one of them under-reports income and understates tax.",
        citation: "Sec 192(2)",
      })
    }
  }

  const salaryIncome = salaryComparison.adopted

  // ── Interest income ──
  // Savings interest funds the 80TTA/80TTB claim, so it is tracked apart from
  // deposit interest, which has no corresponding deduction.
  const savingsComparison = compare(
    "Savings bank interest",
    {
      ais: ais?.totals.interestSavings || undefined,
      bank: bankDerived?.savingsInterest || undefined,
    },
    { citation: "Sec 56; deduction under Sec 80TTA/80TTB" }
  )
  record(savingsComparison.finding)

  const depositInterest = ais?.totals.interestDeposits ?? 0
  if (depositInterest > 0) {
    findings.push({
      item: "Deposit interest",
      severity: depositInterest > 40000 ? "warning" : "info",
      values: { ais: depositInterest },
      adopted: depositInterest,
      message:
        depositInterest > 40000
          ? `AIS reports Rs. ${Math.round(depositInterest).toLocaleString("en-IN")} of fixed/term deposit interest. Banks deduct TDS at 10% under Sec 194A above Rs. 40,000 (Rs. 50,000 for seniors) — confirm the credit appears in Schedule TDS, and note that no 80TTA deduction is available on deposit interest.`
          : `Deposit interest of Rs. ${Math.round(depositInterest).toLocaleString("en-IN")} from AIS.`,
      citation: "Sec 56 read with Sec 194A",
    })
  }

  const dividend = ais?.totals.dividend ?? 0
  if (dividend > 0) {
    findings.push({
      item: "Dividend",
      severity: "info",
      values: { ais: dividend },
      adopted: dividend,
      message: `Dividend of Rs. ${Math.round(dividend).toLocaleString("en-IN")} is taxable at slab rates in your hands and must be reported under other sources.`,
      citation: "Sec 56(2)(i); Sec 194 TDS at 10% above Rs. 5,000",
    })
  }

  // ── Rent ──
  const rentComparison = compare(
    "Rental income",
    {
      ais: ais?.totals.rent || undefined,
      bank: bankDerived?.rentalIncome || undefined,
    },
    { citation: "Sec 22–24", contextOnly: ["bank"] }
  )
  record(rentComparison.finding)

  // A let-out property gets the flat 30% standard deduction under Sec 24(a).
  const grossRent = rentComparison.adopted
  const housePropertyFromRent = grossRent > 0 ? grossRent * 0.7 : 0
  if (grossRent > 0) {
    findings.push({
      item: "House property standard deduction",
      severity: "info",
      values: {},
      adopted: grossRent * 0.3,
      message: `A flat 30% of net annual value (Rs. ${Math.round(grossRent * 0.3).toLocaleString("en-IN")}) is deductible under Sec 24(a) regardless of actual repairs incurred.`,
      citation: "Sec 24(a)",
    })
  }

  // Form 16 reports the self-occupied loss the employer already considered;
  // it nets against the let-out income above.
  const housePropertyIncome = housePropertyFromRent + (form16?.housePropertyIncome ?? 0)

  // ── Deductions ──
  const deductions = form16 ? deductionsFromForm16(form16.chapterVIA) : emptyDeductions()

  // ELSS purchases picked up from the CAS may already be inside the Form 16
  // 80C figure (employer-declared) — take the higher rather than adding, to
  // avoid double counting the same investment.
  if (cas && cas.totals.elss80CContribution > 0) {
    const fromForm16 = deductions.section80C
    const fromCAS = cas.totals.elss80CContribution
    if (fromCAS > fromForm16) {
      findings.push({
        item: "Section 80C — ELSS",
        severity: "warning",
        values: { form16: fromForm16, cas: fromCAS },
        adopted: fromCAS,
        message: `Your CAS shows Rs. ${Math.round(fromCAS).toLocaleString("en-IN")} of ELSS purchases in the year, more than the Rs. ${Math.round(fromForm16).toLocaleString("en-IN")} your employer certified. Investments made after the employer's declaration cut-off can still be claimed in the return.`,
        citation: "Sec 80C read with Sec 80CCE",
      })
      deductions.section80C = fromCAS
    }
  }

  // Bank-detected deduction signals only fill gaps; they never override a
  // certified Form 16 figure, which carries documentary backing.
  if (bankDerived?.detectedDeductions) {
    for (const [section, amount] of Object.entries(bankDerived.detectedDeductions)) {
      const key = mapSectionToKey(section)
      if (!key || amount <= 0) continue
      if (deductions[key] === 0) {
        deductions[key] = amount
        findings.push({
          item: `Section ${section}`,
          severity: "info",
          values: { bank: amount },
          adopted: amount,
          message: `Detected Rs. ${Math.round(amount).toLocaleString("en-IN")} of ${section} spending in your bank statements that your Form 16 does not claim. Keep the receipts — this claim is not employer-certified.`,
        })
      }
    }
  }

  // The 80TTA/80TTB claim can never exceed the interest actually earned.
  const savingsInterest = savingsComparison.adopted
  const age = options.age ?? 35
  if (age >= 60) {
    deductions.section80TTB = Math.max(deductions.section80TTB, Math.min(savingsInterest + depositInterest, 50000))
  } else {
    deductions.section80TTA = Math.max(deductions.section80TTA, Math.min(savingsInterest, 10000))
  }

  // User-asserted values win — they are the taxpayer's own declaration.
  if (options.userDeductions) {
    for (const [key, value] of Object.entries(options.userDeductions)) {
      if (typeof value === "number" && value >= 0) {
        deductions[key as keyof DeductionInput] = value
      }
    }
  }

  // ── Tax credits ──
  const form16Tds = form16?.totalTdsDeposited ?? 0
  const aisTds = ais?.totals.totalTds ?? 0
  const totalTaxCredit = Math.max(form16Tds, aisTds) + (options.advanceTaxPaid ?? 0)

  if (form16Tds > 0 && aisTds > 0 && Math.abs(form16Tds - aisTds) > MATERIALITY_THRESHOLD) {
    findings.push({
      item: "TDS credit",
      severity: "critical",
      values: { form16: form16Tds, ais: aisTds },
      adopted: Math.max(form16Tds, aisTds),
      message: `Form 16 certifies Rs. ${Math.round(form16Tds).toLocaleString("en-IN")} of TDS but AIS shows Rs. ${Math.round(aisTds).toLocaleString("en-IN")}. Only credit appearing in Form 26AS is allowable under Sec 199 — claim the 26AS figure and ask the deductor to correct their TDS return if it falls short.`,
      citation: "Sec 199 read with Rule 37BA",
    })
  }

  // ── Gaps ──
  if (!form16 && salaryIncome > 0) {
    gaps.push("No Form 16 was uploaded. Salary and TDS figures rely on AIS or bank credits and may not match the employer's certificate.")
  }
  if (!ais) {
    gaps.push("No AIS/TIS was uploaded, so interest, dividend and securities transactions the department already knows about could not be cross-checked. Download it from the e-filing portal before filing.")
  }
  if (ais && ais.totals.securitiesSaleValue > 0) {
    gaps.push(`AIS reports Rs. ${Math.round(ais.totals.securitiesSaleValue).toLocaleString("en-IN")} of securities sale proceeds. Capital gains must be computed from your broker's P&L statement — sale value alone is not gain, and this figure has NOT been included in the computation.`)
  }

  // ── Assemble the engine input ──
  const financialYear: FinancialYear = data.financialYear

  const input: TaxComputationInput = {
    financialYear,
    age,
    salaryIncome,
    hraExemption: form16?.exemptions.hra ?? 0,
    ltaExemption: form16?.exemptions.lta ?? 0,
    professionalTax: form16?.professionalTax ?? 0,
    housePropertyIncome,
    presumptiveIncome44ADA: 0,
    presumptiveIncome44AD: 0,
    businessIncome: 0,
    shortTermCapitalGains111A: 0,
    longTermCapitalGains112A: 0,
    otherCapitalGains: 0,
    otherSourcesIncome: depositInterest + dividend + (form16?.otherSourcesIncome ?? 0) + (ais?.totals.other ?? 0),
    savingsInterest,
    deductions,
    taxesPaid: totalTaxCredit,
  }

  return { input, findings, totalTaxCredit, sourcesUsed, gaps }
}

/** Maps a detected section label ("80D") to the DeductionInput key. */
function mapSectionToKey(section: string): keyof DeductionInput | null {
  const normalised = section.toUpperCase().replace(/\s/g, "")
  const map: Record<string, keyof DeductionInput> = {
    "80C": "section80C",
    "80CCD(1B)": "section80CCD1B",
    "80CCD(2)": "section80CCD2",
    "80D": "section80D",
    "80DD": "section80DD",
    "80DDB": "section80DDB",
    "80E": "section80E",
    "80EEA": "section80EEA",
    "80EEB": "section80EEB",
    "80G": "section80G",
    "80GG": "section80GG",
    "80TTA": "section80TTA",
    "80TTB": "section80TTB",
    "80U": "section80U",
    "24B": "section24b",
  }
  return map[normalised] ?? null
}
