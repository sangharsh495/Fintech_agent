"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import DashboardCharts from "@/components/dashboard-charts"
import { TrendingUp, AlertCircle, PieChart, ArrowUpRight, Wallet, DollarSign, BarChart3, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AIWidget } from "@/components/ai-sidebar"

interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  netWorth: number
  savingsRate: number
}

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
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
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Dashboard() {
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
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Wallet className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-h2 font-bold mb-4">Welcome to FinFlow!</h1>
        <p className="text-body-lg text-muted-foreground max-w-md mb-8">
          You don't have any financial data yet. Let's get started by uploading your first bank statement to analyze your cash flow.
        </p>
        <Link href="/upload">
          <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors">
            Upload Statement
          </button>
        </Link>
      </div>
    )
  }

  const stats = [
    {
      label: "Total Balance",
      value: data.totalBalance,
      suffix: "",
      prefix: "₹",
      change: "Current",
      changeType: "neutral",
      icon: Wallet,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Monthly Income",
      value: data.monthlyIncome,
      suffix: "",
      prefix: "₹",
      change: "This month",
      changeType: "positive",
      icon: DollarSign,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Monthly Expense",
      value: data.monthlyExpense,
      suffix: "",
      prefix: "₹",
      change: "This month",
      changeType: "neutral",
      icon: BarChart3,
      color: "from-orange-500 to-amber-500",
    },
    {
      label: "Net Worth",
      value: data.netWorth,
      suffix: "",
      prefix: "₹",
      change: "Total",
      changeType: "positive",
      icon: Target,
      color: "from-purple-500 to-pink-500",
    },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">
        {/* Decorative Blurs */}
        <div className="absolute top-0 left-1/4 w-[24rem] h-[24rem] bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000" />
        <div className="absolute bottom-0 right-1/4 w-[24rem] h-[24rem] bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300" />

        <div className="relative z-10 px-4 md:px-6 lg:px-8 py-10 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-in-from-bottom-4 max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <TrendingUp className="w-4 h-4" />
              Real-time Analytics
            </div>
            <h1 className="text-h1 md:text-display-md font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Financial <span className="text-gradient">Command Center</span>
            </h1>
            <p className="text-body-xl text-muted-foreground w-full max-w-2xl mx-auto">
              Your unified dashboard for tracking income, expenses, investments, and financial goals in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Stats Grid */}
        <section aria-label="Key Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="stat-card group" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative z-10 p-5 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                        stat.color,
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                        stat.changeType === "positive" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                        stat.changeType === "neutral" && "text-muted-foreground bg-secondary/50 border-border/50",
                      )}>
                        {stat.changeType === "positive" && <ArrowUpRight className="w-3.5 h-3.5" />}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <p className="text-body-sm text-muted-foreground mb-2">{stat.label}</p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <h3 className="text-numeric-lg font-bold text-gradient">
                        <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                      </h3>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Performance Report Chart */}
        <section aria-label="Performance Report">
          <Card className="p-4 md:p-6 card-hover slide-in-from-bottom-4 border border-border bg-slate-900/30">
            <DashboardCharts type="performance" data={analyticsData} />
          </Card>
        </section>

        {/* Income vs Expense & Savings Rate */}
        <section aria-label="Cash Flow & Savings" className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <Card className="lg:col-span-3 p-4 md:p-6 card-hover slide-in-from-bottom-4 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-h4 font-bold">Income vs Expense</h2>
                <p className="text-body-sm text-muted-foreground">Monthly cash flow comparison</p>
              </div>
            </div>
            <DashboardCharts type="income-expense" data={analyticsData} />
          </Card>

          {/* Savings Rate */}
          <Card className="p-4 md:p-6 card-hover slide-in-from-bottom-4 border border-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="text-h4 font-bold mb-8 text-center relative z-10 text-foreground">Savings Rate</h2>
            <div className="flex flex-col items-center justify-center gap-6 relative z-10">
              <div className="relative w-40 h-40 float">
                {/* Glow behind the ring */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl z-0 scale-75" />
                <svg className="w-full h-full transform -rotate-90 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--secondary)" strokeWidth="12" className="opacity-20" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#gradient-savings)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="circular-progress drop-shadow-lg"
                    style={{ strokeDasharray: `${data.savingsRate * 2.64} 264` }}
                  />
                  <defs>
                    <linearGradient id="gradient-savings" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="text-numeric-lg font-extrabold text-gradient drop-shadow-sm">{Math.round(data.savingsRate)}%</span>
                </div>
              </div>
              <div className="text-center bg-background/50 backdrop-blur-sm px-5 py-2 rounded-full border border-white/5">
                <p className="text-body-sm font-bold text-foreground">Excellent savings!</p>
                <p className="text-body-xs text-muted-foreground">Keep up the great work</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Category Breakdown & Smart Alerts */}
        <section aria-label="Category Breakdown & Alerts" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-4 md:p-6 card-hover slide-in-from-bottom-4 border border-border">
            <h2 className="text-h4 font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Expense Breakdown
            </h2>
            <DashboardCharts type="expenses" data={analyticsData} />
          </Card>

          {/* Smart Alerts */}
          <Card className="p-4 md:p-6 slide-in-from-bottom-4 border border-border">
            <h2 className="text-h4 font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Smart Alerts
            </h2>
            <div className="space-y-4 stagger-children">
              {alerts.length > 0 ? alerts.map((alert, i) => (
                <div
                  key={i}
                  onClick={() => setActiveAlert(activeAlert === i ? null : i)}
                  className={cn(
                    "alert-card group flex items-start p-4 cursor-pointer",
                    alert.type === "warning" && "warning",
                    alert.type === "success" && "success",
                    alert.type === "info" && "info",
                    activeAlert === i && "ring-2 ring-primary shadow-lg scale-[1.02]",
                  )}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex gap-4 w-full">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                      alert.type === "warning" && "bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                      alert.type === "success" && "bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                      alert.type === "info" && "bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.2)]",
                    )}>
                      <AlertCircle className={cn(
                        "w-6 h-6",
                        alert.type === "warning" && "text-amber-500",
                        alert.type === "success" && "text-emerald-500",
                        alert.type === "info" && "text-sky-500",
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-body-sm text-foreground mb-1">{alert.title}</p>
                      <p className="text-body-xs text-muted-foreground leading-relaxed">{alert.message || alert.desc}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm">No new alerts to show right now.</p>
              )}
            </div>
          </Card>
        </section>

        {/* Net Worth Trend */}
        <section aria-label="Net Worth Trend">
          <Card className="p-4 md:p-6 card-hover slide-in-from-bottom-4 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h4 font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Net Worth Trend
              </h2>
            </div>
            <DashboardCharts type="networth" data={analyticsData} />
          </Card>
        </section>
      </main>
    </div>
  )
}