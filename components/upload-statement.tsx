"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, AlertCircle, X, Building2, Plus } from "lucide-react"

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
    // Default to current month
    const now = new Date()
    setStatementMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  }, [])

  async function fetchBanks() {
    const res = await fetch("/api/banks")
    if (res.ok) {
      const data = await res.json()
      setBanks(data.banks || [])
      if (data.banks?.length > 0 && !selectedBank) {
        setSelectedBank(data.banks[0].id)
      }
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
    const allowed = ["application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]
    const extAllowed = selectedFile.name.match(/\.(pdf|csv|xlsx|xls)$/i)
    if (!extAllowed) {
      setResult({ error: "Only PDF, CSV, and Excel files are supported" })
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setResult({ error: "File must be under 10MB" })
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
        setResult({ error: data.error || "Upload failed" })
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
      setResult({ error: "Network error. Please try again." })
    }
  }

  return (
    <div className="space-y-4">
      {/* Bank Account Selector */}
      <div>
        <label className="block text-sm font-semibold mb-2">Bank Account</label>
        {!showAddBank ? (
          <div className="flex gap-2">
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {banks.length === 0 && <option value="">No bank accounts — add one</option>}
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bankName} {bank.accountNickname ? `— ${bank.accountNickname}` : ""} {bank.accountLast4 ? `(••${bank.accountLast4})` : ""}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowAddBank(true)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Add New Bank Account</p>
              <button onClick={() => setShowAddBank(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={newBank.bankName}
              onChange={(e) => setNewBank((b) => ({ ...b, bankName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">Select bank</option>
              {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBank.accountNickname}
                onChange={(e) => setNewBank((b) => ({ ...b, accountNickname: e.target.value }))}
                placeholder="Nickname (e.g. Salary Account)"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <select
                value={newBank.accountType}
                onChange={(e) => setNewBank((b) => ({ ...b, accountType: e.target.value as "savings" | "current" | "salary" }))}
                className="px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="savings">Savings</option>
                <option value="salary">Salary</option>
                <option value="current">Current</option>
              </select>
            </div>
            <Button size="sm" onClick={handleAddBank} disabled={!newBank.bankName} className="w-full">
              <Building2 className="w-4 h-4 mr-2" />
              Add Bank Account
            </Button>
          </Card>
        )}
      </div>

      {/* Statement Month */}
      <div>
        <label className="block text-sm font-semibold mb-2">Statement Month</label>
        <input
          type="month"
          value={statementMonth}
          onChange={(e) => setStatementMonth(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* File Drop Zone */}
      <div>
        <label className="block text-sm font-semibold mb-2">Bank Statement File</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : file
              ? "border-green-500 bg-green-500/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
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
            <div className="space-y-2">
              <FileText className="w-8 h-8 text-green-500 mx-auto" />
              <p className="font-semibold text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>
                <p className="font-semibold text-sm">Drop your bank statement here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {["PDF", "Excel", "CSV"].map((fmt) => (
                  <span key={fmt} className="text-xs px-2 py-1 rounded-full bg-muted border border-border font-mono">
                    {fmt}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Max 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {result.error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {result.error}
        </div>
      )}

      {/* Success */}
      {status === "success" && result.message && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-2">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
            <CheckCircle className="w-4 h-4" />
            Upload Complete!
          </div>
          <p className="text-sm text-muted-foreground">{result.message}</p>
          {result.transactionsAdded !== undefined && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-green-500/10 text-center">
                <p className="font-bold text-lg text-green-600">{result.transactionsAdded}</p>
                <p className="text-muted-foreground">New transactions</p>
              </div>
              <div className="p-2 rounded-lg bg-muted text-center">
                <p className="font-bold text-lg">{result.transactionsSkipped}</p>
                <p className="text-muted-foreground">Duplicates skipped</p>
              </div>
            </div>
          )}
          {result.gapWarning && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              ⚠️ {result.gapWarning}
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {status !== "success" && (
        <Button
          onClick={handleUpload}
          disabled={!file || !selectedBank || status === "uploading" || status === "processing"}
          className="w-full"
        >
          {status === "uploading" ? (
            <><span className="animate-spin mr-2">⏳</span> Uploading...</>
          ) : status === "processing" ? (
            <><span className="animate-spin mr-2">⚙️</span> Processing transactions...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Upload & Process Statement</>
          )}
        </Button>
      )}

      {status === "success" && (
        <Button
          variant="outline"
          onClick={() => { setStatus("idle"); setResult({}) }}
          className="w-full"
        >
          Upload Another Statement
        </Button>
      )}
    </div>
  )
}
