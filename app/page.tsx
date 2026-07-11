"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import DashboardCharts from "@/components/dashboard-charts"
import {
  TrendingUp,
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  DollarSign,
  BarChart3,
  Target,
  Building2,
  Sparkles,
  ChevronRight,
  Plus,
  ArrowRight,
  Activity,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AIWidget } from "@/components/ai-sidebar"

interface BankBalanceItem {
  bankId: string
  bankName: string
  accountNickname: string | null
  accountLast4: string | null
  accountType: string
  balance: number
}

interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  netWorth: number
  savingsRate: number
  recentTransactions: any[]
  perBankBalances: BankBalanceItem[]
}

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1200
    const steps = 50
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {displayValue.toLocaleString("en-IN")}
      {suffix}
    </span>
  )
}

// Helper to assign a dynamic theme to bank accounts
function getBankTheme(bankName: string) {
  const lower = bankName.toLowerCase()
  if (lower.includes("hdfc")) {
    return {
      bg: "from-blue-600 to-cyan-500",
      text: "text-blue-500",
      pill: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    }
  }
  if (lower.includes("icici")) {
    return {
      bg: "from-orange-500 to-amber-500",
      text: "text-orange-500",
      pill: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    }
  }
  if (lower.includes("state") || lower.includes("sbi")) {
    return {
      bg: "from-cyan-600 to-sky-500",
      text: "text-cyan-500",
      pill: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    }
  }
  if (lower.includes("axis")) {
    return {
      bg: "from-rose-700 to-pink-500",
      text: "text-rose-500",
      pill: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    }
  }
  if (lower.includes("kotak")) {
    return {
      bg: "from-red-600 to-amber-500",
      text: "text-red-500",
      pill: "bg-red-500/10 border-red-500/20 text-red-400",
    }
  }
  return {
    bg: "from-slate-700 to-slate-500",
    text: "text-slate-500",
    pill: "bg-slate-500/10 border-slate-500/20 text-slate-400",
  }
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeAlert, setActiveAlert] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      fetch("/api/dashboard").then((res) => res.json()),
      fetch("/api/analytics").then((res) => res.json())
    ])
      .then(([dashJson, analyticsJson]) => {
        setHasData(dashJson.hasData)
        if (dashJson.hasData) {
          setData({
            totalBalance: dashJson.totalBalance,
            monthlyIncome: dashJson.monthlyIncome,
            monthlyExpense: dashJson.monthlyExpense,
            netWorth: dashJson.netWorth,
            savingsRate: dashJson.savingsRate,
            recentTransactions: dashJson.recentTransactions || [],
            perBankBalances: dashJson.perBankBalances || [],
          })
          setAlerts(dashJson.alerts || [])
          setAnalyticsData(analyticsJson)
        }
      })
      .catch((err) => console.error("Failed to load dashboard data:", err))
      .finally(() => setIsLoading(false))
  }, [])

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (hasData === false || !data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6 text-center pt-24">
        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10 animate-bounce">
          <Wallet className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Welcome to FinFlow</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Upload your bank statements to unlock INDmoney-style wealth tracking, automatic spending categorization, and AI-powered tax optimizations.
        </p>
        <Link href="/upload">
          <button className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-xl text-white bg-primary hover:bg-primary/95 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-5 h-5 mr-2" />
            Upload Your First Statement
          </button>
        </Link>
      </div>
    )
  }

  const userName = session?.user?.name?.split(" ")[0] || "Member"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      
      {/* Dynamic IndMoney-Style Welcome Header */}
      <header className="px-6 lg:px-8 py-5 border-b border-border bg-gradient-to-r from-card via-background to-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Hello, {userName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Here is your consolidated wealth overview today.</p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap gap-2">
          <Link href="/upload">
            <button className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/10">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Upload Statement
            </button>
          </Link>
          <Link href="/tax">
            <button className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Tax Engine
            </button>
          </Link>
          <Link href="/ai-ca">
            <button className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
              Ask Virtual CA
            </button>
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 px-6 lg:px-8 py-6 md:py-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* TOP ROW: Net Worth Area Card & Monthly Inflow / Outflow summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Consolidated Net Worth Card with Integrated Sparkline (INDmoney style) */}
          <Card className="lg:col-span-8 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 via-card to-border/10 border-none shadow-sm overflow-hidden group">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Net Worth</p>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                    <AnimatedCounter value={data.netWorth} prefix="₹" />
                  </h2>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mt-2">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Consolidated Balance</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              {/* Directly inline the net worth Area Chart underneath the number */}
              <div className="mt-8 border-t border-border/40 pt-4 flex-1">
                <DashboardCharts type="networth" data={analyticsData} />
              </div>
            </div>
          </Card>

          {/* Monthly Inflow, Outflow & Savings gauge */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Income & Expense Cashflow Overview */}
            <Card className="p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm flex-1">
              <div className="bg-card rounded-2xl p-5 h-full w-full flex flex-col justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cashflow (This Month)</p>
                <div className="space-y-4">
                  {/* Income */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Inflow</p>
                        <p className="text-sm font-bold text-foreground">
                          ₹{data.monthlyIncome.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Active</span>
                  </div>

                  {/* Expense */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Outflow</p>
                        <p className="text-sm font-bold text-foreground">
                          ₹{data.monthlyExpense.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">Debited</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Savings Rate Card */}
            <Card className="p-1 rounded-[1.5rem] bg-gradient-to-br from-primary/10 via-border/10 to-accent/10 border-none shadow-sm">
              <div className="bg-card rounded-2xl p-5 h-full w-full flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Savings Rate</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">{data.savingsRate}%</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Saved from total inflow</p>
                </div>
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-secondary" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      style={{ strokeDasharray: `${data.savingsRate * 2.64} 264` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{data.savingsRate}%</span>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>

        {/* MIDDLE SECTION: Asset Grid (Individual Bank Balances, matching INDmoney's Account list) */}
        <section aria-label="Bank Accounts List" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Your Bank Accounts & Assets
            </h3>
            <span className="text-xs text-muted-foreground">{data.perBankBalances.length} accounts linked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.perBankBalances.map((bank, index) => {
              const theme = getBankTheme(bank.bankName)
              return (
                <Card key={bank.bankId} className="p-1 rounded-[1.25rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all">
                  <div className="bg-card rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Stylized Bank Avatar Logo */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-md",
                        theme.bg
                      )}>
                        {bank.bankName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground truncate max-w-[140px]">{bank.bankName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {bank.accountType.toUpperCase()} {bank.accountLast4 ? `••${bank.accountLast4}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">
                        ₹{bank.balance.toLocaleString("en-IN")}
                      </p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 inline-block", theme.pill)}>
                        Linked
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* BOTTOM SECTION: Performance Report, Categories and Alerts/Anomalies */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Income vs Expense Performance Timeline */}
          <Card className="lg:col-span-6 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Performance Timeline
                </h3>
              </div>
              <div className="flex-1">
                <DashboardCharts type="performance" data={analyticsData} />
              </div>
            </div>
          </Card>

          {/* Expense Categories Breakdown */}
          <Card className="lg:col-span-6 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Expense Distribution
                </h3>
              </div>
              <div className="flex-1">
                <DashboardCharts type="expenses" data={analyticsData} />
              </div>
            </div>
          </Card>

        </div>

        {/* SPLIT TRANSACTIONS & ALERTS FEED (Pure INDmoney Product Flow) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Recent Transactions list */}
          <Card className="lg:col-span-7 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </h3>
                <Link href="/analytics" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-border/40">
                {data.recentTransactions.slice(0, 5).map((tx: any, idx: number) => (
                  <div key={tx.id || idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] shadow-sm",
                        tx.type === "credit" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                      )}>
                        {tx.category ? tx.category.substring(0, 2).toUpperCase() : "TX"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{tx.merchant || tx.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • {tx.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-extrabold",
                        tx.type === "credit" ? "text-emerald-500" : "text-foreground"
                      )}>
                        {tx.type === "credit" ? "+" : "-"}₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Right Column: Smart Alerts & Warnings */}
          <Card className="lg:col-span-5 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-5">
                <AlertCircle className="w-4 h-4 text-primary" />
                Wealth Insights & Alerts
              </h3>
              <div className="space-y-3">
                {alerts.length > 0 ? alerts.map((alert, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveAlert(activeAlert === i ? null : i)}
                    className={cn(
                      "group flex items-start p-3 rounded-xl border transition-all duration-300 cursor-pointer bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10",
                      activeAlert === i && "ring-1 ring-primary shadow-sm bg-card",
                    )}
                  >
                    <div className="flex gap-3 w-full">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-xs text-foreground mb-0.5">Anomaly Flagged</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed truncate-2-lines">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-secondary/20 rounded-xl border border-dashed border-border/60">
                    <Sparkles className="w-7 h-7 text-muted-foreground/45 mb-2" />
                    <p className="text-xs font-semibold text-foreground">Your financial health is stable</p>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[180px] mx-auto">No transaction anomalies detected this month.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>

      </main>

      {/* AI virtual Assistant Widget */}
      <AIWidget pageContext="/" defaultOpen={false} />
    </div>
  )
}
