"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import DashboardCharts from "@/components/dashboard-charts"
import { TrendingUp, AlertCircle, PieChart, ArrowUpRight, Wallet, DollarSign, BarChart3, Target } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Dashboard() {
  const [data] = useState<DashboardData>({
    totalBalance: 45280,
    monthlyIncome: 85000,
    monthlyExpense: 42500,
    netWorth: 285000,
    savingsRate: 50,
  })

  const [mounted, setMounted] = useState(false)
  const [activeAlert, setActiveAlert] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const stats = [
    {
      label: "Total Balance",
      value: data.totalBalance / 1000,
      suffix: "K",
      prefix: "₹",
      change: "+12%",
      changeType: "positive",
      icon: Wallet,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Monthly Income",
      value: data.monthlyIncome / 1000,
      suffix: "K",
      prefix: "₹",
      change: "+8%",
      changeType: "positive",
      icon: DollarSign,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Monthly Expense",
      value: data.monthlyExpense / 1000,
      suffix: "K",
      prefix: "₹",
      change: "50% of income",
      changeType: "neutral",
      icon: BarChart3,
      color: "from-orange-500 to-amber-500",
    },
    {
      label: "Net Worth",
      value: data.netWorth / 100000,
      suffix: "L",
      prefix: "₹",
      change: "Strong growth",
      changeType: "positive",
      icon: Target,
      color: "from-purple-500 to-pink-500",
    },
  ]

  const alerts = [
    { title: "Budget Alert", desc: "You've spent 78% of your monthly food budget", type: "warning" },
    { title: "Goal Progress", desc: "Emergency fund: 85% towards ₹5L target", type: "success" },
    { title: "Investment Opportunity", desc: "SIP returns up 15% YoY", type: "info" },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">

        {/* Decorative Blurs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-up max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <TrendingUp className="w-4 h-4" />
              Real-time Analytics
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Financial <span className="gradient-text">Command Center</span>
            </h1>
            <p className="text-lg text-muted-foreground w-full">
              Your unified dashboard for tracking income, expenses, investments, and financial goals in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="stat-card group">
                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                      stat.color,
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="number-display gradient-text">
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </h3>
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                      stat.changeType === "positive" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                      stat.changeType === "neutral" && "text-muted-foreground bg-secondary/50 border-border/50",
                    )}
                  >
                    {stat.changeType === "positive" && <ArrowUpRight className="w-3.5 h-3.5" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Performance Report Chart */}
        <Card className="p-6 card-hover slide-up border border-border bg-slate-900/30">
          <DashboardCharts type="performance" />
        </Card>

        {/* Income vs Expense Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <Card className="xl:col-span-3 p-6 card-hover slide-up border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Income vs Expense</h2>
            </div>
            <DashboardCharts type="income-expense" />
          </Card>

          {/* Savings Rate */}
          <Card className="p-6 card-hover slide-up border border-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-xl font-bold mb-8 text-center relative z-10 text-foreground">Savings Rate</h2>
            <div className="flex flex-col items-center justify-center gap-6 relative z-10">
              <div className="relative w-48 h-48 float">
                {/* Glow behind the ring */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl z-0 scale-75"></div>

                <svg className="w-full h-full transform -rotate-90 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--secondary)"
                    strokeWidth="12"
                    className="opacity-20"
                  />
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
                  <span className="text-5xl font-extrabold gradient-text drop-shadow-sm">{data.savingsRate}%</span>
                </div>
              </div>
              <div className="text-center bg-background/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/5">
                <p className="text-sm font-bold text-foreground">Excellent savings!</p>
                <p className="text-xs text-muted-foreground">Keep up the great work</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="p-6 card-hover slide-up border border-border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Expense Breakdown
            </h2>
            <DashboardCharts type="expenses" />
          </Card>

          {/* Smart Alerts */}
          <Card className="p-6 slide-up border border-border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Smart Alerts
            </h2>
            <div className="space-y-4 stagger-children">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  onClick={() => setActiveAlert(activeAlert === i ? null : i)}
                  className={cn(
                    "alert-card group flex items-start p-4",
                    alert.type === "warning" && "warning",
                    alert.type === "success" && "success",
                    alert.type === "info" && "info",
                    activeAlert === i && "ring-2 ring-primary shadow-lg scale-[1.02]",
                  )}
                >
                  <div className="flex gap-4 w-full">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                        alert.type === "warning" && "bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                        alert.type === "success" && "bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                        alert.type === "info" && "bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.2)]",
                      )}
                    >
                      <AlertCircle
                        className={cn(
                          "w-6 h-6",
                          alert.type === "warning" && "text-amber-500",
                          alert.type === "success" && "text-emerald-500",
                          alert.type === "info" && "text-sky-500",
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-foreground mb-1">{alert.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{alert.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Net Worth Trend */}
        <Card className="p-6 card-hover slide-up border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Net Worth Trend
            </h2>
          </div>
          <DashboardCharts type="networth" />
        </Card>
      </div>
    </div>
  )
}
