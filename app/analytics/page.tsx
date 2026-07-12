"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Brain,
  ChevronRight,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ClusterAnalytics from "@/components/cluster-analytics"
import { AIWidget } from "@/components/ai-sidebar"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xl min-w-[180px]">
        <p className="font-bold text-foreground mb-3 text-sm border-b border-border pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-3 py-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
            />
            <span className="text-muted-foreground flex-1">{entry.name}:</span>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              ₹{(entry.value as number).toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
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

const formatMonth = (YYYYMM: string) => {
  if (!YYYYMM) return ""
  const [year, month] = YYYYMM.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState("this-month")
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      fetch("/api/dashboard").then((res) => res.json()),
      fetch("/api/analytics").then((res) => res.json())
    ]).then(([dash, analytics]) => {
      setDashboardData(dash)
      setAnalyticsData(analytics)
      setIsLoading(false)
    }).catch((err) => {
      console.error(err)
      setIsLoading(false)
    })
  }, [])

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analyticsData?.hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[calc(100vh-4rem)]">
        <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">No Analytics Data Yet</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Upload your bank statements to generate deep insights, track your spending patterns, and monitor your cash flow.
        </p>
        <Button onClick={() => window.location.href = '/upload'} size="lg" className="rounded-xl shadow-lg shadow-primary/25">
          Upload Statements
        </Button>
      </div>
    )
  }

  const totalBalance = dashboardData?.stats?.totalBalance || 0
  const monthlyIncome = analyticsData?.totals?.income || 0
  const monthlyExpense = analyticsData?.totals?.expenses || 0
  const savings = analyticsData?.totals?.savings || 0
  const savingsRate = analyticsData?.totals?.savingsRate || 0

  const kpiStats = [
    {
      label: "Total Balance",
      value: totalBalance,
      prefix: "₹",
      suffix: "",
      change: "+0.0%",
      changeType: "positive" as const,
      icon: Wallet,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Total Income",
      value: monthlyIncome,
      prefix: "₹",
      suffix: "",
      change: "+0.0%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Total Expense",
      value: monthlyExpense,
      prefix: "₹",
      suffix: "",
      change: "-0.0%",
      changeType: "negative" as const,
      icon: TrendingDown,
      color: "from-orange-500 to-amber-500",
    },
    {
      label: "Total Savings",
      value: savings,
      prefix: "₹",
      suffix: "",
      change: `${savingsRate}% rate`,
      changeType: "positive" as const,
      icon: PiggyBank,
      color: "from-green-500 to-emerald-500",
    },
  ]

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280", "#ec4899", "#06b6d4"]
  
  const expenseBreakdown = analyticsData?.categoryBreakdown?.map((c: any, i: number) => ({
    name: c.category,
    value: c.total,
    color: COLORS[i % COLORS.length]
  })) || []

  const expenseTotal = expenseBreakdown.reduce((sum: number, item: any) => sum + item.value, 0)

  const monthlyChartData = analyticsData?.monthly?.map((m: any) => ({
    month: formatMonth(m.month),
    income: m.income,
    expense: m.expenses
  })) || []

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="absolute top-0 right-1/4 w-[24rem] h-[24rem] bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000" />
        <div className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300" />

        <div className="relative z-10 px-4 md:px-6 lg:px-8 py-10 md:py-14 flex flex-col items-center text-center">
          <div className="section-header slide-in-from-bottom-4 max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <BarChart3 className="w-4 h-4" />
              Smart Analytics
            </div>
            <h1 className="text-h1 md:text-display-md font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Financial <span className="text-gradient">Analytics</span>
            </h1>
            <p className="text-body-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Deep dive into your spending patterns, track budgets, monitor savings goals, and discover AI-powered
              insights to optimize your financial health.
            </p>
            <div className="flex justify-center">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[200px] h-12 rounded-xl bg-card border-border shadow-lg hover:border-primary/50 transition-colors text-foreground font-medium">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="this-month">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* KPI Stats */}
        <section aria-label="Key Performance Indicators">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {kpiStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="stat-card group" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative z-10 p-5 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                        stat.color,
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                        stat.changeType === "positive" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                        stat.changeType === "negative" && "text-rose-600 bg-rose-500/10 border-rose-500/20",
                      )}>
                        {stat.changeType === "positive" ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <p className="text-body-sm text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-numeric-lg font-bold text-gradient">
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Main Charts Row */}
        <section aria-label="Main Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 md:p-6 border border-border card-hover relative overflow-hidden bg-card">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)`,
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-h4 font-bold text-foreground">Expense Breakdown</h2>
                  <p className="text-body-sm text-muted-foreground">Category-wise spending analysis</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl">
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative">
                  <ResponsiveContainer width={240} height={240}>
                    <PieChart>
                      <defs>
                        {expenseBreakdown.map((entry: any, index: number) => (
                          <linearGradient key={index} id={`analyticsExpGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {expenseBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={`url(#analyticsExpGrad${index})`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-body-xs text-muted-foreground">Total</p>
                      <p className="text-numeric-md font-bold text-foreground">₹{(expenseTotal / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center lg:flex-col lg:gap-2 flex-1">
                  {expenseBreakdown.map((item: any, index: number) => {
                    const percentage = ((item.value / expenseTotal) * 100).toFixed(0)
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-body-sm px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-border"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}50` }}
                        />
                        <span className="text-muted-foreground flex-1">{item.name}</span>
                        <span className="font-bold text-foreground">₹{(item.value / 1000).toFixed(0)}K</span>
                        <span className="text-body-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          {percentage}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 border border-border card-hover relative overflow-hidden bg-card">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(#6366f1 1px, transparent 1px),
                  linear-gradient(90deg, #6366f1 1px, transparent 1px)
                `,
                backgroundSize: "30px 30px",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-h5 font-bold text-foreground">Monthly Cash Flow</h2>
                  <p className="text-body-sm text-muted-foreground">Income vs Expense comparison</p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-2 text-body-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Income
                  </span>
                  <span className="inline-flex items-center gap-2 text-body-xs px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium border border-rose-500/30">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Expense
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData} barGap={6} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="incomeGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="expenseGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                    tickFormatter={(val) => `₹${val / 1000}K`}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#6366f1", opacity: 0.1 }} />
                  <Bar dataKey="income" name="Income" fill="url(#incomeGradAnalytics)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="url(#expenseGradAnalytics)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {/* ML Cluster Analytics Section */}
        <section className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-body-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            ML-Powered Clustering
          </div>
          <ClusterAnalytics />
        </section>

      </main>
      
      {/* AI Assistant Widget - Analytics context */}
      <AIWidget pageContext="/analytics" defaultOpen={false}
        contextTypes={["profile", "transactions", "analytics", "ml-clusters", "full-context"]}
        maxTokens={4000}
      />
    </div>
  )
}