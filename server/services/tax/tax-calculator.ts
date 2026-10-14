/**
 * server/services/tax/tax-calculator.ts
 *
 * Deterministic Indian income tax engine — the "zero hallucination" half of the
 * Virtual CA. Every rupee the LLM quotes must originate here; the model is only
 * allowed to explain these numbers, never to compute them.
 *
 * Scope, stated honestly:
 * - Five heads of income, both regimes, FY 2023-24 through FY 2025-26.
 * - Chapter VI-A ceilings, Sec 87A rebate (with marginal relief), surcharge
 *   (with marginal relief and the 15% cap on 111A/112A income), and 4% cess.
 * - Capital gains at their special rates under Sec 111A and 112A.
 *
 * Deliberately NOT modelled (the caller must handle these separately):
 * - Indexation for pre-23-July-2024 property transfers and the taxpayer's
 *   option between 20%-with-indexation and 12.5%-without.
 * - The intra-year rate split in FY 2024-25, where transfers before
 *   23 July 2024 are taxed at the old 15%/10% rates. This engine applies the
 *   post-Budget rates to the whole year; see `RATE_SPLIT_CAVEAT`.
 * - Sec 54/54F/54EC roll-over exemptions, AMT/MAT, clubbing, and set-off of
 *   brought-forward losses.
 */

import {
  assessmentYearFor,
  type DeductionInput,
  type FinancialYear,
  type RegimeComputation,
  type Regime,
  type TaxComputationInput,
  type TaxComputationResult,
} from "./types"

export const RATE_SPLIT_CAVEAT =
  "For FY 2024-25, transfers made before 23 July 2024 are taxed at the pre-Budget rates (STCG 15%, LTCG 10% over Rs. 1,00,000). This computation applies the post-Budget rates to the full year, so gains realised earlier in that year may be overstated."

// ─── Slab tables ────────────────────────────────────────────

interface Slab {
  /** Income above this amount is charged at `rate`. */
  from: number
  rate: number
}

/**
 * Old regime: basic exemption varies with age, the rest of the ladder does not.
 * A super senior's exemption reaches 5L, so the 5% band disappears and income
 * above 5L goes straight to 20%.
 */
function oldRegimeSlabs(age: number): Slab[] {
  if (age >= 80) {
    return [
      { from: 500000, rate: 0.2 },
      { from: 1000000, rate: 0.3 },
    ]
  }
  return [
    { from: age >= 60 ? 300000 : 250000, rate: 0.05 },
    { from: 500000, rate: 0.2 },
    { from: 1000000, rate: 0.3 },
  ]
}

/** New regime (Sec 115BAC). Age-neutral by design. */
const NEW_REGIME_SLABS: Record<FinancialYear, Slab[]> = {
  "2023-2024": [
    { from: 300000, rate: 0.05 },
    { from: 600000, rate: 0.1 },
    { from: 900000, rate: 0.15 },
    { from: 1200000, rate: 0.2 },
    { from: 1500000, rate: 0.3 },
  ],
  "2024-2025": [
    { from: 300000, rate: 0.05 },
    { from: 700000, rate: 0.1 },
    { from: 1000000, rate: 0.15 },
    { from: 1200000, rate: 0.2 },
    { from: 1500000, rate: 0.3 },
  ],
  // Finance Act 2025 rebuilt the ladder and raised the entry threshold to 4L.
  "2025-2026": [
    { from: 400000, rate: 0.05 },
    { from: 800000, rate: 0.1 },
    { from: 1200000, rate: 0.15 },
    { from: 1600000, rate: 0.2 },
    { from: 2000000, rate: 0.25 },
    { from: 2400000, rate: 0.3 },
  ],
}

/** Sec 16(ia) standard deduction against salary. */
const STANDARD_DEDUCTION: Record<FinancialYear, { old: number; new: number }> = {
  "2023-2024": { old: 50000, new: 50000 },
  "2024-2025": { old: 50000, new: 75000 },
  "2025-2026": { old: 50000, new: 75000 },
}

/** Sec 87A: taxable-income ceiling and the maximum rebate at that ceiling. */
const REBATE_87A: Record<FinancialYear, { old: { limit: number; max: number }; new: { limit: number; max: number } }> = {
  "2023-2024": { old: { limit: 500000, max: 12500 }, new: { limit: 700000, max: 25000 } },
  "2024-2025": { old: { limit: 500000, max: 12500 }, new: { limit: 700000, max: 25000 } },
  "2025-2026": { old: { limit: 500000, max: 12500 }, new: { limit: 1200000, max: 60000 } },
}

/** Capital gains special rates. Keyed by FY because Budget 2024 changed both. */
const CAPITAL_GAINS_RATES: Record<FinancialYear, { stcg111A: number; ltcg112A: number; ltcg112AExemption: number }> = {
  "2023-2024": { stcg111A: 0.15, ltcg112A: 0.1, ltcg112AExemption: 100000 },
  "2024-2025": { stcg111A: 0.2, ltcg112A: 0.125, ltcg112AExemption: 125000 },
  "2025-2026": { stcg111A: 0.2, ltcg112A: 0.125, ltcg112AExemption: 125000 },
}

/**
 * Surcharge bands on total income. The 37% top band was withdrawn under the new
 * regime, which caps at 25%.
 */
const SURCHARGE_BANDS = [
  { threshold: 5000000, rate: 0.1 },
  { threshold: 10000000, rate: 0.15 },
  { threshold: 20000000, rate: 0.25 },
  { threshold: 50000000, rate: 0.37 },
] as const

/** Surcharge on 111A/112A income is capped at 15% regardless of total income. */
const SPECIAL_RATE_SURCHARGE_CAP = 0.15

const CESS_RATE = 0.04

// ─── Chapter VI-A ceilings ──────────────────────────────────

/**
 * Applies the statutory caps and returns the total deductible amount under the
 * old regime, plus a line-by-line trace.
 *
 * Sec 80C, 80CCC and 80CCD(1) share a single Rs. 1,50,000 ceiling under Sec
 * 80CCE; 80CCD(1B) sits above it. The caller passes an already-combined 80C
 * figure, so the cap is applied once here.
 */
function applyChapterVIACaps(
  deductions: DeductionInput,
  grossTotalIncome: number,
  age: number,
  parentsSenior: boolean
): { total: number; capped: Record<string, number>; workings: string[] } {
  const workings: string[] = []
  const capped: Record<string, number> = {}

  const cap = (label: string, claimed: number, ceiling: number | null) => {
    const allowed = ceiling === null ? Math.max(0, claimed) : Math.min(Math.max(0, claimed), ceiling)
    if (claimed > 0) {
      capped[label] = allowed
      workings.push(
        ceiling !== null && claimed > ceiling
          ? `${label}: claimed ${fmt(claimed)}, restricted to the statutory ceiling of ${fmt(ceiling)}`
          : `${label}: ${fmt(allowed)}`
      )
    }
    return allowed
  }

  const isSenior = age >= 60

  // Sec 80D has separate ceilings for the taxpayer's family and for parents.
  // A combined figure (Form 16 reports one) gets the most the section allows
  // without knowing the parents' age.
  const section80D =
    deductions.section80DParents === undefined
      ? cap("Sec 80D — health insurance (self, family and parents)", deductions.section80D, isSenior ? 100000 : 75000)
      : cap("Sec 80D — health insurance (self and family)", deductions.section80D, isSenior ? 50000 : 25000) +
        cap("Sec 80D — health insurance (parents)", deductions.section80DParents, parentsSenior ? 50000 : 25000)

  const total =
    cap("Sec 80C / 80CCC / 80CCD(1)", deductions.section80C, 150000) +
    cap("Sec 80CCD(1B) — NPS", deductions.section80CCD1B, 50000) +
    cap("Sec 80CCD(2) — employer NPS", deductions.section80CCD2, null) +
    section80D +
    cap("Sec 80DD — disabled dependant", deductions.section80DD, 125000) +
    cap("Sec 80DDB — specified illness", deductions.section80DDB, isSenior ? 100000 : 40000) +
    cap("Sec 80E — education loan interest", deductions.section80E, null) +
    cap("Sec 80EEA — affordable housing interest", deductions.section80EEA, 150000) +
    cap("Sec 80EEB — electric vehicle loan interest", deductions.section80EEB, 150000) +
    cap("Sec 80G — donations", deductions.section80G, null) +
    cap("Sec 80GG — rent paid without HRA", deductions.section80GG, 60000) +
    // 80TTB replaces 80TTA for seniors; claiming both is not permitted.
    (isSenior
      ? cap("Sec 80TTB — interest income (senior)", Math.max(deductions.section80TTB, deductions.section80TTA), 50000)
      : cap("Sec 80TTA — savings interest", deductions.section80TTA, 10000)) +
    cap("Sec 80U — taxpayer's disability", deductions.section80U, 125000) +
    cap("Other deductions", deductions.otherDeductions, null)

  // Chapter VI-A deductions cannot create or increase a loss: they are capped
  // at gross total income (Sec 80A(2)).
  const allowed = Math.min(total, Math.max(0, grossTotalIncome))
  if (allowed < total) {
    workings.push(
      `Chapter VI-A total restricted from ${fmt(total)} to ${fmt(allowed)} — deductions cannot exceed gross total income (Sec 80A(2)).`
    )
  }

  return { total: allowed, capped, workings }
}

// ─── Primitives ─────────────────────────────────────────────

function fmt(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`
}

/** Progressive slab tax on an amount. */
function slabTax(income: number, slabs: Slab[]): number {
  if (income <= 0) return 0
  let tax = 0

  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i]!
    const next = slabs[i + 1]?.from ?? Infinity
    if (income <= slab.from) break
    tax += (Math.min(income, next) - slab.from) * slab.rate
  }

  return tax
}

/**
 * Surcharge with marginal relief.
 *
 * Marginal relief ensures the extra tax from crossing a threshold never exceeds
 * the income by which it was crossed. It is computed against the tax that would
 * have been payable exactly at the threshold — including the surcharge of the
 * band below it, which applies at that income.
 */
function computeSurcharge(
  totalIncome: number,
  taxOnSlabIncome: number,
  taxOnSpecialRateIncome: number,
  regime: Regime,
  taxAtThreshold: (threshold: number) => { slab: number; special: number }
): { surcharge: number; marginalRelief: number; note?: string } {
  const bands = regime === "NEW"
    ? SURCHARGE_BANDS.filter((b) => b.rate <= 0.25)
    : SURCHARGE_BANDS

  let applicable: (typeof SURCHARGE_BANDS)[number] | null = null
  let below: (typeof SURCHARGE_BANDS)[number] | null = null
  for (const band of bands) {
    if (totalIncome > band.threshold) {
      below = applicable
      applicable = band
    }
  }

  if (!applicable) return { surcharge: 0, marginalRelief: 0 }

  // Sec 111A/112A income never bears surcharge above 15%.
  const generalRate = applicable.rate
  const specialRate = Math.min(applicable.rate, SPECIAL_RATE_SURCHARGE_CAP)
  const surcharge = taxOnSlabIncome * generalRate + taxOnSpecialRateIncome * specialRate

  // Marginal relief: tax + surcharge at this income must not exceed
  // (tax at the threshold) + (income above the threshold).
  const totalTax = taxOnSlabIncome + taxOnSpecialRateIncome + surcharge
  const atThreshold = taxAtThreshold(applicable.threshold)
  const belowRate = below?.rate ?? 0
  const taxWithSurchargeAtThreshold =
    atThreshold.slab * (1 + belowRate) +
    atThreshold.special * (1 + Math.min(belowRate, SPECIAL_RATE_SURCHARGE_CAP))
  const ceiling = taxWithSurchargeAtThreshold + (totalIncome - applicable.threshold)
  const marginalRelief = Math.max(0, totalTax - ceiling)

  return {
    surcharge: surcharge - marginalRelief,
    marginalRelief,
    note:
      marginalRelief > 0
        ? `Marginal relief of ${fmt(marginalRelief)} applied — surcharge at the ${(generalRate * 100).toFixed(0)}% band would otherwise exceed the income above ${fmt(applicable.threshold)}.`
        : undefined,
  }
}

/**
 * Sec 87A rebate, including the marginal relief that applies just above the
 * new-regime threshold (the band where a rupee of extra income would otherwise
 * cost tens of thousands in tax).
 */
function computeRebate87A(
  taxableIncome: number,
  taxBeforeRebate: number,
  specialRateTax: number,
  fy: FinancialYear,
  regime: Regime,
  slabs: Slab[]
): { rebate: number; marginalRelief: number; note?: string } {
  const config = regime === "OLD" ? REBATE_87A[fy].old : REBATE_87A[fy].new

  if (taxableIncome <= config.limit) {
    // The rebate is not available against capital gains taxed under Sec 112A,
    // so it is limited to tax on slab income.
    const rebateable = Math.max(0, taxBeforeRebate - specialRateTax)
    const rebate = Math.min(rebateable, config.max)
    return {
      rebate,
      marginalRelief: 0,
      note: rebate > 0 ? `Sec 87A rebate of ${fmt(rebate)} — taxable income is within ${fmt(config.limit)}.` : undefined,
    }
  }

  // Marginal relief above the threshold exists only under the new regime.
  if (regime !== "NEW") return { rebate: 0, marginalRelief: 0 }

  const excess = taxableIncome - config.limit
  const taxAtLimit = slabTax(config.limit, slabs)
  const rebateAtLimit = Math.min(taxAtLimit, config.max)
  const ceiling = taxAtLimit - rebateAtLimit + excess

  const relief = Math.max(0, taxBeforeRebate - specialRateTax - ceiling)
  return {
    rebate: 0,
    marginalRelief: relief,
    note:
      relief > 0
        ? `Marginal relief of ${fmt(relief)} under Sec 87A — tax is limited to the ${fmt(excess)} by which income exceeds ${fmt(config.limit)}.`
        : undefined,
  }
}

// ─── Per-regime computation ─────────────────────────────────

function computeRegime(input: TaxComputationInput, regime: Regime): RegimeComputation {
  const fy = input.financialYear
  const age = input.age ?? 35
  const workings: string[] = []
  const isOld = regime === "OLD"

  const rates = CAPITAL_GAINS_RATES[fy]
  const standardDeduction = isOld ? STANDARD_DEDUCTION[fy].old : STANDARD_DEDUCTION[fy].new
  const slabs = isOld ? oldRegimeSlabs(age) : NEW_REGIME_SLABS[fy]

  // ── Head 1: Salary (Sec 15–17) ──
  // HRA (Sec 10(13A)), LTA (Sec 10(5)) and professional tax (Sec 16(iii)) are
  // withdrawn under the new regime; the standard deduction survives in both.
  const grossSalary = Math.max(0, input.salaryIncome)
  const salaryExemptions = isOld
    ? input.hraExemption + input.ltaExemption + input.professionalTax
    : 0
  const netSalary = Math.max(0, grossSalary - salaryExemptions - (grossSalary > 0 ? standardDeduction : 0))

  if (grossSalary > 0) {
    workings.push(
      isOld
        ? `Salary ${fmt(grossSalary)} less HRA/LTA/professional tax ${fmt(salaryExemptions)} and standard deduction ${fmt(standardDeduction)} = ${fmt(netSalary)}`
        : `Salary ${fmt(grossSalary)} less standard deduction ${fmt(standardDeduction)} = ${fmt(netSalary)} (HRA, LTA and professional tax are not available under the new regime)`
    )
  }

  // ── Head 2: House property (Sec 22–27) ──
  // Self-occupied home loan interest (Sec 24(b)) is capped at Rs. 2,00,000, and
  // the resulting loss can be set off against other heads only up to
  // Rs. 2,00,000 (Sec 71(3A)). Neither is available under the new regime.
  const homeLoanInterest = isOld ? Math.min(Math.max(0, input.deductions.section24b), 200000) : 0
  const housePropertyBeforeSetOffCap = input.housePropertyIncome - homeLoanInterest
  const houseProperty = isOld
    ? Math.max(housePropertyBeforeSetOffCap, -200000)
    : Math.max(0, input.housePropertyIncome)
  if (input.deductions.section24b > 0) {
    workings.push(
      isOld
        ? input.deductions.section24b > 200000
          ? `Sec 24(b) home loan interest: claimed ${fmt(input.deductions.section24b)}, restricted to the statutory ceiling of ${fmt(200000)}`
          : `Sec 24(b) home loan interest: ${fmt(homeLoanInterest)}`
        : "Sec 24(b) interest on a self-occupied house is not available under the new regime"
    )
  }
  if (input.housePropertyIncome !== 0 || homeLoanInterest > 0) {
    workings.push(
      isOld
        ? houseProperty > housePropertyBeforeSetOffCap
          ? `House property: loss of ${fmt(-housePropertyBeforeSetOffCap)} restricted to ${fmt(200000)} for set-off against other income (Sec 71(3A))`
          : `House property: ${fmt(houseProperty)}`
        : `House property: ${fmt(houseProperty)} (a self-occupied loss cannot be set off under the new regime)`
    )
  }

  // ── Head 3: PGBP (Sec 28–44) ──
  const pgbp = input.presumptiveIncome44ADA + input.presumptiveIncome44AD + input.businessIncome
  if (pgbp > 0) workings.push(`Business and professional income: ${fmt(pgbp)}`)

  // ── Head 4: Capital gains (Sec 45–55A) ──
  const stcg111A = Math.max(0, input.shortTermCapitalGains111A)
  const ltcg112AGross = Math.max(0, input.longTermCapitalGains112A)
  const ltcg112ATaxable = Math.max(0, ltcg112AGross - rates.ltcg112AExemption)
  const otherCapitalGains = Math.max(0, input.otherCapitalGains)

  if (ltcg112AGross > 0) {
    workings.push(
      `LTCG under Sec 112A: ${fmt(ltcg112AGross)} less the ${fmt(rates.ltcg112AExemption)} annual exemption = ${fmt(ltcg112ATaxable)} taxable at ${(rates.ltcg112A * 100).toFixed(1)}%`
    )
  }
  if (stcg111A > 0) {
    workings.push(`STCG under Sec 111A: ${fmt(stcg111A)} taxable at ${(rates.stcg111A * 100).toFixed(0)}%`)
  }

  // ── Head 5: Other sources (Sec 56–59) ──
  const otherSources = Math.max(0, input.otherSourcesIncome) + Math.max(0, input.savingsInterest)
  if (otherSources > 0) workings.push(`Other sources (interest, dividends): ${fmt(otherSources)}`)

  // ── Gross total income ──
  const grossTotalIncome =
    netSalary + houseProperty + pgbp + otherSources + otherCapitalGains + stcg111A + ltcg112ATaxable

  // ── Chapter VI-A ──
  // The new regime allows only Sec 80CCD(2) (employer NPS) and Sec 80JJAA.
  let totalDeductions: number
  if (isOld) {
    const result = applyChapterVIACaps(deductionsAgainstSlabIncome(input.deductions), grossTotalIncome, age, input.parentsSenior ?? false)
    totalDeductions = result.total
    workings.push(...result.workings)
  } else {
    totalDeductions = Math.max(0, input.deductions.section80CCD2)
    if (totalDeductions > 0) {
      workings.push(`Sec 80CCD(2) employer NPS ${fmt(totalDeductions)} — the only Chapter VI-A deduction available under the new regime`)
    }
  }

  // Chapter VI-A deductions cannot be set off against income taxed at special
  // rates (Sec 112A/111A), so they only reduce slab income.
  const slabIncomeBeforeDeductions = Math.max(0, grossTotalIncome - stcg111A - ltcg112ATaxable)
  const deductionsAllowed = Math.min(totalDeductions, slabIncomeBeforeDeductions)
  if (deductionsAllowed < totalDeductions) {
    workings.push(
      `Deductions restricted to ${fmt(deductionsAllowed)} — Chapter VI-A cannot be set off against capital gains taxed at special rates.`
    )
  }

  const slabIncome = Math.max(0, slabIncomeBeforeDeductions - deductionsAllowed)
  const taxableIncome = slabIncome + stcg111A + ltcg112ATaxable

  // ── Basic exemption set-off against special-rate gains ──
  // Provisos to Sec 111A(1) and 112A(2): where a resident individual's other
  // income falls short of the basic exemption limit, the shortfall may be set
  // off against capital gains taxed at special rates. Applied to the
  // higher-taxed gain first, which is the assessee-favourable order.
  const basicExemption = slabs[0]?.from ?? 0
  let unexhaustedExemption = Math.max(0, basicExemption - slabIncome)

  const [higherRateGain, lowerRateGain] =
    rates.stcg111A >= rates.ltcg112A
      ? ([{ amount: stcg111A, rate: rates.stcg111A }, { amount: ltcg112ATaxable, rate: rates.ltcg112A }] as const)
      : ([{ amount: ltcg112ATaxable, rate: rates.ltcg112A }, { amount: stcg111A, rate: rates.stcg111A }] as const)

  const higherOffset = Math.min(unexhaustedExemption, higherRateGain.amount)
  unexhaustedExemption -= higherOffset
  const lowerOffset = Math.min(unexhaustedExemption, lowerRateGain.amount)

  const exemptionOffset = higherOffset + lowerOffset
  if (exemptionOffset > 0) {
    workings.push(
      `Unexhausted basic exemption of ${fmt(exemptionOffset)} set off against capital gains taxed at special rates (provisos to Sec 111A and 112A).`
    )
  }

  // ── Tax ──
  const taxOnSlabIncome = slabTax(slabIncome, slabs)
  const specialRateTax =
    (higherRateGain.amount - higherOffset) * higherRateGain.rate +
    (lowerRateGain.amount - lowerOffset) * lowerRateGain.rate
  const taxBeforeRebate = taxOnSlabIncome + specialRateTax

  workings.push(`Tax on slab income ${fmt(slabIncome)}: ${fmt(taxOnSlabIncome)}`)
  if (specialRateTax > 0) workings.push(`Tax on capital gains at special rates: ${fmt(specialRateTax)}`)

  // ── Sec 87A ──
  const rebateResult = computeRebate87A(taxableIncome, taxBeforeRebate, specialRateTax, fy, regime, slabs)
  if (rebateResult.note) workings.push(rebateResult.note)

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebateResult.rebate - rebateResult.marginalRelief)

  // ── Surcharge ──
  // Recomputes tax at a threshold with the same structure, for marginal relief.
  const taxAtThreshold = (threshold: number): { slab: number; special: number } => {
    const specialPortion = Math.min(threshold, stcg111A + ltcg112ATaxable)
    const slabPortion = Math.max(0, threshold - specialPortion)
    const specialShare = stcg111A + ltcg112ATaxable > 0
      ? specialPortion * (specialRateTax / (stcg111A + ltcg112ATaxable))
      : 0
    return { slab: slabTax(slabPortion, slabs), special: specialShare }
  }

  const surchargeResult = computeSurcharge(
    taxableIncome,
    Math.max(0, taxAfterRebate - specialRateTax),
    Math.min(specialRateTax, taxAfterRebate),
    regime,
    taxAtThreshold
  )
  if (surchargeResult.note) workings.push(surchargeResult.note)

  // ── Cess ──
  const cess = (taxAfterRebate + surchargeResult.surcharge) * CESS_RATE
  const totalTaxPayable = Math.round(taxAfterRebate + surchargeResult.surcharge + cess)

  workings.push(`Health and education cess at 4%: ${fmt(cess)}`)
  workings.push(`Total tax payable under the ${isOld ? "old" : "new"} regime: ${fmt(totalTaxPayable)}`)

  const netPayable = Math.round(totalTaxPayable - (input.taxesPaid ?? 0))

  return {
    regime,
    grossTotalIncome,
    totalDeductions: deductionsAllowed,
    taxableIncome,
    slabIncome,
    slabTax: taxOnSlabIncome,
    specialRateTax,
    taxBeforeRebate,
    rebate87A: rebateResult.rebate,
    taxAfterRebate,
    surcharge: surchargeResult.surcharge,
    marginalRelief: rebateResult.marginalRelief + surchargeResult.marginalRelief,
    cess,
    totalTaxPayable,
    netPayable,
    workings,
  }
}

/**
 * The engine takes a single combined `section80C` figure. Employee NPS under
 * Sec 80CCD(1) shares the 80CCE ceiling with it, so callers that track it
 * separately should have already folded it in; this indirection exists so that
 * the shape stays explicit at the call site.
 */
function deductionsAgainstSlabIncome(deductions: DeductionInput): DeductionInput {
  return deductions
}

// ─── Input sanitisation ─────────────────────────────────────

/** Professional tax cannot exceed Rs. 2,500 a year (Art. 276(2) of the Constitution). */
const PROFESSIONAL_TAX_CEILING = 2500

/** A non-finite amount (NaN, Infinity) would poison every figure downstream. */
function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function nonNegative(value: number): number {
  return Math.max(0, finiteOrZero(value))
}

/**
 * Callers validate their own inputs, but the engine is the last line before a
 * figure reaches a return, so it does not trust them. House property and
 * business income may legitimately be negative (a loss).
 */
function sanitiseInput(input: TaxComputationInput): TaxComputationInput {
  const deductions = Object.fromEntries(
    // An absent optional field (section80DParents) must stay absent: it selects
    // the combined 80D ceiling, and 0 would select the split one.
    Object.entries(input.deductions)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, nonNegative(value as number)])
  ) as unknown as DeductionInput

  return {
    ...input,
    age: input.age === undefined ? undefined : nonNegative(input.age),
    salaryIncome: nonNegative(input.salaryIncome),
    hraExemption: nonNegative(input.hraExemption),
    ltaExemption: nonNegative(input.ltaExemption),
    professionalTax: Math.min(nonNegative(input.professionalTax), PROFESSIONAL_TAX_CEILING),
    housePropertyIncome: finiteOrZero(input.housePropertyIncome),
    presumptiveIncome44ADA: nonNegative(input.presumptiveIncome44ADA),
    presumptiveIncome44AD: nonNegative(input.presumptiveIncome44AD),
    // A business loss is a real figure; only non-finite values are rejected.
    businessIncome: finiteOrZero(input.businessIncome),
    shortTermCapitalGains111A: nonNegative(input.shortTermCapitalGains111A),
    longTermCapitalGains112A: nonNegative(input.longTermCapitalGains112A),
    otherCapitalGains: nonNegative(input.otherCapitalGains),
    otherSourcesIncome: nonNegative(input.otherSourcesIncome),
    savingsInterest: nonNegative(input.savingsInterest),
    deductions,
    taxesPaid: input.taxesPaid === undefined ? undefined : nonNegative(input.taxesPaid),
  }
}

// ─── Public entry point ─────────────────────────────────────

export function computeIndianTax(rawInput: TaxComputationInput): TaxComputationResult {
  const input = sanitiseInput(rawInput)
  const old = computeRegime(input, "OLD")
  const neu = computeRegime(input, "NEW")

  const recommendedRegime: Regime = old.totalTaxPayable <= neu.totalTaxPayable ? "OLD" : "NEW"
  const savings = Math.abs(old.totalTaxPayable - neu.totalTaxPayable)

  const breakdown = [
    `Gross total income (old regime basis): ${fmt(old.grossTotalIncome)}`,
    `Gross total income (new regime basis): ${fmt(neu.grossTotalIncome)}`,
    `Deductions claimed — old: ${fmt(old.totalDeductions)}, new: ${fmt(neu.totalDeductions)}`,
    `Taxable income — old: ${fmt(old.taxableIncome)}, new: ${fmt(neu.taxableIncome)}`,
    `Total liability — old: ${fmt(old.totalTaxPayable)}, new: ${fmt(neu.totalTaxPayable)}`,
    savings > 0
      ? `The ${recommendedRegime === "OLD" ? "old" : "new"} regime is cheaper by ${fmt(savings)}.`
      : "Both regimes produce the same liability.",
  ]

  return {
    financialYear: input.financialYear,
    assessmentYear: assessmentYearFor(input.financialYear),
    // Reported on the more comprehensive (old-regime) basis, which counts the
    // self-occupied house property loss the new regime disallows.
    grossTotalIncome: Math.max(old.grossTotalIncome, neu.grossTotalIncome),

    old,
    new: neu,

    recommendedRegime,
    savingsWithRecommended: savings,

    totalDeductionsOld: old.totalDeductions,
    totalDeductionsNew: neu.totalDeductions,
    taxableIncomeOld: old.taxableIncome,
    taxableIncomeNew: neu.taxableIncome,
    totalTaxPayableOld: old.totalTaxPayable,
    totalTaxPayableNew: neu.totalTaxPayable,

    breakdown,
  }
}

/** Convenience for the AI context builder: the recommended regime's figures. */
export function recommendedComputation(result: TaxComputationResult): RegimeComputation {
  return result.recommendedRegime === "OLD" ? result.old : result.new
}
