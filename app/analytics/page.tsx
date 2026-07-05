"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
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
  Target,
  Lightbulb,
  Bell,
  ChevronRight,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ClusterAnalytics from "@/components/cluster-analytics"

const getMonthlyData = (filter: string) => {
  const baseData = [
    { month: "Jan", income: 75000, expense: 35000 },
    { month: "Feb", income: 82000, expense: 38000 },
    { month: "Mar", income: 85000, expense: 40000 },
    { month: "Apr", income: 88000, expense: 42000 },
    { month: "May", income: 85000, expense: 41000 },
    { month: "Jun", income: 90000, expense: 42500 },
  ]

  const weeklyData = [
    { month: "Mon", income: 12143, expense: 6071 },
    { month: "Tue", income: 13500, expense: 7200 },
    { month: "Wed", income: 14200, expense: 6800 },
    { month: "Thu", income: 12800, expense: 6500 },
    { month: "Fri", income: 15000, expense: 8000 },
    { month: "Sat", income: 8000, expense: 9500 },
    { month: "Sun", income: 5000, expense: 7000 },
  ]

  const monthData = [
    { month: "Week 1", income: 21250, expense: 10625 },
    { month: "Week 2", income: 22500, expense: 11250 },
    { month: "Week 3", income: 23000, expense: 12000 },
    { month: "Week 4", income: 24250, expense: 11625 },
  ]

  switch (filter) {
    case "this-week":
      return weeklyData
    case "this-month":
      return monthData
    default:
      return baseData
  }
}

const expenseBreakdown = [
  { name: "Food & Dining", value: 15000, color: "#10b981" },
  { name: "Transport", value: 8000, color: "#3b82f6" },
  { name: "Entertainment", value: 5000, color: "#8b5cf6" },
  { name: "Utilities", value: 6000, color: "#f59e0b" },
  { name: "Shopping", value: 5500, color: "#ef4444" },
  { name: "Others", value: 3000, color: "#6b7280" },
]

const getTrendData = (view: string) => {
  const daily = [
    { day: "6AM", food: 500, transport: 200, entertainment: 0, utilities: 0 },
    { day: "9AM", food: 800, transport: 500, entertainment: 100, utilities: 200 },
    { day: "12PM", food: 1200, transport: 300, entertainment: 400, utilities: 300 },
    { day: "3PM", food: 600, transport: 400, entertainment: 300, utilities: 200 },
    { day: "6PM", food: 1000, transport: 200, entertainment: 500, utilities: 400 },
    { day: "9PM", food: 400, transport: 100, entertainment: 200, utilities: 400 },
  ]

  const weekly = [
    { day: "Mon", food: 3500, transport: 2000, entertainment: 1200, utilities: 1500 },
    { day: "Tue", food: 4200, transport: 1800, entertainment: 1500, utilities: 1500 },
    { day: "Wed", food: 3800, transport: 2200, entertainment: 1000, utilities: 1500 },
    { day: "Thu", food: 3500, transport: 2000, entertainment: 1300, utilities: 1500 },
    { day: "Fri", food: 4000, transport: 1500, entertainment: 2000, utilities: 1500 },
    { day: "Sat", food: 5000, transport: 800, entertainment: 3000, utilities: 1500 },
    { day: "Sun", food: 4500, transport: 500, entertainment: 2500, utilities: 1500 },
  ]

  const monthly = [
    { day: "Week 1", food: 3500, transport: 2000, entertainment: 1200, utilities: 1500 },
    { day: "Week 2", food: 4200, transport: 1800, entertainment: 1500, utilities: 1500 },
    { day: "Week 3", food: 3800, transport: 2200, entertainment: 1000, utilities: 1500 },
    { day: "Week 4", food: 3500, transport: 2000, entertainment: 1300, utilities: 1500 },
  ]

  switch (view) {
    case "daily":
      return daily
    case "weekly":
      return weekly
    default:
      return monthly
  }
}

const categoryTrendData = [
  { month: "Jan", food: 12000, transport: 7500, entertainment: 4500, utilities: 5500 },
  { month: "Feb", food: 13500, transport: 7800, entertainment: 4800, utilities: 5800 },
  { month: "Mar", food: 14000, transport: 8000, entertainment: 5000, utilities: 6000 },
  { month: "Apr", food: 14500, transport: 8200, entertainment: 5200, utilities: 6200 },
  { month: "May", food: 14200, transport: 8000, entertainment: 4800, utilities: 6000 },
  { month: "Jun", food: 15000, transport: 8000, entertainment: 5000, utilities: 6000 },
]

const budgetData = [
  { category: "Food & Dining", budget: 18000, spent: 15000, color: "#10b981" },
  { category: "Transport", budget: 10000, spent: 8000, color: "#3b82f6" },
  { category: "Entertainment", budget: 6000, spent: 5000, color: "#8b5cf6" },
  { category: "Utilities", budget: 7000, spent: 6000, color: "#f59e0b" },
  { category: "Shopping", budget: 5000, spent: 5500, color: "#ef4444" },
]

const savingsGoals = [
  { name: "Emergency Fund", target: 500000, current: 425000, color: "#10b981" },
  { name: "Vacation Trip", target: 150000, current: 85000, color: "#3b82f6" },
  { name: "New Laptop", target: 100000, current: 65000, color: "#8b5cf6" },
]

const aiInsights = [
  {
    type: "warning",
    title: "Food expense up 18%",
    desc: "Your food spending increased compared to last week",
    icon: TrendingUp,
  },
  {
    type: "info",
    title: "Weekend overspending",
    desc: "You spend 40% more on weekends. Consider planning ahead.",
    icon: Lightbulb,
  },
  {
    type: "success",
    title: "Great savings rate!",
    desc: "You're saving 53% of your income. Keep it up!",
    icon: PiggyBank,
  },
  {
    type: "tip",
    title: "Suggested budget",
    desc: "Based on your pattern, optimal monthly budget: ₹38,000",
    icon: Target,
  },
]

const alerts = [
  { type: "warning", title: "Budget exceeded", desc: "Shopping category exceeded by ₹500" },
  { type: "info", title: "Bill reminder", desc: "Electricity bill due in 3 days" },
  { type: "success", title: "Goal milestone", desc: "Emergency fund reached 85% of target!" },
]

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

const TimeFilterToggle = ({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) => {
  return (
    <div className="flex items-center gap-1 bg-secondary/80 backdrop-blur-sm rounded-full p-1 border border-border/50">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 tracking-wide",
            value === opt.value
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
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

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState("this-month")
  const [trendView, setTrendView] = useState("monthly")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const totalBalance = 45280
  const monthlyIncome = 90000
  const monthlyExpense = 42500
  const savings = monthlyIncome - monthlyExpense
  const savingsRate = Math.round((savings / monthlyIncome) * 100)

  const kpiStats = [
    {
      label: "Total Balance",
      value: totalBalance,
      prefix: "₹",
      suffix: "",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Wallet,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Monthly Income",
      value: monthlyIncome,
      prefix: "₹",
      suffix: "",
      change: "+5.9%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Monthly Expense",
      value: monthlyExpense,
      prefix: "₹",
      suffix: "",
      change: "-3.5%",
      changeType: "negative" as const,
      icon: TrendingDown,
      color: "from-orange-500 to-amber-500",
    },
    {
      label: "Savings",
      value: savings,
      prefix: "₹",
      suffix: "",
      change: `${savingsRate}% rate`,
      changeType: "positive" as const,
      icon: PiggyBank,
      color: "from-green-500 to-emerald-500",
    },
  ]

  const expenseTotal = expenseBreakdown.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">
        {/* Decorative Blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center text-center">
          <div className="section-header slide-up max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <BarChart3 className="w-4 h-4" />
              Smart Analytics
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Financial <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
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
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          {kpiStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="stat-card group">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                        stat.color,
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                        stat.changeType === "positive" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                        stat.changeType === "negative" && "text-rose-600 bg-rose-500/10 border-rose-500/20",
                      )}
                    >
                      {stat.changeType === "positive" ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className="text-2xl md:text-3xl font-bold gradient-text">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </h3>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-6 border border-border card-hover relative overflow-hidden bg-card">
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
                  <h2 className="text-xl font-bold text-foreground">Expense Breakdown</h2>
                  <p className="text-sm text-muted-foreground">Category-wise spending analysis</p>
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
                        {expenseBreakdown.map((entry, index) => (
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
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#analyticsExpGrad${index})`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-foreground">₹{(expenseTotal / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center lg:flex-col lg:gap-2 flex-1">
                  {expenseBreakdown.map((item, index) => {
                    const percentage = ((item.value / expenseTotal) * 100).toFixed(0)
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-border"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}50` }}
                        />
                        <span className="text-muted-foreground flex-1">{item.name}</span>
                        <span className="font-bold text-foreground">₹{(item.value / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          {percentage}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-border card-hover relative overflow-hidden bg-card">
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
                  <h2 className="text-lg font-bold text-foreground">Monthly Cash Flow</h2>
                  <p className="text-sm text-muted-foreground">Income vs Expense comparison</p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Income
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium border border-rose-500/30">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Expense
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={getMonthlyData(dateFilter)} barGap={6} barCategoryGap="20%">
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
        </div>

        <Card className="p-6 border border-border relative overflow-hidden bg-card">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(#8b5cf6 1px, transparent 1px),
                linear-gradient(90deg, #8b5cf6 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Expense Trend Analysis</h2>
                <p className="text-sm text-muted-foreground">Track your spending behavior over time</p>
              </div>
              <TimeFilterToggle
                value={trendView}
                onChange={setTrendView}
                options={[
                  { value: "daily", label: "DAILY" },
                  { value: "weekly", label: "WEEKLY" },
                  { value: "monthly", label: "MONTHLY" },
                ]}
              />
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={getTrendData(trendView)}>
                <defs>
                  <linearGradient id="foodGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="transportGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="entertainmentGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="utilitiesGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }}
                  tickFormatter={(val) => `₹${val / 1000}K`}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) => <span className="text-foreground font-medium ml-1">{value}</span>}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="food"
                  stroke="#10b981"
                  fill="url(#foodGradientAnalytics)"
                  strokeWidth={3}
                  name="Food"
                  dot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{
                    r: 8,
                    fill: "#10b981",
                    stroke: "#fff",
                    strokeWidth: 3,
                    style: { filter: "drop-shadow(0 0 8px #10b981)" },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="transport"
                  stroke="#3b82f6"
                  fill="url(#transportGradientAnalytics)"
                  strokeWidth={3}
                  name="Transport"
                  dot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{
                    r: 8,
                    fill: "#3b82f6",
                    stroke: "#fff",
                    strokeWidth: 3,
                    style: { filter: "drop-shadow(0 0 8px #3b82f6)" },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entertainment"
                  stroke="#8b5cf6"
                  fill="url(#entertainmentGradientAnalytics)"
                  strokeWidth={3}
                  name="Entertainment"
                  dot={{ r: 5, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{
                    r: 8,
                    fill: "#8b5cf6",
                    stroke: "#fff",
                    strokeWidth: 3,
                    style: { filter: "drop-shadow(0 0 8px #8b5cf6)" },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="utilities"
                  stroke="#f59e0b"
                  fill="url(#utilitiesGradientAnalytics)"
                  strokeWidth={3}
                  name="Utilities"
                  dot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{
                    r: 8,
                    fill: "#f59e0b",
                    stroke: "#fff",
                    strokeWidth: 3,
                    style: { filter: "drop-shadow(0 0 8px #f59e0b)" },
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border border-border relative overflow-hidden bg-card">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative z-10">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground">Category-wise Trends</h2>
              <p className="text-sm text-muted-foreground">Detect spending patterns across all categories</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={categoryTrendData}>
                <defs>
                  <filter id="categoryGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }}
                  tickFormatter={(val) => `₹${val / 1000}K`}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) => <span className="text-foreground font-medium ml-1">{value}</span>}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="food"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 9, fill: "#10b981", stroke: "#fff", strokeWidth: 3, filter: "url(#categoryGlow)" }}
                  name="Food"
                />
                <Line
                  type="monotone"
                  dataKey="transport"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 9, fill: "#3b82f6", stroke: "#fff", strokeWidth: 3, filter: "url(#categoryGlow)" }}
                  name="Transport"
                />
                <Line
                  type="monotone"
                  dataKey="entertainment"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 9, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 3, filter: "url(#categoryGlow)" }}
                  name="Entertainment"
                />
                <Line
                  type="monotone"
                  dataKey="utilities"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 9, fill: "#f59e0b", stroke: "#fff", strokeWidth: 3, filter: "url(#categoryGlow)" }}
                  name="Utilities"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── ML Cluster Analytics Section ── */}
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            ML-Powered Clustering
          </div>
          <ClusterAnalytics />
        </div>

        {/* Budget vs Actual + Savings Goals */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Budget vs Actual</h2>
                <p className="text-sm text-muted-foreground">Track your spending against limits</p>
              </div>
            </div>
            <div className="space-y-5">
              {budgetData.map((item, index) => {
                const percentage = Math.round((item.spent / item.budget) * 100)
                const isOverBudget = item.spent > item.budget
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}50` }}
                        />
                        <span className="font-medium text-foreground">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold", isOverBudget ? "text-rose-500" : "text-emerald-500")}>
                          ₹{(item.spent / 1000).toFixed(0)}K
                        </span>
                        <span className="text-muted-foreground">/ ₹{(item.budget / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          isOverBudget
                            ? "bg-gradient-to-r from-rose-500 to-rose-400"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-400",
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage}% used</span>
                      <span className={cn(isOverBudget ? "text-rose-500" : "text-emerald-500")}>
                        {isOverBudget
                          ? `₹${((item.spent - item.budget) / 1000).toFixed(1)}K over`
                          : `₹${((item.budget - item.spent) / 1000).toFixed(1)}K left`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Savings Goals</h2>
                <p className="text-sm text-muted-foreground">Track progress toward your goals</p>
              </div>
            </div>
            <div className="space-y-6">
              {savingsGoals.map((goal, index) => {
                const percentage = Math.round((goal.current / goal.target) * 100)
                const remaining = goal.target - goal.current
                return (
                  <div key={index} className="flex items-center gap-5">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="10"
                          strokeOpacity="0.3"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={goal.color}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${percentage * 2.64} 264`}
                          className="transition-all duration-1000"
                          style={{ filter: `drop-shadow(0 0 8px ${goal.color}60)` }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground">{percentage}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-foreground">{goal.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ₹{(goal.current / 100000).toFixed(2)}L of ₹{(goal.target / 100000).toFixed(2)}L
                      </p>
                      <p className="text-xs mt-2 font-medium" style={{ color: goal.color }}>
                        ₹{(remaining / 1000).toFixed(0)}K remaining
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* AI Insights + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">AI Insights</h2>
                <p className="text-sm text-muted-foreground">Smart recommendations for you</p>
              </div>
            </div>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => {
                const Icon = insight.icon
                return (
                  <div
                    key={i}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
                      insight.type === "warning" && "bg-amber-500/10 border-amber-500/30",
                      insight.type === "info" && "bg-blue-500/10 border-blue-500/30",
                      insight.type === "success" && "bg-emerald-500/10 border-emerald-500/30",
                      insight.type === "tip" && "bg-purple-500/10 border-purple-500/30",
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          insight.type === "warning" && "bg-amber-500/20",
                          insight.type === "info" && "bg-blue-500/20",
                          insight.type === "success" && "bg-emerald-500/20",
                          insight.type === "tip" && "bg-purple-500/20",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            insight.type === "warning" && "text-amber-500",
                            insight.type === "info" && "text-blue-500",
                            insight.type === "success" && "text-emerald-500",
                            insight.type === "tip" && "text-purple-500",
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insight.desc}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Alerts & Reminders</h2>
                <p className="text-sm text-muted-foreground">Important notifications</p>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                    alert.type === "warning" && "bg-amber-500/10 border-amber-500/30",
                    alert.type === "info" && "bg-blue-500/10 border-blue-500/30",
                    alert.type === "success" && "bg-emerald-500/10 border-emerald-500/30",
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        alert.type === "warning" && "bg-amber-500/20",
                        alert.type === "info" && "bg-blue-500/20",
                        alert.type === "success" && "bg-emerald-500/20",
                      )}
                    >
                      <Bell
                        className={cn(
                          "w-5 h-5",
                          alert.type === "warning" && "text-amber-500",
                          alert.type === "info" && "text-blue-500",
                          alert.type === "success" && "text-emerald-500",
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
