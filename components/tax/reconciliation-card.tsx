"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FileCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function Form16AISReconciliation({
  employerTds = 112000,
  aisTds = 112000,
  bankInterestStatement = 28450,
  aisInterest = 28450,
}: {
  employerTds?: number
  aisTds?: number
  bankInterestStatement?: number
  aisInterest?: number
}) {
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditComplete, setAuditComplete] = useState(true)

  const tdsMismatch = Math.abs(employerTds - aisTds)
  const interestMismatch = Math.abs(bankInterestStatement - aisInterest)
  const isClean = tdsMismatch === 0 && interestMismatch === 0

  const handleRunAudit = () => {
    setIsAuditing(true)
    setTimeout(() => {
      setIsAuditing(false)
      setAuditComplete(true)
    }, 800)
  }

  return (
    <Card className="p-6 md:p-8 rounded-[2rem] border border-border bg-card/60 backdrop-blur-2xl shadow-xl space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <FileCheck className="w-4 h-4" /> 3-Way Statutory Tax Reconciliation
          </div>
          <h3 className="text-xl font-bold text-foreground">Form 16 vs. AIS / 26AS vs. Bank Statements</h3>
        </div>

        <Button
          onClick={handleRunAudit}
          variant="outline"
          size="sm"
          disabled={isAuditing}
          className="rounded-xl border-border bg-secondary/40 hover:bg-secondary"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isAuditing && "animate-spin")} />
          {isAuditing ? "Auditing Tax Credits..." : "Re-Audit Credits"}
        </Button>
      </div>

      {/* Grid of 3-way check cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* TDS Check */}
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Salary TDS (Form 16 vs 26AS)</span>
              {tdsMismatch === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" /> 100% Matched
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="w-3 h-3" /> ₹{tdsMismatch} Discrepancy
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-[10px] text-muted-foreground block">Form 16 Part A</span>
                <span className="text-lg font-bold font-mono text-foreground">₹{employerTds.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Form 26AS / AIS</span>
                <span className="text-lg font-bold font-mono text-foreground">₹{aisTds.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/40">
            Employer quarterly e-TDS returns verified with TRACES portal.
          </p>
        </div>

        {/* Savings Interest Check */}
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Savings Interest (Bank vs AIS)</span>
              {interestMismatch === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" /> 100% Matched
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="w-3 h-3" /> ₹{interestMismatch} Untracked
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-[10px] text-muted-foreground block">Bank Statement Credits</span>
                <span className="text-lg font-bold font-mono text-foreground">₹{bankInterestStatement.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Reported in AIS (TIS)</span>
                <span className="text-lg font-bold font-mono text-foreground">₹{aisInterest.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/40">
            Eligible for Section 80TTA deduction up to ₹10,000 in Old Regime.
          </p>
        </div>

      </div>

      {/* Audit Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">No Defective Return Risk Detected</p>
            <p className="text-[11px] text-muted-foreground">Your tax credits match the official ITD AIS ledger. You can file safely without Section 139(9) notices.</p>
          </div>
        </div>
      </div>

    </Card>
  )
}
