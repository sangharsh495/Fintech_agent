/**
 * lib/pdf/tax-report.ts
 *
 * Builds the branded "Tax Assessment & Optimization Report" PDF from the
 * figures already shown on /tax, so the download always matches the screen.
 */

import { ReportBuilder, inr } from "./report-builder"

export interface TaxReportDeduction {
  name: string
  amount: number
  limit: number
  detected?: boolean
}

export interface TaxReportInput {
  financialYear: string
  grossIncome: number
  deductions: TaxReportDeduction[]
  taxableIncomeOld: number
  taxableIncomeNew: number
  /** Base tax before cess. */
  oldRegimeTax: number
  newRegimeTax: number
  selectedRegime: "old" | "new"
  opportunities: string[]
  /** Optional identity block; omitted lines are simply skipped. */
  assessee?: { name?: string; pan?: string }
}

const CESS_RATE = 0.04

export function buildTaxReport(input: TaxReportInput): ReportBuilder {
  const totalOld = input.oldRegimeTax * (1 + CESS_RATE)
  const totalNew = input.newRegimeTax * (1 + CESS_RATE)
  const betterRegime: "old" | "new" = totalOld <= totalNew ? "old" : "new"
  const savings = Math.abs(totalOld - totalNew)

  const totalDeductions = input.deductions.reduce((sum, d) => sum + d.amount, 0)
  const selectedTotal = input.selectedRegime === "old" ? totalOld : totalNew
  const selectedTaxable =
    input.selectedRegime === "old" ? input.taxableIncomeOld : input.taxableIncomeNew
  const effectiveRate =
    input.grossIncome > 0 ? (selectedTotal / input.grossIncome) * 100 : 0

  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const identity = [
    input.assessee?.name,
    input.assessee?.pan ? `PAN ${input.assessee.pan}` : null,
  ]
    .filter(Boolean)
    .join("  •  ")

  const report = new ReportBuilder()

  report.header(
    "Tax Assessment & Optimization Report",
    `Financial Year ${input.financialYear}   •   Generated ${generatedOn}${identity ? `   •   ${identity}` : ""}`
  )

  report.metrics([
    { label: "Gross Income", value: inr(input.grossIncome) },
    { label: "Total Deductions", value: inr(totalDeductions) },
    { label: "Taxable Income", value: inr(selectedTaxable) },
    { label: "Tax Payable", value: inr(selectedTotal), emphasis: true },
  ])

  report.callout(
    `Recommended: ${betterRegime === "old" ? "Old" : "New"} Regime`,
    savings > 0
      ? `Filing under the ${betterRegime === "old" ? "old" : "new"} regime costs ${inr(savings)} less than the alternative for this income and deduction profile. You are currently set to the ${input.selectedRegime} regime.`
      : `Both regimes produce the same liability of ${inr(totalOld)} for this profile, so either choice is neutral on tax.`
  )

  // ─── Deduction breakdown ──────────────────────────────────

  report.section("Deduction Breakdown (Chapter VI-A & Section 16/24)")
  report.table(
    [
      { header: "Deduction", width: 0.5 },
      { header: "Claimed", width: 0.2, align: "right" },
      { header: "Statutory Limit", width: 0.2, align: "right" },
      { header: "Source", width: 0.1, align: "right" },
    ],
    input.deductions.map((d) => [
      d.name,
      inr(d.amount),
      d.limit > 0 ? inr(d.limit) : "—",
      d.detected ? "Auto" : "Manual",
    ])
  )
  report.paragraph(
    "Deductions marked \"Auto\" were detected from your uploaded bank statements. Deductions marked \"Manual\" were entered by you and are not yet corroborated by a transaction record — keep the supporting proof available in case of scrutiny."
  )

  // ─── Regime comparison ────────────────────────────────────

  report.section("Old vs New Regime Comparison")
  report.table(
    [
      { header: "Particulars", width: 0.4 },
      { header: "Old Regime", width: 0.3, align: "right" },
      { header: "New Regime", width: 0.3, align: "right" },
    ],
    [
      ["Gross Total Income", inr(input.grossIncome), inr(input.grossIncome)],
      [
        "Less: Deductions",
        inr(input.grossIncome - input.taxableIncomeOld),
        inr(input.grossIncome - input.taxableIncomeNew),
      ],
      ["Taxable Income", inr(input.taxableIncomeOld), inr(input.taxableIncomeNew)],
      ["Tax on Taxable Income", inr(input.oldRegimeTax), inr(input.newRegimeTax)],
      [
        "Health & Education Cess (4%)",
        inr(input.oldRegimeTax * CESS_RATE),
        inr(input.newRegimeTax * CESS_RATE),
      ],
      ["Total Tax Liability", inr(totalOld), inr(totalNew)],
    ]
  )
  report.paragraph(
    `Effective tax rate under your selected (${input.selectedRegime}) regime: ${effectiveRate.toFixed(1)}% of gross income.`
  )

  // ─── Opportunities ────────────────────────────────────────

  if (input.opportunities.length > 0) {
    report.section("Optimization Opportunities")
    report.bullets(input.opportunities)
  }

  report.section("Basis of Preparation")
  report.paragraph(
    "Figures are computed from transactions you uploaded to FinFlow and from deduction amounts you confirmed. Slab rates, the 4% health and education cess, and Chapter VI-A ceilings applied are those in force for the financial year stated above. This report does not account for surcharge on incomes above Rs. 50,00,000, marginal relief, capital gains taxed at special rates, or foreign income unless those figures were supplied. Verify against Form 16, Form 26AS and your AIS before filing."
  )

  return report
}

/** Convenience wrapper: build and download in one call. */
export function downloadTaxReport(input: TaxReportInput): void {
  const fileName = `FinFlow_Tax_Report_${input.financialYear.replace(/[^0-9-]/g, "")}_${new Date().toISOString().split("T")[0]}.pdf`
  buildTaxReport(input).save(fileName)
}
