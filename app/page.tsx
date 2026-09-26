"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
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
  RefreshCw,
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeAlert, setActiveAlert] = useState<number | null>(null)
  const [txFilter, setTxFilter] = useState("")
  const [chartView, setChartView] = useState<"networth" | "performance" | "expenses">("networth")

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [dashRes, analyticsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/analytics"),
      ])
      if (!dashRes.ok) return
      const dashJson = await dashRes.json()
      const analyticsJson = analyticsRes.ok ? await analyticsRes.json() : null

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
        if (analyticsJson) setAnalyticsData(analyticsJson)
      }
    } catch (err) {
      console.error("Dashboard sync error:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchDashboardData(true)

    // Window focus refetch: Automatically syncs whenever you switch back from Mobile APK
    const handleFocus = () => {
      fetchDashboardData(false)
    }
    window.addEventListener("focus", handleFocus)

    // Periodic live sync every 20 seconds while tab is active
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchDashboardData(false)
      }
    }, 20000)

    return () => {
      window.removeEventListener("focus", handleFocus)
      clearInterval(interval)
    }
  }, [fetchDashboardData])

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

  const userName = session?.user?.name?.split(" ")[0] || "Member"

  const handleLoadDemoData = () => {
    setData({
      totalBalance: 4892450,
      monthlyIncome: 285000,
      monthlyExpense: 92400,
      netWorth: 4892450,
      savingsRate: 67.5,
      recentTransactions: [
        { id: "1", date: "2026-08-20", merchant: "Salary Credit (Tech Corp)", description: "Monthly Professional Salary", amount: 245000, type: "credit", category: "Income", bankName: "HDFC Bank" },
        { id: "2", date: "2026-08-18", merchant: "Zerodha Broking Ltd", description: "Monthly Mutual Fund SIP 80C", amount: 25000, type: "debit", category: "Investments", bankName: "HDFC Bank" },
        { id: "3", date: "2026-08-17", merchant: "Swiggy UPI", description: "Food & Dining", amount: 840, type: "debit", category: "Dining", bankName: "ICICI Bank" },
        { id: "4", date: "2026-08-15", merchant: "Amazon India", description: "Office Equipment & Tech", amount: 4200, type: "debit", category: "Shopping", bankName: "State Bank of India" },
        { id: "5", date: "2026-08-12", merchant: "Cult.fit Wellness", description: "Annual Fitness Plan", amount: 14500, type: "debit", category: "Health", bankName: "HDFC Bank" },
      ],
      perBankBalances: [
        { bankId: "hdfc-1", bankName: "HDFC Bank", accountNickname: "Primary Salary", accountLast4: "4921", accountType: "savings", balance: 2845200 },
        { bankId: "icici-1", bankName: "ICICI Bank", accountNickname: "Wealth Account", accountLast4: "8820", accountType: "savings", balance: 1420150 },
        { bankId: "sbi-1", bankName: "State Bank of India", accountNickname: "Family Savings", accountLast4: "1039", accountType: "savings", balance: 627100 },
      ],
    })
    setHasData(true)
  }

  // 1. Unauthenticated users see the public marketing landing page
  if (!session?.user) {
    return <LandingPage />
  }

  // 2. Authenticated users who haven't uploaded bank statements see the Onboarding / Welcome Dashboard
  if (hasData === false || !data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col space-y-8 animate-in fade-in duration-300">
        
        {/* Welcome Header */}
        <header className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-card/90 via-card to-card/90 border border-border/80 shadow-sm backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Account Active &amp; Ready
              </span>
              <span className="text-xs text-muted-foreground">• FY 2025–26</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">
              Welcome to FinFlow, {userName}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Your autonomous financial cockpit is configured. Upload your first statement to unlock live analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoadDemoData}
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 text-primary" />
              1-Click Demo Mode
            </button>
            <Link href="/upload">
              <button className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25 cursor-pointer">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Upload Statement
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Getting Started Banner */}
        <Card className="p-8 sm:p-12 rounded-[2.5rem] border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden shadow-xl text-left">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 1 of 2</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Ingest Your First Bank Statement
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              FinFlow automatically unlocks password-protected PDFs across 21+ Indian banks (HDFC, ICICI, SBI, Axis, Kotak, etc.), categorizes spending with Scikit-Learn DBSCAN cohorts, and computes real-time tax deductions.
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link href="/upload">
                <button className="inline-flex items-center px-6 py-3.5 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all">
                  Go to Statement Ingestion <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <button
                onClick={handleLoadDemoData}
                className="inline-flex items-center px-5 py-3.5 rounded-2xl text-xs font-semibold bg-background/80 border border-border hover:bg-secondary transition-all cursor-pointer"
              >
                Preview with Sample Data (Instant)
              </button>
            </div>
          </div>
        </Card>

        {/* 3 Exploration Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/ai-ca" className="group">
            <Card className="p-6 rounded-2xl border-border/70 bg-card hover:border-primary/50 transition-all h-full flex flex-col justify-between group-hover:shadow-lg">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">AI Virtual CA Copilot</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Ask complex Indian income tax questions under IT Act 1961 with statutory legal citations.
                </p>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                Consult Virtual CA <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>
          </Link>

          <Link href="/tax" className="group">
            <Card className="p-6 rounded-2xl border-border/70 bg-card hover:border-primary/50 transition-all h-full flex flex-col justify-between group-hover:shadow-lg">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">Tax Strategy &amp; Slabs</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Compare Old vs New Regime liability under Budget 2024–26 slabs and maximize 80C/80D/44ADA.
                </p>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                Open Tax Simulator <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>
          </Link>

          <Link href="/calculators" className="group">
            <Card className="p-6 rounded-2xl border-border/70 bg-card hover:border-primary/50 transition-all h-full flex flex-col justify-between group-hover:shadow-lg">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">30+ Universal Calculators</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Precision financial calculators for SIP, SWP, EMI, NPS, Gratuity, HRA, and Capital Gains.
                </p>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore Calculators <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>
          </Link>

        </div>

      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col space-y-6 sm:space-y-8">
      
      {/* ── 1. EXECUTIVE WEALTH HEADER & ACTIONS ── */}
      <header className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-card/80 via-card to-card/90 border border-border/70 shadow-xs backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Vault Sync
            </span>
            <span className="text-[11px] text-muted-foreground">• FY 2025–26</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mt-1.5 flex items-center gap-2">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your consolidated portfolio across {data.perBankBalances.length} bank accounts is verified.
          </p>
        </div>

        {/* Action Button Strip - Balanced on mobile & desktop */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fetchDashboardData(false)}
            disabled={isRefreshing}
            title="Instant Live Sync with Mobile APK & Database"
            className="w-full inline-flex items-center justify-center px-3 sm:px-3.5 py-2 sm:py-2.25 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1 sm:mr-1.5 text-primary", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>
          <Link href="/upload" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.25 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/25 cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
              <span>Upload</span>
            </button>
          </Link>
          <Link href="/tax" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center px-3 sm:px-3.5 py-2 sm:py-2.25 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-primary" />
              <span>Tax Slabs</span>
            </button>
          </Link>
          <Link href="/ai-ca" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center px-3 sm:px-3.5 py-2 sm:py-2.25 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary transition-all cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-accent" />
              <span>Virtual CA</span>
            </button>
          </Link>
        </div>
      </header>

      {/* ── 2. EXECUTIVE 4-METRIC TOP BAR (Balanced & Compact) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Net Worth */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Net Worth
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              <AnimatedCounter value={data.netWorth} prefix="₹" />
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500">
                <ArrowUpRight className="w-3 h-3" />
                Verified
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                across {data.perBankBalances.length} accounts
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 2: Monthly Inflow */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Monthly Inflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black text-emerald-500 tracking-tight font-mono">
              ₹{data.monthlyIncome.toLocaleString("en-IN")}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold text-muted-foreground">
                Credited this cycle
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 3: Monthly Outflow */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-xs hover:border-rose-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Monthly Outflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black text-rose-500 tracking-tight font-mono">
              ₹{data.monthlyExpense.toLocaleString("en-IN")}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold text-muted-foreground">
                Debited this cycle
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 4: Savings Quotient */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-xs hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-end justify-between">
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-mono">
                {data.savingsRate}%
              </p>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {data.savingsRate >= 30 ? "🔥 Strong accumulation" : "⚡ Target 30%+"}
              </span>
            </div>
            <div className="relative w-9 h-9 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ strokeDasharray: `${Math.min(100, Math.max(0, data.savingsRate)) * 0.88} 88` }}
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. INTERACTIVE ANALYTICS CANVAS + BANK VAULTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left: Tabbed Financial Intelligence Chart (8 Cols) */}
        <Card className="lg:col-span-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Financial Intelligence Canvas
              </h2>
              <p className="text-xs text-muted-foreground">
                {chartView === "networth" && "Historical net worth progression over time"}
                {chartView === "performance" && "Cashflow velocity: monthly income vs debits"}
                {chartView === "expenses" && "DBSCAN category-wise expense breakdown"}
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
              <button
                onClick={() => setChartView("networth")}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  chartView === "networth"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Net Worth
              </button>
              <button
                onClick={() => setChartView("performance")}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  chartView === "performance"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cashflow
              </button>
              <button
                onClick={() => setChartView("expenses")}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  chartView === "expenses"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Categories
              </button>
            </div>
          </div>

          {/* Active Chart Display */}
          <div className="pt-2">
            <DashboardCharts type={chartView} data={analyticsData} />
          </div>
        </Card>

        {/* Right: Synchronized Bank Accounts Vault (4 Cols) */}
        <Card className="lg:col-span-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  Bank Vaults
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {data.perBankBalances.length} Synchronized Accounts
                </p>
              </div>
              <Link href="/upload">
                <span className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                  + Add
                </span>
              </Link>
            </div>

            {/* Bank Accounts Stack */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
              {data.perBankBalances.map((bank) => {
                const theme = getBankTheme(bank.bankName)
                return (
                  <div
                    key={bank.bankId}
                    className={cn(
                      "p-3.5 rounded-2xl text-white shadow-xs relative overflow-hidden bg-gradient-to-br transition-all hover:scale-[1.01]",
                      theme.bg
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                          {bank.accountType}
                        </span>
                        <h4 className="font-extrabold text-xs tracking-tight text-white mt-0.5 truncate max-w-[150px]">
                          {bank.bankName}
                        </h4>
                      </div>
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md", theme.accent)}>
                        Active
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-[11px] text-white/70 font-mono">
                        {bank.accountLast4 ? `•••• ${bank.accountLast4}` : "•••• ACTIVE"}
                      </span>
                      <span className="text-sm font-black text-white font-mono">
                        ₹{bank.balance.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border/40">
            <Link href="/upload" className="w-full block">
              <button className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Plus className="w-3.5 h-3.5 text-primary" />
                Upload Statement
              </button>
            </Link>
          </div>
        </Card>

      </div>

      {/* ── 4. TAX OPPORTUNITY AI COPILOT BANNER ── */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary/10 via-card to-accent/5 border border-primary/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-primary/20 text-primary">
                Tax Optimization Alert
              </span>
              <span className="text-[10px] text-muted-foreground">• FY 2025–26</span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground mt-0.5">
              Maximize Section 80CCD(1B) NPS &amp; Section 80D Health Deductions
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Save up to ₹15,600 additional tax by allocating ₹50,000 to Tier-1 NPS under Old Regime.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/tax">
            <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
              Compare Regimes →
            </button>
          </Link>
          <Link href="/ai-ca">
            <button className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs transition-colors cursor-pointer">
              Ask AI CA
            </button>
          </Link>
        </div>
      </div>

      {/* ── 5. RECENT ACTIVITY STREAM & ANOMALY RADAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Recent Transactions List with Search/Filter (7 Cols) */}
        <Card className="lg:col-span-7 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Ledger Activity
              </h3>
              <p className="text-xs text-muted-foreground">Statements parsed &amp; verified</p>
            </div>
            
            {/* Fast Filter Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter transactions..."
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-44 text-foreground"
              />
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx: any, idx: number) => {
                const isCredit = tx.type === "credit"
                return (
                  <div key={tx.id || idx} className="py-2.5 sm:py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-[11px] shadow-xs",
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded">
                            {tx.category || "General"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          "text-xs sm:text-sm font-black font-mono",
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

          <div className="pt-3 mt-2 border-t border-border/40 text-center">
            <Link href="/analytics" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
              View Complete Analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Right Alerts & DBSCAN Anomalies (5 Cols) */}
        <Card className="lg:col-span-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-primary" />
              DBSCAN Anomaly Radar
            </h3>
            <p className="text-xs text-muted-foreground mb-3.5">ML outlier analysis on recurring debits</p>

            <div className="space-y-2.5">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveAlert(activeAlert === i ? null : i)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all cursor-pointer bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10",
                      activeAlert === i && "ring-1 ring-primary shadow-xs bg-card"
                    )}
                  >
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-foreground">Spike Flagged</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed truncate">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/70">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1.5 shadow-xs">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Zero Critical Anomalies</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px] mx-auto leading-relaxed">
                    DBSCAN clustering confirms regular spending cadence with no unauthorized spikes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border/40">
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

