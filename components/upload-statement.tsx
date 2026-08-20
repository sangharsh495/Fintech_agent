"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Plus,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BankAccount {
  id: string
  bankName: string
  accountNickname?: string | null
  accountLast4?: string | null
  accountType: string
}

type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error"

export function UploadStatement({ onSuccess }: { onSuccess?: () => void }) {
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [selectedBank, setSelectedBank] = useState("")
  const [statementMonth, setStatementMonth] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [result, setResult] = useState<{
    transactionsAdded?: number
    transactionsSkipped?: number
    gapWarning?: string
    message?: string
    error?: string
  }>({})
  const [showAddBank, setShowAddBank] = useState(false)
  const [newBank, setNewBank] = useState({
    bankName: "",
    accountNickname: "",
    accountType: "savings" as "savings" | "current" | "salary",
  })

  useEffect(() => {
    fetchBanks()
    const now = new Date()
    setStatementMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  }, [])

  async function fetchBanks() {
    try {
      const res = await fetch("/api/banks")
      if (res.ok) {
        const data = await res.json()
        setBanks(data.banks || [])
        if (data.banks?.length > 0 && !selectedBank) {
          setSelectedBank(data.banks[0].id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch banks", err)
    }
  }

  async function handleAddBank() {
    if (!newBank.bankName) return
    const res = await fetch("/api/banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBank),
    })
    if (res.ok) {
      const data = await res.json()
      await fetchBanks()
      setSelectedBank(data.bank.id)
      setShowAddBank(false)
      setNewBank({ bankName: "", accountNickname: "", accountType: "savings" })
    }
  }

  const handleFileChange = (selectedFile: File) => {
    const extAllowed = selectedFile.name.match(/\.(pdf|csv|xlsx|xls)$/i)
    if (!extAllowed) {
      setResult({ error: "Only PDF, CSV, and Excel (.xlsx, .xls) statements are supported" })
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setResult({ error: "Statement file must be under 10MB" })
      return
    }
    setFile(selectedFile)
    setResult({})
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileChange(dropped)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleUpload = async () => {
    if (!file || !selectedBank) return

    setStatus("uploading")
    setResult({})

    const formData = new FormData()
    formData.append("file", file)
    formData.append("bankAccountId", selectedBank)
    if (statementMonth) formData.append("statementMonth", statementMonth)

    try {
      setStatus("processing")
      const res = await fetch("/api/upload/statement", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setResult({ error: data.error || "Failed to process bank statement" })
        return
      }

      setStatus("success")
      setResult({
        transactionsAdded: data.transactionsAdded,
        transactionsSkipped: data.transactionsSkipped,
        gapWarning: data.gapWarning,
        message: data.message,
      })
      setFile(null)
      onSuccess?.()
    } catch {
      setStatus("error")
      setResult({ error: "Network error during upload. Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Target Bank Account Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> Target Bank Account
          </label>
          <span className="text-[11px] text-muted-foreground">Deterministic Account Ledger</span>
        </div>

        {!showAddBank ? (
          <div className="flex gap-2">
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-border/80 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            >
              {banks.length === 0 && <option value="">No accounts found — create one</option>}
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bankName} {bank.accountNickname ? `(${bank.accountNickname})` : ""} {bank.accountLast4 ? `••${bank.accountLast4}` : ""}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowAddBank(true)}
              className="shrink-0 rounded-xl h-10 w-10 border-border/80 hover:bg-secondary"
              title="Add Bank Account"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Card className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Link New Bank Account</p>
              <button
                onClick={() => setShowAddBank(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={newBank.bankName}
              onChange={(e) => setNewBank((b) => ({ ...b, bankName: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
            >
              <option value="">Select Indian Bank</option>
              {[
                "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank",
                "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda",
                "Canara Bank", "IndusInd Bank", "Yes Bank", "Other"
              ].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBank.accountNickname}
                onChange={(e) => setNewBank((b) => ({ ...b, accountNickname: e.target.value }))}
                placeholder="Nickname (e.g. Salary / Savings)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              />
              <select
                value={newBank.accountType}
                onChange={(e) => setNewBank((b) => ({ ...b, accountType: e.target.value as "savings" | "current" | "salary" }))}
                className="px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              >
                <option value="savings">Savings</option>
                <option value="salary">Salary</option>
                <option value="current">Current</option>
              </select>
            </div>
            <Button size="sm" onClick={handleAddBank} disabled={!newBank.bankName} className="w-full rounded-xl text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Save Account to Vault
            </Button>
          </Card>
        )}
      </div>

      {/* Statement Month Picker */}
      <div>
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
          Statement Period
        </label>
        <input
          type="month"
          value={statementMonth}
          onChange={(e) => setStatementMonth(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
        />
      </div>

      {/* File Dropzone */}
      <div>
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
          Statement File (PDF, CSV, Excel)
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : file
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-border/80 hover:border-primary/50 hover:bg-secondary/40 bg-card/60"
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />

          {file ? (
            <div className="space-y-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{(file.size / 1024).toFixed(1)} KB • Ready for Ingestion</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
                className="text-xs text-destructive hover:underline font-semibold mt-1 cursor-pointer"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Drag & Drop Bank Statement Here</p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse local files</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                {["PDF", "Excel (.xlsx)", "CSV"].map((fmt) => (
                  <span key={fmt} className="text-[10px] px-2.5 py-1 rounded-full bg-secondary border border-border/60 font-semibold text-muted-foreground">
                    {fmt}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" /> End-to-End Encrypted (Max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {result.error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2.5 text-xs text-destructive font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {result.error}
        </div>
      )}

      {/* Success Notification */}
      {status === "success" && result.message && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4.5 h-4.5" />
            Statement Ingestion Complete!
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.message}</p>
          
          {result.transactionsAdded !== undefined && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="font-black text-xl text-emerald-600 dark:text-emerald-400 font-mono">{result.transactionsAdded}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">New Transactions</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="font-black text-xl text-foreground font-mono">{result.transactionsSkipped || 0}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Duplicates Skipped</p>
              </div>
            </div>
          )}

          {result.gapWarning && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{result.gapWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* Primary Action Button */}
      {status !== "success" ? (
        <Button
          onClick={handleUpload}
          disabled={!file || !selectedBank || status === "uploading" || status === "processing"}
          className="w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          {status === "uploading" ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              Uploading encrypted statement…
            </span>
          ) : status === "processing" ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Extracting tables & SHA-256 deduplication…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Ingest & Parse Bank Statement
            </span>
          )}
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setStatus("idle")
            setResult({})
          }}
          className="w-full h-12 rounded-xl font-bold border-border/80 hover:bg-secondary"
        >
          Ingest Another Bank Statement
        </Button>
      )}

    </div>
  )
}

