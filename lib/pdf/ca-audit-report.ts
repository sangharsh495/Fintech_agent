/**
 * lib/pdf/ca-audit-report.ts
 *
 * The CA audit report: a working-paper style document showing every head of
 * income, every deduction with its statutory citation, the reconciliation
 * against Form 16 / AIS, and the full computation trail.
 *
 * This is the artefact a taxpayer hands to a Chartered Accountant, or keeps for
 * their own file if the department later asks how a figure was arrived at. It
 * therefore states its own limits explicitly rather than presenting itself as a
 * signed audit certificate — which it is not, and must not imply it is.
 */

import { ReportBuilder, inr } from "./report-builder"

export interface AuditReportFinding {
  item: string
  severity: "info" | "warning" | "critical"
  adopted: number
  message: string
  citation?: string
  values?: Record<string, number | undefined>
}

export interface AuditReportRegime {
  regime: "OLD" | "NEW"
  grossTotalIncome: number
  totalDeductions: number
  taxableIncome: number
  slabTax: number
  specialRateTax: number
  rebate87A: number
  surcharge: number
  marginalRelief: number
  cess: number
  totalTaxPayable: number
  netPayable: number
  workings: string[]
}

export interface AuditReportInput {
  financialYear: string
  assessmentYear: string
  itrForm: string
  itrFormReasons: string[]
  itrFormWarnings: string[]
  selectedRegime: "OLD" | "NEW"
  recommendedRegime: "OLD" | "NEW"
  old: AuditReportRegime
  new: AuditReportRegime
  taxCredit: number
  findings: AuditReportFinding[]
  gaps: string[]
  caveats: string[]
  sourcesUsed: string[]
  /** Deduction figures actually carried into the return, keyed by section. */
  deductions: Record<string, number>
  assessee: { name?: string; pan?: string; age?: number; city?: string }
}

/** Section label → statutory description, used to cite each deduction row. */
const SECTION_CITATIONS: Record<string, string> = {
  section80C: "Sec 80C r/w 80CCE — ceiling Rs. 1,50,000",
  section80CCD1B: "Sec 80CCD(1B) — NPS, ceiling Rs. 50,000",
  section80CCD2: "Sec 80CCD(2) — employer NPS, allowed in both regimes",
  section80D: "Sec 80D — health insurance",
  section80DD: "Sec 80DD — disabled dependant",
  section80DDB: "Sec 80DDB — specified illness",
  section80E: "Sec 80E — education loan interest, no ceiling",
  section80EEA: "Sec 80EEA — affordable housing interest",
  section80EEB: "Sec 80EEB — electric vehicle loan interest",
  section80G: "Sec 80G — donations",
  section80GG: "Sec 80GG — rent paid without HRA",
  section80TTA: "Sec 80TTA — savings interest, ceiling Rs. 10,000",
  section80TTB: "Sec 80TTB — senior citizen interest, ceiling Rs. 50,000",
  section80U: "Sec 80U — taxpayer's disability",
  section24b: "Sec 24(b) — housing loan interest",
  otherDeductions: "Other deductions as declared",
}

const SECTION_LABELS: Record<string, string> = {
  section80C: "Section 80C",
  section80CCD1B: "Section 80CCD(1B)",
  section80CCD2: "Section 80CCD(2)",
  section80D: "Section 80D",
  section80DD: "Section 80DD",
  section80DDB: "Section 80DDB",
  section80E: "Section 80E",
  section80EEA: "Section 80EEA",
  section80EEB: "Section 80EEB",
  section80G: "Section 80G",
  section80GG: "Section 80GG",
  section80TTA: "Section 80TTA",
  section80TTB: "Section 80TTB",
  section80U: "Section 80U",
  section24b: "Section 24(b)",
  otherDeductions: "Other",
}

export function buildCAAuditReport(input: AuditReportInput): ReportBuilder {
  const chosen = input.selectedRegime === "OLD" ? input.old : input.new
  const alternative = input.selectedRegime === "OLD" ? input.new : input.old

  const identity = [
    input.assessee.name,
    input.assessee.pan ? `PAN ${input.assessee.pan}` : null,
  ]
    .filter(Boolean)
    .join("  •  ")

  const report = new ReportBuilder(
    "Prepared by FinFlow's automated computation. This is a working paper, not an audit certificate under Sec 44AB, and is not signed by a Chartered Accountant."
  )

  report.header(
    "Computation of Total Income & Tax Audit Working Paper",
    `FY ${input.financialYear}  •  AY ${input.assessmentYear}  •  ${input.itrForm}${identity ? `  •  ${identity}` : ""}`
  )

  // ─── Headline ─────────────────────────────────────────────

  report.metrics([
    { label: "Gross total income", value: inr(chosen.grossTotalIncome) },
    { label: "Total income", value: inr(chosen.taxableIncome) },
    { label: "Tax liability", value: inr(chosen.totalTaxPayable) },
    {
      label: chosen.netPayable > 0 ? "Payable" : "Refund due",
      value: inr(Math.abs(chosen.netPayable)),
      emphasis: true,
    },
  ])

  report.callout(
    `Return form: ${input.itrForm}`,
    input.itrFormReasons.join(" ")
  )

  // ─── Computation of total income ──────────────────────────

  report.section("Computation of Total Income")
  report.table(
    [
      { header: "Particulars", width: 0.46 },
      { header: `${input.selectedRegime === "OLD" ? "Old" : "New"} regime (adopted)`, width: 0.27, align: "right" },
      { header: `${input.selectedRegime === "OLD" ? "New" : "Old"} regime`, width: 0.27, align: "right" },
    ],
    [
      ["Gross total income (all heads)", inr(chosen.grossTotalIncome), inr(alternative.grossTotalIncome)],
      ["Less: deductions under Chapter VI-A", inr(chosen.totalDeductions), inr(alternative.totalDeductions)],
      ["Total income", inr(chosen.taxableIncome), inr(alternative.taxableIncome)],
      ["Tax at slab rates", inr(chosen.slabTax), inr(alternative.slabTax)],
      ["Tax at special rates (Sec 111A / 112A)", inr(chosen.specialRateTax), inr(alternative.specialRateTax)],
      ["Less: rebate under Sec 87A", inr(chosen.rebate87A), inr(alternative.rebate87A)],
      ["Add: surcharge", inr(chosen.surcharge), inr(alternative.surcharge)],
      ["Less: marginal relief", inr(chosen.marginalRelief), inr(alternative.marginalRelief)],
      ["Add: health & education cess at 4%", inr(chosen.cess), inr(alternative.cess)],
      ["Total tax liability", inr(chosen.totalTaxPayable), inr(alternative.totalTaxPayable)],
      ["Less: taxes already paid (TDS, advance, self-assessment)", inr(input.taxCredit), inr(input.taxCredit)],
      [
        chosen.netPayable > 0 ? "Tax payable" : "Refund due",
        inr(Math.abs(chosen.netPayable)),
        inr(Math.abs(alternative.netPayable)),
      ],
    ]
  )

  if (input.selectedRegime !== input.recommendedRegime) {
    report.paragraph(
      `Note: the ${input.recommendedRegime === "OLD" ? "old" : "new"} regime produces a lower liability on these figures, but the ${input.selectedRegime === "OLD" ? "old" : "new"} regime has been adopted at the assessee's election.`
    )
  }

  // ─── Deductions with citations ────────────────────────────

  const deductionRows = Object.entries(input.deductions)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => [
      SECTION_LABELS[key] ?? key,
      inr(amount),
      SECTION_CITATIONS[key] ?? "—",
    ])

  report.section("Deductions Claimed, with Statutory Authority")
  if (deductionRows.length === 0) {
    report.paragraph(
      "No Chapter VI-A deductions have been claimed. Under the new regime this is expected, since only Sec 80CCD(2) survives."
    )
  } else {
    report.table(
      [
        { header: "Deduction", width: 0.28 },
        { header: "Amount", width: 0.2, align: "right" },
        { header: "Authority", width: 0.52 },
      ],
      deductionRows
    )
    report.paragraph(
      "Amounts shown are after applying the statutory ceiling for each section. Supporting evidence — premium receipts, investment statements, loan certificates — must be retained for six years from the end of the assessment year."
    )
  }

  // ─── Reconciliation ───────────────────────────────────────

  report.section("Reconciliation of Sources")
  report.paragraph(
    `Sources examined: ${input.sourcesUsed.length > 0 ? input.sourcesUsed.join(", ") : "bank statements only"}.`
  )

  if (input.findings.length > 0) {
    report.table(
      [
        { header: "Item", width: 0.24 },
        { header: "Adopted", width: 0.18, align: "right" },
        { header: "Observation", width: 0.58 },
      ],
      input.findings.map((finding) => [
        `${finding.severity === "critical" ? "! " : ""}${finding.item}`,
        inr(finding.adopted),
        finding.citation ? `${finding.message} [${finding.citation}]` : finding.message,
      ])
    )
  } else {
    report.paragraph("No cross-source comparisons were possible — upload a Form 16 and your AIS to enable reconciliation.")
  }

  // ─── Computation trail ────────────────────────────────────

  report.section("Computation Trail")
  report.paragraph(
    "Each step below was produced by the deterministic calculation engine, in the order applied."
  )
  report.bullets(chosen.workings)

  // ─── Limitations ──────────────────────────────────────────

  report.section("Scope and Limitations")

  const limitations = [
    ...input.gaps,
    ...input.caveats,
    "Indexation benefit on the transfer of land, buildings or unlisted shares has not been computed. Where the asset was acquired before 23 July 2024, the assessee may elect 20% with indexation instead of 12.5% without, whichever is lower.",
    "Roll-over exemptions under Sec 54, 54F and 54EC have not been applied.",
    "Set-off and carry-forward of brought-forward losses under Chapter VI have not been considered.",
    "Clubbing of income under Sec 60 to 64, and alternate minimum tax under Sec 115JC, have not been evaluated.",
    "Residential status has been assumed to be resident and ordinarily resident. If you spent 182 days or more outside India, this assumption must be revisited before filing.",
  ]

  report.bullets(limitations)

  report.paragraph(
    "This working paper records how each figure was derived from the documents supplied. It does not constitute an audit under Sec 44AB, a certificate under any provision of the Income Tax Act 1961, or professional advice. Responsibility for the contents of the return remains with the assessee. Where the affairs are complex — business income, capital gains on immovable property, foreign assets, or a residential status question — engage a practising Chartered Accountant before filing."
  )

  report.paragraph(
    `Prepared on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`
  )

  return report
}

export function downloadCAAuditReport(input: AuditReportInput): void {
  const pan = input.assessee.pan ?? "REPORT"
  buildCAAuditReport(input).save(`FinFlow_CA_Audit_${pan}_${input.assessmentYear.replace("-", "")}.pdf`)
}
