"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import {
  ShieldCheck,
  TrendingUp,
  Flame,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  PiggyBank,
  Compass,
  ArrowRight,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function FinancialHealthScore({
  monthlyIncome = 150000,
  monthlyExpense = 65000,
  totalSavings = 850000,
}: {
  monthlyIncome?: number
  monthlyExpense?: number
  totalSavings?: number
}) {
  // 1. Savings Rate (%) = (Income - Expense) / Income * 100
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense)
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

  // 2. Emergency Fund Runway (Months of living expenses covered)
  const emergencyMonths = monthlyExpense > 0 ? totalSavings / monthlyExpense : 0

  // 3. FIRE Target Number ($25 \times \text{Annual Expenses}$)
  const annualExpense = monthlyExpense * 12
  const fireTargetCorpus = annualExpense * 25
  const currentFireProgress = Math.min(100, (totalSavings / fireTargetCorpus) * 100)

  // 4. Financial Health Score (0 - 1000)
  // - Savings Rate score (max 400 pts): 50% savings rate = 400 pts
  const savingsScore = Math.min(400, (savingsRate / 50) * 400)
  // - Emergency Buffer score (max 350 pts): 6 months = 350 pts
  const emergencyScore = Math.min(350, (emergencyMonths / 6) * 350)
  // - FIRE Progress score (max 250 pts):
  const fireScore = Math.min(250, (currentFireProgress / 50) * 250)

  const totalHealthScore = Math.round(savingsScore + emergencyScore + fireScore)

  const getScoreGrade = (score: number) => {
    if (score >= 800) return { label: "Excellent • Wealth Builder", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
    if (score >= 600) return { label: "Good • Resilient", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" }
    if (score >= 400) return { label: "Moderate • Needs Optimization", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
    return { label: "Critical • High Expense Pressure", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" }
  }

  const grade = getScoreGrade(totalHealthScore)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── Score Gauge Card ── */}
      <Card className="p-6 md:p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Health Index</span>
            <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border", grade.bg, grade.color, grade.border)}>
              {grade.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-4">
            <span className="text-5xl font-extrabold font-mono text-foreground">{totalHealthScore}</span>
            <span className="text-muted-foreground text-sm font-semibold">/ 1000</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${(totalHealthScore / 1000) * 100}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
          Aggregates savings rate stability, emergency fund runway ($B_e \ge 6M$), and long-term capital compounding resilience.
        </p>
      </Card>

      {/* ── Liquidity & Savings Rate Card ── */}
      <Card className="p-6 md:p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            <PiggyBank className="w-4 h-4 text-primary" /> Liquidity & Savings Metrics
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Savings Rate</span>
              <p className="text-2xl font-bold font-mono text-primary mt-1">{savingsRate.toFixed(1)}%</p>
              <span className="text-[10px] text-emerald-500">Target: ≥ 30%</span>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Runway Buffer</span>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{emergencyMonths.toFixed(1)} Mo</p>
              <span className="text-[10px] text-muted-foreground">Ideal: 6–12 Months</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/40">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Surplus cash flow available for systematic equity allocation.</span>
        </div>
      </Card>

      {/* ── FIRE Independence Runway Card ── */}
      <Card className="p-6 md:p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Flame className="w-4 h-4 text-amber-500" /> FIRE Freedom Index
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
              25x Rule ($4\%$)
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground">Target Independence Corpus</span>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">₹{(fireTargetCorpus / 10000000).toFixed(2)} Cr</p>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Current Progress</span>
              <span className="font-mono font-bold text-primary">{currentFireProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${currentFireProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/40">
          <Compass className="w-4 h-4 text-primary shrink-0" />
          <span>Annual Living Expenses: ₹{(annualExpense / 100000).toFixed(2)} Lakhs</span>
        </div>
      </Card>

    </div>
  )
}
