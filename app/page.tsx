"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import DashboardCharts from "@/components/dashboard-charts"
import {
  TrendingUp,
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Building2,
  Sparkles,
  ChevronRight,
  Plus,
  ArrowRight,
  Activity,
  User,
  ShieldCheck,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AIWidget } from "@/components/ai-sidebar"
import LandingPage from "@/components/landing-page"

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
    const duration = 1000
    const steps = 40
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

// Helper to assign a luxury visual theme to bank accounts
function getBankTheme(bankName: string) {
  const lower = bankName.toLowerCase()
  if (lower.includes("hdfc")) {
    return {
      bg: "from-blue-600 via-blue-700 to-indigo-900",
      accent: "bg-blue-500/20 border-blue-400/30 text-blue-300",
      pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    }
  }
  if (lower.includes("icici")) {
    return {
      bg: "from-amber-600 via-orange-600 to-red-800",
      accent: "bg-orange-500/20 border-orange-400/30 text-orange-200",
      pill: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    }
  }
  if (lower.includes("state") || lower.includes("sbi")) {
    return {
      bg: "from-cyan-700 via-sky-800 to-slate-900",
      accent: "bg-cyan-500/20 border-cyan-400/30 text-cyan-200",
      pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    }
  }
  if (lower.includes("axis")) {
    return {
      bg: "from-rose-700 via-pink-800 to-purple-950",
      accent: "bg-rose-500/20 border-rose-400/30 text-rose-200",
      pill: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    }
  }
  if (lower.includes("kotak")) {
    return {
      bg: "from-red-600 via-rose-700 to-slate-900",
      accent: "bg-red-500/20 border-red-400/30 text-red-200",
      pill: "bg-red-500/10 text-red-400 border-red-500/20",
    }
  }
  return {
    bg: "from-slate-700 via-slate-800 to-slate-950",
    accent: "bg-slate-500/20 border-slate-400/30 text-slate-300",
    pill: "bg-slate-500/10 text-slate-400 border-slate-500/20",
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
  const [txFilter, setTxFilter] = useState("")

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

  const filteredTransactions = useMemo(() => {
    if (!data?.recentTransactions) return []
    if (!txFilter.trim()) return data.recentTransactions.slice(0, 6)
    const q = txFilter.toLowerCase()
    return data.recentTransactions.filter(
      (tx) =>
        (tx.merchant && tx.merchant.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [data?.recentTransactions, txFilter])

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 animate-ping" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Synchronizing Wealth Intelligence…</p>
        </div>
      </div>
    )
  }

  if (hasData === false || !data) {
    return <LandingPage />
  }

  const userName = session?.user?.name?.split(" ")[0] || "Member"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col space-y-8">
      
      {/* ── 1. EXECUTIVE WEALTH HEADER & ACTIONS ── */}
      <header className="rounded-3xl p-6 bg-gradient-to-r from-card/80 via-card to-card/90 border border-border/70 shadow-sm backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Vault Sync
            </span>
            <span className="text-xs text-muted-foreground">• FY 2025–26</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-1.5 flex items-center gap-2">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your consolidated wealth portfolio across {data.perBankBalances.length} bank accounts is up to date.
          </p>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/upload">
            <button className="inline-flex items-center justify-center px-4 py-2.25 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/25 cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Upload Statement
            </button>
          </Link>
          <Link href="/tax">
            <button className="inline-flex items-center justify-center px-3.5 py-2.25 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Tax Slabs
            </button>
          </Link>
          <Link href="/ai-ca">
            <button className="inline-flex items-center justify-center px-3.5 py-2.25 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
              Virtual CA
            </button>
          </Link>
        </div>
      </header>

      {/* ── 2. HERO NET WORTH & CASHFLOW GAUGES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Net Worth Main Hero Area Card */}
        <Card className="lg:col-span-8 p-6 md:p-8 rounded-[2rem] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[96px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Consolidated Net Worth
                </span>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                    <AnimatedCounter value={data.netWorth} prefix="₹" />
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Verified Continuity</span>
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            {/* Asset Breakdown Chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/80 text-muted-foreground border border-border/40">
                Liquid Balance: <strong className="text-foreground font-mono">₹{data.totalBalance.toLocaleString("en-IN")}</strong>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/80 text-muted-foreground border border-border/40">
                Accounts: <strong className="text-foreground">{data.perBankBalances.length} Synchronized</strong>
              </span>
            </div>
          </div>

          {/* Inline Net Worth Area Chart */}
          <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
            <DashboardCharts type="networth" data={analyticsData} />
          </div>
        </Card>

        {/* Right Cashflow Stack: Inflow, Outflow & Savings Ring */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Inflow vs Outflow Dual Card */}
          <Card className="p-5 md:p-6 rounded-[2rem] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm flex-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Cashflow Pulse (Monthly)
            </p>
            <div className="space-y-3.5">
              
              {/* Inflow */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ArrowDownLeft className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Monthly Inflow</p>
                    <p className="text-base font-extrabold text-foreground font-mono">
                      ₹{data.monthlyIncome.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                  Credited
                </span>
              </div>

              {/* Outflow */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <ArrowUpRight className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Monthly Outflow</p>
                    <p className="text-base font-extrabold text-foreground font-mono">
                      ₹{data.monthlyExpense.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500">
                  Debited
                </span>
              </div>

            </div>
          </Card>

          {/* Savings Rate Radial Card */}
          <Card className="p-5 md:p-6 rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Savings Quotient
                </p>
                <p className="text-3xl font-black text-foreground font-mono mt-1">
                  {data.savingsRate}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {data.savingsRate >= 30 ? "🔥 Excellent Wealth Accumulation" : "⚡ Target 30%+ with 50/30/20 rule"}
                </p>
              </div>

              <div className="relative w-18 h-18 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-secondary" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    style={{ strokeDasharray: `${Math.min(100, Math.max(0, data.savingsRate)) * 2.51} 251` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-extrabold text-primary font-mono">{data.savingsRate}%</span>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* ── 3. LUXURY BANK ASSETS CAROUSEL / GRID ── */}
      <section aria-label="Linked Bank Accounts" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Synchronized Bank Accounts
            </h3>
            <p className="text-xs text-muted-foreground">Deterministic SHA-256 deduplicated ledgers</p>
          </div>
          <Link href="/upload" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            + Add Bank Account
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.perBankBalances.map((bank) => {
            const theme = getBankTheme(bank.bankName)
            return (
              <div
                key={bank.bankId}
                className={cn(
                  "p-5 rounded-[1.75rem] text-white shadow-md relative overflow-hidden bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]",
                  theme.bg
                )}
              >
                {/* Background Card Ambient Texture */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                        {bank.accountType} Account
                      </span>
                      <h4 className="font-extrabold text-base tracking-tight text-white mt-0.5 truncate max-w-[170px]">
                        {bank.bankName}
                      </h4>
                    </div>
                    <div className="w-9 h-6 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center shadow-xs">
                      <div className="w-6 h-3 rounded-xs border border-amber-600/40" />
                    </div>
                  </div>

                  <div className="pt-2 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-white/70 font-mono">
                        {bank.accountLast4 ? `•••• •••• ${bank.accountLast4}` : "•••• •••• ACTIVE"}
                      </p>
                      <p className="text-xl font-black text-white font-mono mt-0.5">
                        ₹{bank.balance.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md", theme.accent)}>
                      Active Vault
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 4. TAX OPPORTUNITY AI COPILOT BANNER ── */}
      <div className="p-6 rounded-[2rem] bg-gradient-to-r from-primary/15 via-accent/10 to-transparent border border-primary/25 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                AI Virtual CA Recommendation
              </span>
            </div>
            <h4 className="font-extrabold text-base text-foreground mt-1">
              Maximize Section 80CCD(1B) & HRA Exemption for FY 2025–26
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
              Based on your detected income slabs, investing ₹50,000 in Tier-1 NPS can yield up to ₹15,600 additional tax rebate under Old Regime.
            </p>
          </div>
        </div>
        <Link href="/tax">
          <button className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer">
            Review Tax Deductions →
          </button>
        </Link>
      </div>

      {/* ── 5. PERFORMANCE TIMELINE & EXPENSE DONUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Performance Report */}
        <Card className="lg:col-span-7 p-6 rounded-[2rem] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Performance Timeline
              </h3>
              <p className="text-xs text-muted-foreground">Historical income vs expense progression</p>
            </div>
          </div>
          <DashboardCharts type="performance" data={analyticsData} />
        </Card>

        {/* Expense Category Breakdown */}
        <Card className="lg:col-span-5 p-6 rounded-[2rem] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                Spending Distribution
              </h3>
              <p className="text-xs text-muted-foreground">Automated ML category clustering</p>
            </div>
          </div>
          <DashboardCharts type="expenses" data={analyticsData} />
        </Card>

      </div>

      {/* ── 6. RECENT TRANSACTIONS STREAM & ALERTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Transactions List with Search/Filter */}
        <Card className="lg:col-span-7 p-6 rounded-[2rem] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Ledger Activity
              </h3>
              <p className="text-xs text-muted-foreground">Parsed line items from your statements</p>
            </div>
            
            {/* Fast Filter Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter transactions..."
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48 text-foreground"
              />
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx: any, idx: number) => {
                const isCredit = tx.type === "credit"
                return (
                  <div key={tx.id || idx} className="py-3.5 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs",
                          isCredit
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-secondary text-foreground border border-border/50"
                        )}
                      >
                        {tx.category ? tx.category.substring(0, 2).toUpperCase() : "TX"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {tx.merchant || tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.25 rounded">
                            {tx.category || "General"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          "text-sm font-black font-mono",
                          isCredit ? "text-emerald-500" : "text-foreground"
                        )}
                      >
                        {isCredit ? "+" : "-"}₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                      </p>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {isCredit ? "CR" : "DR"}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No transactions matched your search.
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-border/40 text-center">
            <Link href="/analytics" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
              View Complete Financial Analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Right Alerts & Anomalies Feed */}
        <Card className="lg:col-span-5 p-6 rounded-[2rem] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-primary" />
              DBSCAN Anomaly Radar
            </h3>
            <p className="text-xs text-muted-foreground mb-4">ML outlier analysis on recurring debits</p>

            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveAlert(activeAlert === i ? null : i)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10",
                      activeAlert === i && "ring-1 ring-primary shadow-sm bg-card"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-foreground mb-0.5">Spike Flagged</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed truncate-2-lines">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/70">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Zero Critical Anomalies</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                    DBSCAN clustering detects steady spending cadence with no duplicate fees.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/40">
            <Link
              href="/analytics/clusters"
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground transition-colors"
            >
              Explore ML Cluster Maps <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

      </div>

      {/* AI Assistant Context Widget */}
      <AIWidget pageContext="/" defaultOpen={false} />
    </div>
  )
}

