/**
 * Loan arithmetic shared by the EMI and loan-comparison calculators.
 * Every function accepts whatever the user typed (0, empty, huge) and returns
 * a finite number, so the UI never shows NaN or hangs on a giant tenure.
 */

/** Monthly instalment for a loan. A 0% loan is simply principal / months. */
export function monthlyEmi(principal: number, annualRatePercent: number, months: number): number {
  const p = Math.max(0, Number(principal) || 0)
  const n = Math.floor(Number(months) || 0)
  if (p === 0 || n <= 0) return 0
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12
  if (r === 0) return p / n
  const growth = Math.pow(1 + r, n)
  return (p * r * growth) / (growth - 1)
}

/** Outstanding balance after each month, computed in one pass (O(n)). */
export function amortizationBalances(principal: number, annualRatePercent: number, months: number): number[] {
  const n = Math.max(0, Math.floor(Number(months) || 0))
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12
  const emi = monthlyEmi(principal, annualRatePercent, n)
  const balances: number[] = []
  let balance = Math.max(0, Number(principal) || 0)
  for (let i = 0; i < n; i++) {
    balance -= emi - balance * r
    balances.push(Math.max(0, balance))
  }
  return balances
}

/** Clamp a typed value to a range; non-numbers fall back to `min`. */
export function clamp(value: number, min: number, max: number): number {
  const v = Number(value)
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}
