/**
 * scripts/eval/tax-benchmark.ts
 *
 * Differential test of the statutory engine (server/services/tax/tax-calculator.ts).
 *
 * 1. Anchor cases: a handful of liabilities worked out by hand (the working is
 *    in the comments), checked to the rupee.
 * 2. Cohort vectors: taxpayer profiles across six cohorts, each evaluated for
 *    FY 2023-24, 2024-25 and 2025-26 under both regimes, compared with a
 *    reference implementation written separately below from the slab, rebate
 *    and surcharge rules. Agreement is exact after rounding to the rupee.
 *
 * Scope: salary, presumptive (44ADA) income, savings interest, Sec 24(b), and
 * Chapter VI-A (80C, 80CCD(1B), 80D, 80TTA/80TTB). Capital gains at special
 * rates are not covered by either side.
 *
 *   pnpm eval:tax
 */

import { computeIndianTax } from "@/server/services/tax/tax-calculator"
import { emptyDeductions, type FinancialYear } from "@/server/services/tax/types"

type Regime = "OLD" | "NEW"
const FYS: FinancialYear[] = ["2023-2024", "2024-2025", "2025-2026"]

interface Profile {
  label: string
  cohort: string
  age: number
  salary: number
  presumptive44ADA?: number
  savingsInterest?: number
  d80C?: number
  d80CCD1B?: number
  d80D?: number
  d24b?: number
}

// ─── Reference implementation ───────────────────────────────

function slabs(fy: FinancialYear, regime: Regime, age: number): Array<[number, number]> {
  if (regime === "OLD") {
    // Super senior: nil to 5L, then straight to 20% — there is no 5% band.
    if (age >= 80) return [[500000, 0.2], [1000000, 0.3]]
    const exemption = age >= 60 ? 300000 : 250000
    return [[exemption, 0.05], [500000, 0.2], [1000000, 0.3]]
  }
  if (fy === "2023-2024") return [[300000, 0.05], [600000, 0.1], [900000, 0.15], [1200000, 0.2], [1500000, 0.3]]
  if (fy === "2024-2025") return [[300000, 0.05], [700000, 0.1], [1000000, 0.15], [1200000, 0.2], [1500000, 0.3]]
  return [[400000, 0.05], [800000, 0.1], [1200000, 0.15], [1600000, 0.2], [2000000, 0.25], [2400000, 0.3]]
}

function slabTax(income: number, ladder: Array<[number, number]>): number {
  let tax = 0
  ladder.forEach(([from, rate], i) => {
    const to = ladder[i + 1]?.[0] ?? Infinity
    if (income > from) tax += (Math.min(income, to) - from) * rate
  })
  return tax
}

/** Tax after Sec 87A (with new-regime marginal relief), before surcharge and cess. */
function taxAfterRebate(ti: number, fy: FinancialYear, regime: Regime, age: number): number {
  const tax = slabTax(ti, slabs(fy, regime, age))
  if (regime === "OLD") return ti <= 500000 ? tax - Math.min(tax, 12500) : tax
  const [limit, max] = fy === "2025-2026" ? [1200000, 60000] : [700000, 25000]
  if (ti <= limit) return tax - Math.min(tax, max)
  return Math.min(tax, ti - limit) // marginal relief: tax never exceeds the excess
}

const SURCHARGE: Array<[number, number]> = [[5000000, 0.1], [10000000, 0.15], [20000000, 0.25], [50000000, 0.37]]

/** Surcharge-inclusive tax, with marginal relief against the band below. */
function withSurcharge(ti: number, fy: FinancialYear, regime: Regime, age: number): number {
  const bands = regime === "NEW" ? SURCHARGE.filter(([, r]) => r <= 0.25) : SURCHARGE
  const rateAt = (income: number) => bands.filter(([t]) => income > t).pop()?.[1] ?? 0
  const base = taxAfterRebate(ti, fy, regime, age)
  const rate = rateAt(ti)
  if (rate === 0) return base
  const threshold = bands.filter(([t]) => ti > t).pop()![0]
  // Tax at the threshold carries the lower band's surcharge.
  const atThreshold = taxAfterRebate(threshold, fy, regime, age) * (1 + rateAt(threshold))
  return Math.min(base * (1 + rate), atThreshold + (ti - threshold))
}

function referenceTax(p: Profile, fy: FinancialYear, regime: Regime): number {
  const interest = p.savingsInterest ?? 0
  const presumptive = p.presumptive44ADA ?? 0
  const sd = p.salary > 0 ? (regime === "NEW" && fy !== "2023-2024" ? 75000 : 50000) : 0
  const netSalary = Math.max(0, p.salary - sd)

  let ti: number
  if (regime === "OLD") {
    const houseProperty = -Math.min(p.d24b ?? 0, 200000)
    const gti = Math.max(0, netSalary + houseProperty + presumptive + interest)
    const senior = p.age >= 60
    const chapterVIA =
      Math.min(p.d80C ?? 0, 150000) +
      Math.min(p.d80CCD1B ?? 0, 50000) +
      Math.min(p.d80D ?? 0, senior ? 100000 : 75000) +
      Math.min(interest, senior ? 50000 : 10000)
    ti = gti - Math.min(chapterVIA, gti)
  } else {
    ti = netSalary + presumptive + interest
  }

  return Math.round(withSurcharge(ti, fy, regime, p.age) * 1.04)
}

// ─── Vectors ────────────────────────────────────────────────

function cohorts(): Profile[] {
  const out: Profile[] = []
  for (let i = 0; i < 10; i++) {
    const salary = 350000 + i * 38889
    out.push({ cohort: "Salaried low (3.5L–7.0L)", label: `salary ${salary}`, age: 30, salary: Math.round(salary), d80C: i % 2 ? 50000 : 0 })
  }
  for (let i = 0; i < 15; i++) {
    const salary = 750000 + i * 53571
    out.push({ cohort: "Salaried mid (7.5L–15L)", label: `salary ${Math.round(salary)}`, age: 34, salary: Math.round(salary), d80C: 150000, d80D: i % 3 === 0 ? 25000 : 0, d80CCD1B: i % 2 ? 50000 : 0, savingsInterest: 8000 })
  }
  for (let i = 0; i < 10; i++) {
    const salary = 1600000 + i * 211111
    out.push({ cohort: "Salaried high (16L–35L)", label: `salary ${Math.round(salary)}`, age: 42, salary: Math.round(salary), d80C: 150000, d80D: 50000, d80CCD1B: 50000, d24b: i % 2 ? 200000 : 350000, savingsInterest: 25000 })
  }
  for (const [age, salary, interest] of [[62, 600000, 45000], [65, 850000, 60000], [70, 1200000, 80000], [80, 700000, 40000], [85, 1500000, 90000]] as const) {
    out.push({ cohort: "Senior citizens", label: `age ${age}, income ${salary}`, age, salary, savingsInterest: interest, d80D: 50000, d80C: 100000 })
  }
  for (const receipts of [2000000, 3000000, 4000000, 5000000, 6000000]) {
    out.push({ cohort: "Professionals (44ADA)", label: `receipts ${receipts}`, age: 38, salary: 0, presumptive44ADA: receipts / 2, d80C: 150000, savingsInterest: 12000 })
  }
  for (const salary of [5500000, 7500000, 10200000, 20500000, 52000000]) {
    out.push({ cohort: "High net worth (>50L)", label: `salary ${salary}`, age: 48, salary, d80C: 150000, d80D: 25000 })
  }
  return out
}

/** Worked by hand; the working is shown for each. */
const ANCHORS: Array<{ label: string; fy: FinancialYear; regime: Regime; profile: Profile; expected: number }> = [
  // Taxable 12,00,000: 4L@5% 20,000 + 3L@10% 30,000 + 2L@15% 30,000 = 80,000; +4% cess = 83,200
  { label: "FY24-25 new, salary 12.75L", fy: "2024-2025", regime: "NEW", expected: 83200, profile: { label: "", cohort: "", age: 30, salary: 1275000 } },
  // Taxable 12,00,000 is within the FY25-26 87A limit; tax 60,000 fully rebated
  { label: "FY25-26 new, salary 12.75L", fy: "2025-2026", regime: "NEW", expected: 0, profile: { label: "", cohort: "", age: 30, salary: 1275000 } },
  // Taxable 7,10,000: tax 21,000, but marginal relief limits it to the 10,000 excess; +4% = 10,400
  { label: "FY24-25 new, 87A marginal relief", fy: "2024-2025", regime: "NEW", expected: 10400, profile: { label: "", cohort: "", age: 30, salary: 785000 } },
  // Taxable 10L − 50k − 1.5L − 25k = 7,75,000: 2.5L@5% 12,500 + 2.75L@20% 55,000 = 67,500; +4% = 70,200
  { label: "FY24-25 old, 80C + 80D", fy: "2024-2025", regime: "OLD", expected: 70200, profile: { label: "", cohort: "", age: 30, salary: 1000000, d80C: 150000, d80D: 25000 } },
  // Age 82, taxable 5,50,000: nil to 5L, 50,000@20% = 10,000 (no rebate above 5L); +4% = 10,400
  { label: "FY23-24 old, super senior", fy: "2023-2024", regime: "OLD", expected: 10400, profile: { label: "", cohort: "", age: 82, salary: 600000 } },
]

function engineTax(p: Profile, fy: FinancialYear, regime: Regime): { tax: number; micros: number } {
  const input = {
    financialYear: fy, age: p.age,
    salaryIncome: p.salary, hraExemption: 0, ltaExemption: 0, professionalTax: 0,
    housePropertyIncome: 0,
    presumptiveIncome44ADA: p.presumptive44ADA ?? 0, presumptiveIncome44AD: 0, businessIncome: 0,
    shortTermCapitalGains111A: 0, longTermCapitalGains112A: 0, otherCapitalGains: 0,
    otherSourcesIncome: 0, savingsInterest: p.savingsInterest ?? 0,
    deductions: {
      ...emptyDeductions(),
      section80C: p.d80C ?? 0, section80CCD1B: p.d80CCD1B ?? 0, section80D: p.d80D ?? 0, section24b: p.d24b ?? 0,
      section80TTA: p.age >= 60 ? 0 : Math.min(p.savingsInterest ?? 0, 10000),
      section80TTB: p.age >= 60 ? Math.min(p.savingsInterest ?? 0, 50000) : 0,
    },
  }
  const runs = 200
  const t0 = performance.now()
  let result = computeIndianTax(input)
  for (let i = 1; i < runs; i++) result = computeIndianTax(input)
  const micros = ((performance.now() - t0) / runs) * 1000
  return { tax: regime === "OLD" ? result.totalTaxPayableOld : result.totalTaxPayableNew, micros }
}

function main() {
  let failures = 0

  console.log("Anchor cases (worked by hand)")
  for (const a of ANCHORS) {
    const got = engineTax(a.profile, a.fy, a.regime).tax
    const ok = got === a.expected
    if (!ok) failures++
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${a.label.padEnd(36)} expected ${a.expected}, engine ${got}`)
  }

  const profiles = cohorts()
  const byCohort = new Map<string, { n: number; agree: number; old: number; neu: number; micros: number }>()
  const mismatches: string[] = []
  for (const p of profiles) {
    for (const fy of FYS) {
      const c = byCohort.get(p.cohort) ?? { n: 0, agree: 0, old: 0, neu: 0, micros: 0 }
      byCohort.set(p.cohort, c)
      const regimes = (["OLD", "NEW"] as const).map((regime) => {
        const engine = engineTax(p, fy, regime)
        const reference = referenceTax(p, fy, regime)
        c.micros += engine.micros
        if (engine.tax !== reference) mismatches.push(`${p.cohort} / ${p.label} / FY ${fy} / ${regime}: engine ${engine.tax}, reference ${reference}`)
        return { engine: engine.tax, reference }
      })
      c.n++
      if (regimes.every((r) => r.engine === r.reference)) c.agree++
      // Engine tie-break: OLD when equal.
      if (regimes[0]!.engine <= regimes[1]!.engine) c.old++
      else c.neu++
    }
  }

  console.log(`\nCohort vectors: ${profiles.length} profiles × ${FYS.length} financial years × 2 regimes`)
  console.log("Cohort                        Cases  Old/New  Agreement           Mean µs/call")
  let n = 0, agree = 0, old = 0, neu = 0, micros = 0
  for (const [cohort, c] of byCohort) {
    n += c.n; agree += c.agree; old += c.old; neu += c.neu; micros += c.micros
    console.log(`${cohort.padEnd(29)} ${String(c.n).padStart(5)}  ${`${c.old}/${c.neu}`.padStart(7)}  ${`${((c.agree / c.n) * 100).toFixed(2)}% (${c.agree}/${c.n})`.padEnd(18)}  ${(c.micros / (c.n * 2)).toFixed(2).padStart(8)}`)
  }
  console.log(`${"Total".padEnd(29)} ${String(n).padStart(5)}  ${`${old}/${neu}`.padStart(7)}  ${`${((agree / n) * 100).toFixed(2)}% (${agree}/${n})`.padEnd(18)}  ${(micros / (n * 2)).toFixed(2).padStart(8)}`)

  if (mismatches.length) {
    console.log(`\n${mismatches.length} regime computations disagree:`)
    for (const m of mismatches.slice(0, 20)) console.log(`  ${m}`)
  }
  if (failures || mismatches.length) process.exitCode = 1
}

main()
