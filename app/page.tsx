"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import DashboardCharts from "@/components/dashboard-charts"
import { TrendingUp, AlertCircle, PieChart, ArrowUpRight, Wallet, DollarSign, BarChart3, Target, Sparkles } from "lucide-react"
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
    <span className="tabular-nums tracking-tight">
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (hasData === false || !data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-xl shadow-primary/5">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-foreground">Welcome to FinFlow</h1>
        <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
          You don't have any financial data yet. Upload your first bank statement to unlock powerful AI-driven insights.
        </p>
        <Link href="/upload">
          <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
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
      shadow: "shadow-emerald-500/20",
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
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Monthly Expense",
      value: data.monthlyExpense,
      suffix: "",
      prefix: "₹",
      change: "This month",
      changeType: "neutral",
      icon: BarChart3,
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/20",
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
      shadow: "shadow-purple-500/20",
    },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-border/40 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 px-6 py-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-in slide-in-from-bottom-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Real-time Analytics
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
            Financial <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Command Center</span>
          </h1>
          <p className="text-base text-muted-foreground w-full max-w-2xl mx-auto leading-relaxed">
            Your unified dashboard for tracking income, expenses, investments, and financial goals in real-time.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8 w-full max-w-7xl mx-auto space-y-8">
        
        {/* Stats Grid */}
        <section aria-label="Key Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div 
                  key={index} 
                  className="relative p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 group-hover:opacity-10">
                    <Icon className="w-24 h-24" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                        stat.color,
                        stat.shadow
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                        stat.changeType === "positive" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                        stat.changeType === "neutral" && "text-muted-foreground bg-secondary/80 border-border",
                      )}>
                        {stat.changeType === "positive" && <ArrowUpRight className="w-3 h-3" />}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Performance Report Chart */}
        <section aria-label="Performance Report">
          <Card className="p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full">
              <DashboardCharts type="performance" data={analyticsData} />
            </div>
          </Card>
        </section>

        {/* Income vs Expense & Savings Rate */}
        <section aria-label="Cash Flow & Savings" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Income vs Expense</h2>
                  <p className="text-xs text-muted-foreground mt-1">Monthly cash flow comparison</p>
                </div>
              </div>
              <div className="flex-1">
                <DashboardCharts type="income-expense" data={analyticsData} />
              </div>
            </div>
          </Card>

          {/* Savings Rate */}
          <Card className="lg:col-span-4 p-1 rounded-[1.5rem] bg-gradient-to-br from-primary/20 via-border/10 to-accent/20 border-none shadow-sm group">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h2 className="text-lg font-bold mb-8 text-center relative z-10 text-foreground w-full">Savings Rate</h2>
              
              <div className="flex flex-col items-center justify-center gap-6 relative z-10 w-full flex-1">
                <div className="relative w-40 h-40">
                  {/* Subtle Glow */}
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl z-0 scale-75 group-hover:scale-90 transition-transform duration-700" />
                  
                  <svg className="w-full h-full transform -rotate-90 relative z-10 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#gradient-savings)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
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
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {Math.round(data.savingsRate)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-center bg-secondary/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-border/50">
                  <p className="text-sm font-semibold text-foreground">Excellent savings!</p>
                  <p className="text-xs text-muted-foreground">Keep up the great work</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Category Breakdown & Smart Alerts */}
        <section aria-label="Category Breakdown & Alerts" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Expense Breakdown
              </h2>
              <DashboardCharts type="expenses" data={analyticsData} />
            </div>
          </Card>

          {/* Smart Alerts */}
          <Card className="lg:col-span-6 p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Smart Alerts
              </h2>
              <div className="space-y-3">
                {alerts.length > 0 ? alerts.map((alert, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveAlert(activeAlert === i ? null : i)}
                    className={cn(
                      "group flex items-start p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                      alert.type === "warning" && "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30",
                      alert.type === "success" && "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30",
                      alert.type === "info" && "bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-500/30",
                      activeAlert === i && "ring-1 ring-primary shadow-md scale-[1.01] bg-card",
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex gap-4 w-full">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        alert.type === "warning" && "bg-amber-500/10 text-amber-500",
                        alert.type === "success" && "bg-emerald-500/10 text-emerald-500",
                        alert.type === "info" && "bg-sky-500/10 text-sky-500",
                      )}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground mb-1">{alert.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{alert.message || alert.desc}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/30 rounded-xl border border-dashed border-border">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">All good!</p>
                    <p className="text-xs text-muted-foreground max-w-[200px] mt-1">We'll alert you if anything needs your attention.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Net Worth Trend */}
        <section aria-label="Net Worth Trend">
          <Card className="p-1 rounded-[1.5rem] bg-gradient-to-br from-border/50 to-border/10 border-none shadow-sm">
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Net Worth Trend
                </h2>
              </div>
              <DashboardCharts type="networth" data={analyticsData} />
            </div>
          </Card>
        </section>
      </main>
      
      {/* AI Assistant Widget */}
      <AIWidget pageContext="/" defaultOpen={false} />
    </div>
  )
}
