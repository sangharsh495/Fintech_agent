"use client"

/**
 * app/tax/report/page.tsx
 *
 * The CA audit report: an on-screen rendering of the same working paper the
 * PDF contains, so the user can read it before downloading.
 *
 * Everything here comes from /api/tax/filing. The page does no arithmetic.
 */

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, Download, FileCheck2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadCAAuditReport, type AuditReportInput } from "@/lib/pdf/ca-audit-report"

interface DraftResponse {
  financialYear: string
  assessmentYear: string
  itrForm: string
  itrFormReasons: string[]
  itrFormWarnings: string[]
  selectedRegime: "OLD" | "NEW"
  recommendedRegime: "OLD" | "NEW"
  computation: {
    old: AuditReportInput["old"]
    new: AuditReportInput["new"]
  }
  summary: { taxCredit: number; netPayable: number; refundDue: number }
  deductions: Record<string, number>
  findings: AuditReportInput["findings"]
  gaps: string[]
  caveats: string[]
  sourcesUsed: string[]
  profile: { pan?: string; fullName?: string; age: number; city?: string }
}

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`
}

function TaxReportContent() {
  const searchParams = useSearchParams()
  const financialYear = searchParams.get("fy") ?? "2025-2026"

  const [draft, setDraft] = useState<DraftResponse | null>(null)
  const [deductions, setDeductions] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tax/filing?fy=${financialYear}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Could not load your computation.")
        return
      }
      const data: DraftResponse = await res.json()
      setDraft(data)
      setDeductions(data.deductions ?? {})
    } catch {
      setError("Could not reach the server.")
    } finally {
      setLoading(false)
    }
  }, [financialYear])

  useEffect(() => {
    load()
  }, [load])

  const handleDownload = () => {
    if (!draft) return
    downloadCAAuditReport({
      financialYear: draft.financialYear,
      assessmentYear: draft.assessmentYear,
      itrForm: draft.itrForm,
      itrFormReasons: draft.itrFormReasons,
      itrFormWarnings: draft.itrFormWarnings,
      selectedRegime: draft.selectedRegime,
      recommendedRegime: draft.recommendedRegime,
      old: draft.computation.old,
      new: draft.computation.new,
      taxCredit: draft.summary.taxCredit,
      findings: draft.findings,
      gaps: draft.gaps,
      caveats: draft.caveats,
      sourcesUsed: draft.sourcesUsed,
      deductions,
      assessee: {
        name: draft.profile.fullName,
        pan: draft.profile.pan,
        age: draft.profile.age,
        city: draft.profile.city,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Assembling your working paper…
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-amber-600" />
        <p className="font-semibold mb-2">{error ?? "No computation available"}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a Form 16 or your AIS in the filing wizard first.
        </p>
        <Link href="/tax/filing">
          <Button className="rounded-xl">Go to the filing wizard</Button>
        </Link>
      </div>
    )
  }

  const chosen = draft.selectedRegime === "OLD" ? draft.computation.old : draft.computation.new
  const alternative = draft.selectedRegime === "OLD" ? draft.computation.new : draft.computation.old

  const rows: Array<[string, number, number]> = [
    ["Gross total income (all heads)", chosen.grossTotalIncome, alternative.grossTotalIncome],
    ["Less: deductions under Chapter VI-A", chosen.totalDeductions, alternative.totalDeductions],
    ["Total income", chosen.taxableIncome, alternative.taxableIncome],
    ["Tax at slab rates", chosen.slabTax, alternative.slabTax],
    ["Tax at special rates (Sec 111A / 112A)", chosen.specialRateTax, alternative.specialRateTax],
    ["Less: rebate under Sec 87A", chosen.rebate87A, alternative.rebate87A],
    ["Add: surcharge", chosen.surcharge, alternative.surcharge],
    ["Less: marginal relief", chosen.marginalRelief, alternative.marginalRelief],
    ["Add: health & education cess at 4%", chosen.cess, alternative.cess],
    ["Total tax liability", chosen.totalTaxPayable, alternative.totalTaxPayable],
    ["Less: taxes already paid", draft.summary.taxCredit, draft.summary.taxCredit],
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Link href="/tax/filing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to the wizard
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <FileCheck2 className="w-6 h-6 text-primary" />
              CA audit working paper
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              FY {draft.financialYear} · AY {draft.assessmentYear} · {draft.itrForm}
              {draft.profile.pan ? ` · PAN ${draft.profile.pan}` : ""}
            </p>
          </div>

          <Button onClick={handleDownload} className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Computation */}
        <Card className="p-5 md:p-6 border border-border mb-5">
          <h2 className="font-bold mb-4">Computation of total income</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-semibold py-2">Particulars</th>
                  <th className="text-right font-semibold py-2 px-3">
                    {draft.selectedRegime === "OLD" ? "Old" : "New"} regime
                    <span className="block text-[10px] font-normal text-muted-foreground">adopted</span>
                  </th>
                  <th className="text-right font-semibold py-2">
                    {draft.selectedRegime === "OLD" ? "New" : "Old"} regime
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b], i) => (
                  <tr key={label} className={cn("border-b border-border/50", i % 2 === 1 && "bg-secondary/20")}>
                    <td className="py-2 pr-3">{label}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium">{inr(a)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{inr(b)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-3 pr-3">{chosen.netPayable > 0 ? "Tax payable" : "Refund due"}</td>
                  <td
                    className={cn(
                      "py-3 px-3 text-right tabular-nums",
                      chosen.netPayable > 0 ? "text-destructive" : "text-emerald-600"
                    )}
                  >
                    {inr(Math.abs(chosen.netPayable))}
                  </td>
                  <td className="py-3 text-right tabular-nums text-muted-foreground">
                    {inr(Math.abs(alternative.netPayable))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Reconciliation */}
        <Card className="p-5 md:p-6 border border-border mb-5">
          <h2 className="font-bold mb-1">Reconciliation of sources</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Sources examined: {draft.sourcesUsed.length > 0 ? draft.sourcesUsed.join(", ") : "bank statements only"}.
          </p>

          {draft.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No cross-source comparison was possible. Upload a Form 16 and your AIS to enable it.
            </p>
          ) : (
            <div className="space-y-2.5">
              {draft.findings.map((finding, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border text-xs",
                    finding.severity === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : finding.severity === "warning"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-secondary/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className="font-semibold">{finding.item}</span>
                    <span className="tabular-nums font-semibold">{inr(finding.adopted)}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{finding.message}</p>
                  {finding.citation && (
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">{finding.citation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Trail */}
        <Card className="p-5 md:p-6 border border-border mb-5">
          <h2 className="font-bold mb-1">Computation trail</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Each step as applied by the deterministic engine, in order.
          </p>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            {chosen.workings.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular-nums text-muted-foreground/50">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Limitations */}
        <Card className="p-5 md:p-6 border border-amber-500/30 bg-amber-500/5">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Scope and limitations
          </h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {[...draft.gaps, ...draft.caveats].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>{item}</span>
              </li>
            ))}
            <li className="flex gap-2">
              <span className="text-amber-600">•</span>
              <span>
                Indexation, roll-over exemptions under Sec 54 / 54F / 54EC, brought-forward losses, clubbing and
                alternate minimum tax have not been computed.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600">•</span>
              <span>Residential status is assumed to be resident and ordinarily resident.</span>
            </li>
          </ul>

          <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
            This is a working paper produced by an automated computation. It is not an audit under Sec 44AB, not a
            certificate under any provision of the Income Tax Act 1961, and is not signed by a Chartered Accountant.
            Responsibility for the return remains with you.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function TaxReportPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      }
    >
      <TaxReportContent />
    </Suspense>
  )
}
