/**
 * server/tests/tax.test.ts — regression tests for the tax engine and
 * reconciliation. Run with `pnpm test:tax`.
 *
 * The broad differential test against an independent reference lives in
 * scripts/eval/tax-benchmark.ts; these pin the specific defects found and
 * fixed, so they cannot come back.
 */

import { computeIndianTax } from "@/server/services/tax/tax-calculator"
import { harmoniseTaxSources } from "@/server/services/tax/reconciliation"
import { determineITRForm, type TaxpayerProfile } from "@/server/services/tax/itr-form-selector"
import { emptyDeductions, type DeductionInput, type FinancialYear, type TaxComputationInput } from "@/server/services/tax/types"

let failures = 0
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${JSON.stringify(detail)}`}`)
  if (!ok) failures++
}

function input(overrides: Partial<TaxComputationInput> = {}, deductions: Partial<DeductionInput> = {}): TaxComputationInput {
  return {
    financialYear: "2024-2025" as FinancialYear, age: 35,
    salaryIncome: 1500000, hraExemption: 0, ltaExemption: 0, professionalTax: 0,
    housePropertyIncome: 0, presumptiveIncome44ADA: 0, presumptiveIncome44AD: 0, businessIncome: 0,
    shortTermCapitalGains111A: 0, longTermCapitalGains112A: 0, otherCapitalGains: 0,
    otherSourcesIncome: 0, savingsInterest: 0,
    ...overrides,
    deductions: { ...emptyDeductions(), ...deductions },
  }
}
const oldTax = (o?: Partial<TaxComputationInput>, d?: Partial<DeductionInput>) => computeIndianTax(input(o, d)).totalTaxPayableOld
const newTax = (o?: Partial<TaxComputationInput>, d?: Partial<DeductionInput>) => computeIndianTax(input(o, d)).totalTaxPayableNew

// ── Sec 24(b) and Sec 71(3A) ──
check("24(b) ₹1.5L saves ₹46,800 at the 30% slab", oldTax() - oldTax({}, { section24b: 150000 }) === 46800)
check("24(b) capped at ₹2L", oldTax({}, { section24b: 500000 }) === oldTax({}, { section24b: 200000 }))
check("24(b) not available under the new regime", newTax({}, { section24b: 500000 }) === newTax())
check("house property loss set off only up to ₹2L", computeIndianTax(input({ housePropertyIncome: -500000 })).old.grossTotalIncome === computeIndianTax(input()).old.grossTotalIncome - 200000)

// ── Hand-worked liabilities ──
check("FY24-25 new, salary 12.75L = 83,200", newTax({ salaryIncome: 1275000 }) === 83200)
check("FY25-26 new, salary 12.75L = 0 (87A)", newTax({ financialYear: "2025-2026", salaryIncome: 1275000 }) === 0)
check("FY24-25 new, 87A marginal relief = 10,400", newTax({ salaryIncome: 785000 }) === 10400)
check("super senior pays 20% above ₹5L (10,400 on 5.5L taxable)", oldTax({ financialYear: "2023-2024", age: 82, salaryIncome: 600000 }) === 10400)
// Taxable 2,02,75,000: capped at tax-with-surcharge at ₹2 Cr (58,12,500 × 1.15) + 2,75,000 = 69,59,375; +4% cess.
check("surcharge marginal relief includes the lower band's surcharge", oldTax({ salaryIncome: 20500000 }, { section80C: 150000, section80D: 25000 }) === 7237750)

// ── Input sanitisation ──
const clean = oldTax({ salaryIncome: 1000000 })
check("NaN deduction treated as 0", oldTax({ salaryIncome: 1000000 }, { section80C: NaN }) === clean)
check("Infinity deduction treated as 0", oldTax({ salaryIncome: 1000000 }, { section80E: Infinity }) === clean)
check("negative other income ignored", oldTax({ salaryIncome: 1000000, otherSourcesIncome: -900000 }) === clean)
check("professional tax capped at ₹2,500", oldTax({ salaryIncome: 1000000, professionalTax: 1000000 }) === oldTax({ salaryIncome: 1000000, professionalTax: 2500 }))
check("NaN salary produces finite results", Number.isFinite(oldTax({ salaryIncome: NaN })) && Number.isFinite(newTax({ salaryIncome: NaN })))

// ── Sec 80D split ──
const ded = (d: Partial<DeductionInput>, o: Partial<TaxComputationInput> = {}) => computeIndianTax(input({ salaryIncome: 2000000, ...o }, d)).old.totalDeductions
check("80D combined figure keeps the ₹75k ceiling", ded({ section80D: 90000 }) === 75000)
check("80D split, parents not senior: 25k + 25k", ded({ section80D: 40000, section80DParents: 40000 }) === 50000)
check("80D split, parents senior: 25k + 50k", ded({ section80D: 40000, section80DParents: 60000 }, { parentsSenior: true }) === 75000)
check("80D split, senior taxpayer and parents: 50k + 50k", ded({ section80D: 60000, section80DParents: 60000 }, { age: 65, parentsSenior: true }) === 100000)

// ── Reconciliation: 24(b) counted once ──
const form16 = {
  grossSalary: 1500000, perquisites: 0, profitsInLieu: 0, exemptions: { hra: 0, lta: 0 }, professionalTax: 0,
  housePropertyIncome: -180000, chapterVIA: {}, totalTdsDeposited: 0, otherSourcesIncome: 0,
} as never
const bank = (amount: number) => ({ salaryCredits: 0, savingsInterest: 0, rentalIncome: 0, detectedDeductions: { "24B": amount } }) as never
const r1 = harmoniseTaxSources({ financialYear: "2024-2025", form16, bankDerived: bank(180000) } as never)
check("bank-detected 24(b) not added to a Form 16 house property loss", r1.input.deductions.section24b === 0 && r1.input.housePropertyIncome === -180000)
const r2 = harmoniseTaxSources({ financialYear: "2024-2025", form16 } as never, { userDeductions: { section24b: 190000 } })
check("declared 24(b) replaces the Form 16 loss", r2.input.deductions.section24b === 190000 && r2.input.housePropertyIncome === 0)
const r3 = harmoniseTaxSources({ financialYear: "2024-2025", bankDerived: bank(120000) } as never)
check("bank-detected 24(b) used when there is no Form 16", r3.input.deductions.section24b === 120000)

// ── ITR form: Sec 112A LTCG up to ₹1.25L allowed in ITR-1/ITR-4 from AY 2025-26 ──
const profile = (o: Partial<TaxpayerProfile>): TaxpayerProfile => ({
  grossIncome: 900000, hasSalaryIncome: true, housePropertyCount: 1, hasBusinessIncome: false,
  hasPresumptiveIncome: false, hasFnOTrading: false, hasCapitalGains: false, hasForeignAssets: false, ...o,
})
const form = (o: Partial<TaxpayerProfile>) => determineITRForm(profile(o)).form
check("FY24-25, LTCG 112A ₹1L only → ITR-1", form({ financialYear: "2024-2025", hasCapitalGains: true, ltcg112A: 100000 }) === "ITR-1")
check("FY23-24, LTCG 112A ₹1L → ITR-2 (allowance starts AY 2025-26)", form({ financialYear: "2023-2024", hasCapitalGains: true, ltcg112A: 100000 }) === "ITR-2")
check("FY24-25, LTCG 112A ₹1.5L → ITR-2", form({ financialYear: "2024-2025", hasCapitalGains: true, ltcg112A: 150000 }) === "ITR-2")
check("FY24-25, small LTCG plus STCG → ITR-2", form({ financialYear: "2024-2025", hasCapitalGains: true, ltcg112A: 50000, hasOtherCapitalGains: true }) === "ITR-2")
check("FY24-25, small LTCG with a loss carried forward → ITR-2", form({ financialYear: "2024-2025", hasCapitalGains: true, ltcg112A: 50000, hasCapitalLossCarryForward: true }) === "ITR-2")
check("FY24-25, presumptive 44ADA with small LTCG → ITR-4", form({ financialYear: "2024-2025", hasCapitalGains: true, ltcg112A: 80000, hasBusinessIncome: true, hasPresumptiveIncome: true, presumptiveScheme: "44ADA", presumptiveTurnover: 3000000 }) === "ITR-4")

console.log(failures ? `\n${failures} failed` : "\nAll passed")
process.exitCode = failures ? 1 : 0
