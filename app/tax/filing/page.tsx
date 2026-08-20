"use client"

/**
 * app/tax/filing/page.tsx
 *
 * The guided ITR filing wizard.
 *
 * Four steps: gather documents, audit what was reconciled, choose a regime,
 * then generate and download the ITD JSON.
 *
 * Design constraint: this page never computes tax. Every figure shown comes
 * from /api/tax/filing, which runs the deterministic engine server-side. The
 * page's job is to collect what only the user can supply and to make the
 * reconciliation legible before anything is filed.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types mirroring the API responses ──────────────────────

interface Finding {
  item: string
  severity: "info" | "warning" | "critical"
  values: Record<string, number | undefined>
  adopted: number
  message: string
  citation?: string
}

interface RegimeComputation {
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

interface FilingDraftResponse {
  financialYear: string
  assessmentYear: string
  selectedRegime: "OLD" | "NEW"
  recommendedRegime: "OLD" | "NEW"
  savingsWithRecommended: number
  computation: { old: RegimeComputation; new: RegimeComputation }
  summary: {
    grossTotalIncome: number
    totalDeductions: number
    taxableIncome: number
    totalTaxPayable: number
    taxCredit: number
    netPayable: number
    refundDue: number
  }
  itrForm: string
  itrFormReasons: string[]
  itrFormDisqualifiers: string[]
  itrFormWarnings: string[]
  findings: Finding[]
  gaps: string[]
  sourcesUsed: string[]
  documentsAvailable: { form16: boolean; ais: boolean; cas: boolean }
  profile: { pan?: string; fullName?: string; age: number; city?: string; state?: string; hasBankAccount: boolean }
  caveats: string[]
}

interface TaxDocument {
  id: string
  documentType: string
  fileName: string
  status: string
  confidence: number | null
  missingFields: string[] | null
  errorMessage: string | null
}

interface ValidationIssue {
  field: string
  message: string
  severity: "error" | "warning"
}

// ─── Helpers ────────────────────────────────────────────────

const FINANCIAL_YEARS = ["2025-2026", "2024-2025", "2023-2024"] as const

const DOCUMENT_KINDS = [
  {
    type: "form16",
    title: "Form 16",
    description: "Your employer's TDS certificate (Part A and Part B). Establishes salary, exemptions and TDS.",
    accept: ".pdf",
  },
  {
    type: "ais",
    title: "AIS / TIS",
    description: "Annual Information Statement from the e-filing portal. Download the JSON for a reliable import.",
    accept: ".json,.pdf",
  },
  {
    type: "cas",
    title: "Mutual fund CAS",
    description: "CAMS or KFintech consolidated statement. Finds ELSS purchases that count towards Section 80C.",
    accept: ".pdf",
  },
] as const

function inr(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—"
  return `₹${Math.round(value).toLocaleString("en-IN")}`
}

const STEPS = [
  { number: 1, title: "Documents", caption: "Gather your sources" },
  { number: 2, title: "Audit", caption: "Check the reconciliation" },
  { number: 3, title: "Regime", caption: "Old vs new" },
  { number: 4, title: "File", caption: "Generate the return" },
] as const

// ─── Page ───────────────────────────────────────────────────

export default function TaxFilingPage() {
  const [step, setStep] = useState(1)
  const [financialYear, setFinancialYear] = useState<string>("2025-2026")

  const [draft, setDraft] = useState<FilingDraftResponse | null>(null)
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — upload
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [passwordFor, setPasswordFor] = useState<{ type: string; hint: string; file: File } | null>(null)
  const [password, setPassword] = useState("")

  // Step 2 — declarations only the user can make
  const [declarations, setDeclarations] = useState({
    hasForeignAssets: false,
    hasForeignIncome: false,
    isCompanyDirector: false,
    holdsUnlistedEquity: false,
    hasFnOTrading: false,
    housePropertyCount: 1,
    agriculturalIncome: 0,
  })
  const [capitalGains, setCapitalGains] = useState({ stcg111A: 0, ltcg112A: 0, otherCapitalGains: 0 })

  // Step 4 — identity required by the ITD schema but not stored in the profile
  const [identity, setIdentity] = useState({
    pan: "",
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    mobile: "",
    email: "",
    aadhaar: "",
  })
  const [address, setAddress] = useState({
    flatDoorBlock: "",
    premisesName: "",
    roadStreet: "",
    areaLocality: "",
    city: "",
    state: "",
    pincode: "",
  })
  const [bankAccount, setBankAccount] = useState({ ifsc: "", bankName: "", accountNumber: "" })
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [generated, setGenerated] = useState<{ fileName: string; json: unknown; warnings: ValidationIssue[] } | null>(null)

  // ─── Data loading ─────────────────────────────────────────

  const loadDraft = useCallback(async (fy: string) => {
    setError(null)
    try {
      const [draftRes, docsRes] = await Promise.all([
        fetch(`/api/tax/filing?fy=${fy}`),
        fetch(`/api/tax/documents?fy=${fy}`),
      ])

      if (draftRes.ok) {
        const data: FilingDraftResponse = await draftRes.json()
        setDraft(data)
        // Prefill what the profile already knows so the user retypes less.
        setIdentity((prev) => ({
          ...prev,
          pan: prev.pan || data.profile.pan || "",
          firstName: prev.firstName || (data.profile.fullName?.split(" ")[0] ?? ""),
          lastName: prev.lastName || (data.profile.fullName?.split(" ").slice(1).join(" ") ?? ""),
        }))
        setAddress((prev) => ({
          ...prev,
          city: prev.city || data.profile.city || "",
          state: prev.state || data.profile.state || "",
        }))
      } else {
        const body = await draftRes.json().catch(() => ({}))
        setError(body.error ?? "Could not load your filing draft.")
      }

      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents ?? [])
      }
    } catch {
      setError("Could not reach the server. Check your connection and retry.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadDraft(financialYear)
  }, [financialYear, loadDraft])

  // ─── Actions ──────────────────────────────────────────────

  const uploadDocument = async (documentType: string, file: File, pwd?: string) => {
    setUploadingType(documentType)
    setError(null)

    try {
      const form = new FormData()
      form.append("file", file)
      form.append("documentType", documentType)
      form.append("fy", financialYear)
      if (pwd) form.append("password", pwd)

      const res = await fetch("/api/tax/documents", { method: "POST", body: form })
      const body = await res.json().catch(() => ({}))

      if (res.status === 422 && body.passwordRequired) {
        setPasswordFor({ type: documentType, hint: body.passwordHint ?? "This document is password-protected.", file })
        return
      }
      if (!res.ok) {
        setError(body.error ?? "Could not read that document.")
        return
      }

      setPasswordFor(null)
      setPassword("")
      await loadDraft(financialYear)
    } catch {
      setError("Upload failed. Check your connection and retry.")
    } finally {
      setUploadingType(null)
    }
  }

  const removeDocument = async (id: string) => {
    await fetch(`/api/tax/documents?id=${id}`, { method: "DELETE" })
    await loadDraft(financialYear)
  }

  const saveDeclarations = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/tax/filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fy: financialYear, declarations, capitalGains }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Could not save your declarations.")
        return false
      }
      setDraft(await res.json())
      return true
    } catch {
      setError("Could not save your declarations.")
      return false
    } finally {
      setBusy(false)
    }
  }

  const chooseRegime = async (regime: "OLD" | "NEW") => {
    setBusy(true)
    try {
      const res = await fetch("/api/tax/filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fy: financialYear, regimeOverride: regime }),
      })
      if (res.ok) setDraft(await res.json())
    } finally {
      setBusy(false)
    }
  }

  const generateReturn = async () => {
    setBusy(true)
    setError(null)
    setIssues([])

    try {
      const res = await fetch("/api/tax/filing/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fy: financialYear,
          identity: {
            ...identity,
            middleName: identity.middleName || undefined,
            aadhaar: identity.aadhaar || undefined,
          },
          address,
          bankAccounts: [{ ...bankAccount, isRefundAccount: true }],
        }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setIssues(body.issues ?? [])
        setError(body.error ?? "Could not generate the return.")
        return
      }

      setGenerated({ fileName: body.fileName, json: body.json, warnings: body.warnings ?? [] })
    } catch {
      setError("Could not generate the return. Check your connection and retry.")
    } finally {
      setBusy(false)
    }
  }

  const downloadJson = () => {
    if (!generated) return
    const blob = new Blob([JSON.stringify(generated.json, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = generated.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Preparing your filing…
      </div>
    )
  }

  const chosen = draft ? (draft.selectedRegime === "OLD" ? draft.computation.old : draft.computation.new) : null
  const criticalFindings = draft?.findings.filter((f) => f.severity === "critical") ?? []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tax" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to tax overview
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">File your return</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Assessment year {draft?.assessmentYear ?? "—"} · {draft?.itrForm ?? "Form to be determined"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="fy" className="text-xs text-muted-foreground">
                Financial year
              </Label>
              <select
                id="fy"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-transparent text-sm"
              >
                {FINANCIAL_YEARS.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy.replace("-20", "-")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setStep(s.number)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer",
                  step === s.number ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center",
                    step > s.number
                      ? "bg-emerald-500 text-white"
                      : step === s.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  )}
                >
                  {step > s.number ? <Check className="w-3.5 h-3.5" /> : s.number}
                </span>
                <span className="text-left">
                  <span className="block text-xs font-semibold">{s.title}</span>
                  <span className="block text-[10px] opacity-70">{s.caption}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Step 1: Documents ─────────────────────────── */}

        {step === 1 && (
          <div className="space-y-5">
            <Card className="p-5 md:p-6 border border-border">
              <h2 className="text-lg font-bold mb-1">Gather your source documents</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Your bank statements are already in. Adding these lets the return be cross-checked against what the
                department already knows about you — the single best defence against a mismatch notice.
              </p>

              <div className="space-y-4">
                {DOCUMENT_KINDS.map((kind) => {
                  const uploaded = documents.filter((d) => d.documentType === kind.type || (kind.type === "ais" && d.documentType === "tis"))
                  const parsed = uploaded.find((d) => d.status === "parsed")

                  return (
                    <div key={kind.type} className="p-4 rounded-xl border border-border bg-secondary/20">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-[240px]">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            {kind.title}
                            {parsed && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Parsed
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{kind.description}</p>

                          {parsed && (
                            <div className="mt-2 text-[11px] text-muted-foreground">
                              <span className="font-mono">{parsed.fileName}</span>
                              {parsed.confidence !== null && parsed.confidence < 0.8 && (
                                <span className="ml-2 text-amber-600">
                                  Low extraction confidence — check the figures in step 2.
                                </span>
                              )}
                              {parsed.missingFields && parsed.missingFields.length > 0 && (
                                <p className="mt-1 text-amber-600">
                                  Not found: {parsed.missingFields.join(", ")}
                                </p>
                              )}
                            </div>
                          )}

                          {uploaded.some((d) => d.status === "failed") && (
                            <p className="mt-2 text-[11px] text-destructive">
                              {uploaded.find((d) => d.status === "failed")?.errorMessage}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {parsed && (
                            <Button variant="ghost" size="sm" onClick={() => removeDocument(parsed.id)}>
                              Remove
                            </Button>
                          )}
                          <label className="inline-flex">
                            <input
                              type="file"
                              accept={kind.accept}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) uploadDocument(kind.type, file)
                                e.target.value = ""
                              }}
                            />
                            <span
                              className={cn(
                                "inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium cursor-pointer transition-colors",
                                "bg-secondary hover:bg-secondary/80 border border-border"
                              )}
                            >
                              {uploadingType === kind.type ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {parsed ? "Replace" : "Upload"}
                            </span>
                          </label>
                        </div>
                      </div>

                      {passwordFor?.type === kind.type && (
                        <div className="mt-4 p-3 rounded-lg bg-background border border-border">
                          <p className="text-xs text-muted-foreground mb-2">{passwordFor.hint}</p>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Document password"
                              className="h-9"
                            />
                            <Button
                              size="sm"
                              disabled={!password || uploadingType === kind.type}
                              onClick={() => uploadDocument(passwordFor.type, passwordFor.file, password)}
                            >
                              Unlock
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {draft && draft.gaps.length > 0 && (
              <Card className="p-5 border border-amber-500/30 bg-amber-500/5">
                <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  What is still missing
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {draft.gaps.map((gap, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-600">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="rounded-xl">
                Continue to audit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Audit & reconciliation ────────────── */}

        {step === 2 && draft && (
          <div className="space-y-5">
            <Card className="p-5 md:p-6 border border-border">
              <h2 className="text-lg font-bold mb-1">Reconciliation</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Sources used: {draft.sourcesUsed.length > 0 ? draft.sourcesUsed.join(", ") : "bank statements only"}.
                Where they disagree, the figure the department already holds is adopted.
              </p>

              <div className="space-y-3">
                {draft.findings.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nothing to reconcile yet — upload a Form 16 or your AIS.</p>
                )}

                {draft.findings.map((finding, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4 rounded-xl border",
                      finding.severity === "critical"
                        ? "border-destructive/30 bg-destructive/5"
                        : finding.severity === "warning"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border bg-secondary/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        {finding.severity === "critical" ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : finding.severity === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {finding.item}
                      </p>
                      <span className="text-sm font-bold tabular-nums">{inr(finding.adopted)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{finding.message}</p>
                    {finding.citation && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-mono">{finding.citation}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 md:p-6 border border-border">
              <h2 className="text-lg font-bold mb-1">Things only you can tell us</h2>
              <p className="text-sm text-muted-foreground mb-5">
                These decide which ITR form you must file. Getting the form wrong makes the return defective under
                Sec 139(9), so answer them honestly even where it means a longer form.
              </p>

              <div className="space-y-3">
                {[
                  { key: "hasFnOTrading", label: "I traded futures & options or did intraday equity trading", note: "This is business income, not capital gains — it requires ITR-3." },
                  { key: "hasForeignAssets", label: "I held assets outside India at any time during the year", note: "Includes foreign bank accounts, shares and RSUs vested abroad." },
                  { key: "hasForeignIncome", label: "I had income from a source outside India" },
                  { key: "isCompanyDirector", label: "I was a director in a company" },
                  { key: "holdsUnlistedEquity", label: "I held unlisted equity shares (including ESOPs in a private company)" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={Boolean(declarations[item.key as keyof typeof declarations])}
                      onChange={(e) =>
                        setDeclarations((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="block text-sm">{item.label}</span>
                      {item.note && <span className="block text-[11px] text-muted-foreground mt-0.5">{item.note}</span>}
                    </span>
                  </label>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="hp-count" className="text-xs">House properties owned</Label>
                    <Input
                      id="hp-count"
                      type="number"
                      min={0}
                      max={20}
                      value={declarations.housePropertyCount}
                      onChange={(e) =>
                        setDeclarations((prev) => ({ ...prev, housePropertyCount: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agri" className="text-xs">Agricultural income (₹)</Label>
                    <Input
                      id="agri"
                      type="number"
                      min={0}
                      value={declarations.agriculturalIncome}
                      onChange={(e) =>
                        setDeclarations((prev) => ({ ...prev, agriculturalIncome: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <p className="font-semibold text-sm mb-1">Capital gains</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Take these from your broker&apos;s realised P&amp;L statement. A CAS shows holdings, not gains, so we
                  cannot derive them for you.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stcg" className="text-xs">STCG on listed equity (Sec 111A)</Label>
                    <Input
                      id="stcg"
                      type="number"
                      min={0}
                      value={capitalGains.stcg111A}
                      onChange={(e) => setCapitalGains((prev) => ({ ...prev, stcg111A: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ltcg" className="text-xs">LTCG on listed equity (Sec 112A)</Label>
                    <Input
                      id="ltcg"
                      type="number"
                      min={0}
                      value={capitalGains.ltcg112A}
                      onChange={(e) => setCapitalGains((prev) => ({ ...prev, ltcg112A: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ocg" className="text-xs">Other gains (taxed at slab rates)</Label>
                    <Input
                      id="ocg"
                      type="number"
                      min={0}
                      value={capitalGains.otherCapitalGains}
                      onChange={(e) =>
                        setCapitalGains((prev) => ({ ...prev, otherCapitalGains: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                disabled={busy}
                className="rounded-xl"
                onClick={async () => {
                  if (await saveDeclarations()) setStep(3)
                }}
              >
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue to regime
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Regime ─────────────────────────────── */}

        {step === 3 && draft && chosen && (
          <div className="space-y-5">
            <Card className="p-5 md:p-6 border border-border">
              <h2 className="text-lg font-bold mb-1">Choose your regime</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Both columns are computed from the same reconciled figures. A salaried taxpayer may switch each year.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["OLD", "NEW"] as const).map((regime) => {
                  const computation = regime === "OLD" ? draft.computation.old : draft.computation.new
                  const isSelected = draft.selectedRegime === regime
                  const isRecommended = draft.recommendedRegime === regime

                  return (
                    <button
                      key={regime}
                      onClick={() => chooseRegime(regime)}
                      disabled={busy}
                      className={cn(
                        "text-left p-5 rounded-2xl border-2 transition-all cursor-pointer",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold">{regime === "OLD" ? "Old regime" : "New regime"}</span>
                        {isRecommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                            Cheaper
                          </span>
                        )}
                      </div>

                      <p className="text-2xl font-bold tabular-nums mb-4">{inr(computation.totalTaxPayable)}</p>

                      <dl className="space-y-1.5 text-xs">
                        {[
                          ["Gross total income", computation.grossTotalIncome],
                          ["Deductions", computation.totalDeductions],
                          ["Taxable income", computation.taxableIncome],
                          ["Tax at slab rates", computation.slabTax],
                          ["Tax on capital gains", computation.specialRateTax],
                          ["Sec 87A rebate", -computation.rebate87A],
                          ["Surcharge", computation.surcharge],
                          ["Cess (4%)", computation.cess],
                        ].map(([label, value]) => (
                          <div key={label as string} className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="tabular-nums">{inr(value as number)}</dd>
                          </div>
                        ))}
                      </dl>

                      {isSelected && (
                        <p className="mt-4 text-[11px] text-primary font-semibold inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>

              {draft.savingsWithRecommended > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  The {draft.recommendedRegime === "OLD" ? "old" : "new"} regime costs{" "}
                  <strong className="text-foreground">{inr(draft.savingsWithRecommended)}</strong> less on these figures.
                </p>
              )}
            </Card>

            <Card className="p-5 md:p-6 border border-border">
              <h3 className="font-bold text-sm mb-3">How this was computed</h3>
              <ol className="space-y-1.5 text-xs text-muted-foreground">
                {chosen.workings.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground/50 tabular-nums">{i + 1}.</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>

              {draft.caveats.map((caveat, i) => (
                <p key={i} className="mt-4 text-xs text-amber-600 leading-relaxed">
                  {caveat}
                </p>
              ))}
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="rounded-xl">
                Continue to filing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Generate ───────────────────────────── */}

        {step === 4 && draft && chosen && (
          <div className="space-y-5">
            <Card className="p-5 md:p-6 border border-border">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold">{draft.itrForm}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assessment year {draft.assessmentYear}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {chosen.netPayable > 0 ? "Still payable" : "Refund due"}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      chosen.netPayable > 0 ? "text-destructive" : "text-emerald-600"
                    )}
                  >
                    {inr(Math.abs(chosen.netPayable))}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border mb-5">
                <p className="text-xs font-semibold mb-2">Why {draft.itrForm}</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {draft.itrFormReasons.map((reason, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-600">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                {draft.itrFormWarnings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-600">
                    {draft.itrFormWarnings.map((warning, i) => (
                      <li key={i} className="flex gap-2">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {criticalFindings.length > 0 && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/30 mb-5">
                  <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Resolve before filing
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {criticalFindings.map((finding, i) => (
                      <li key={i}>
                        <strong className="text-foreground">{finding.item}:</strong> {finding.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Identity — required by the schema, not held in the profile */}
              <p className="font-semibold text-sm mb-1">Filing details</p>
              <p className="text-xs text-muted-foreground mb-4">
                The return schema needs these. They are used to build the file and are not stored.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="PAN" value={identity.pan} onChange={(v) => setIdentity((p) => ({ ...p, pan: v.toUpperCase() }))} placeholder="ABCDE1234F" />
                <Field label="Aadhaar (optional)" value={identity.aadhaar} onChange={(v) => setIdentity((p) => ({ ...p, aadhaar: v }))} placeholder="12 digits" />
                <Field label="First name" value={identity.firstName} onChange={(v) => setIdentity((p) => ({ ...p, firstName: v }))} />
                <Field label="Surname" value={identity.lastName} onChange={(v) => setIdentity((p) => ({ ...p, lastName: v }))} />
                <Field label="Date of birth" type="date" value={identity.dob} onChange={(v) => setIdentity((p) => ({ ...p, dob: v }))} />
                <Field label="Mobile" value={identity.mobile} onChange={(v) => setIdentity((p) => ({ ...p, mobile: v }))} placeholder="10 digits" />
                <Field label="Email" type="email" value={identity.email} onChange={(v) => setIdentity((p) => ({ ...p, email: v }))} />
              </div>

              <p className="font-semibold text-sm mt-6 mb-3">Address</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="House / flat number" value={address.flatDoorBlock} onChange={(v) => setAddress((p) => ({ ...p, flatDoorBlock: v }))} />
                <Field label="Building name (optional)" value={address.premisesName} onChange={(v) => setAddress((p) => ({ ...p, premisesName: v }))} />
                <Field label="Road / street (optional)" value={address.roadStreet} onChange={(v) => setAddress((p) => ({ ...p, roadStreet: v }))} />
                <Field label="Area / locality" value={address.areaLocality} onChange={(v) => setAddress((p) => ({ ...p, areaLocality: v }))} />
                <Field label="City" value={address.city} onChange={(v) => setAddress((p) => ({ ...p, city: v }))} />
                <Field label="State" value={address.state} onChange={(v) => setAddress((p) => ({ ...p, state: v }))} placeholder="Maharashtra" />
                <Field label="PIN code" value={address.pincode} onChange={(v) => setAddress((p) => ({ ...p, pincode: v.replace(/\D/g, "").slice(0, 6) }))} />
              </div>

              <p className="font-semibold text-sm mt-6 mb-1">Refund account</p>
              <p className="text-xs text-muted-foreground mb-3">
                Any refund is credited here. It must be pre-validated on the e-filing portal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="IFSC" value={bankAccount.ifsc} onChange={(v) => setBankAccount((p) => ({ ...p, ifsc: v.toUpperCase() }))} placeholder="HDFC0000123" />
                <Field label="Bank name" value={bankAccount.bankName} onChange={(v) => setBankAccount((p) => ({ ...p, bankName: v }))} />
                <Field label="Account number" value={bankAccount.accountNumber} onChange={(v) => setBankAccount((p) => ({ ...p, accountNumber: v.replace(/\D/g, "") }))} />
              </div>

              {issues.length > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-destructive/5 border border-destructive/30">
                  <p className="text-xs font-semibold text-destructive mb-2">Fix these before the return can be generated</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {issues.map((issue, i) => (
                      <li key={i}>
                        <span className="font-mono text-[10px] text-muted-foreground/70">{issue.field}</span> — {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={generateReturn} disabled={busy} className="rounded-xl">
                  {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Generate {draft.itrForm} JSON
                </Button>
                {generated && (
                  <Button variant="outline" onClick={downloadJson} className="rounded-xl">
                    <Download className="w-4 h-4 mr-2" />
                    Download {generated.fileName}
                  </Button>
                )}
              </div>
            </Card>

            {generated && (
              <Card className="p-5 md:p-6 border border-emerald-500/30 bg-emerald-500/5">
                <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your return is ready
                </p>
                <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Download the JSON file above.</li>
                  <li>
                    Sign in at <span className="font-mono">incometax.gov.in</span> and go to e-File → Income Tax Returns
                    → File Income Tax Return.
                  </li>
                  <li>Select assessment year {draft.assessmentYear}, then choose &quot;Upload JSON&quot; as the filing mode.</li>
                  <li>Upload the file, review every schedule the portal shows, and correct anything that looks wrong.</li>
                  <li>
                    Submit, then e-verify within 30 days by Aadhaar OTP, net banking or DSC. An unverified return is
                    treated as never filed.
                  </li>
                </ol>

                {generated.warnings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <p className="text-xs font-semibold text-amber-600 mb-1.5">Before you submit</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {generated.warnings.map((warning, i) => (
                        <li key={i}>{warning.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                  FinFlow prepares this file from what you uploaded and declared. You remain responsible for the
                  contents of your return. Have a practising Chartered Accountant review it if your affairs are at all
                  complex.
                </p>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Link href={`/tax/report?fy=${financialYear}`}>
                <Button variant="outline" className="rounded-xl">
                  View CA audit report
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Small field helper ─────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-")
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
