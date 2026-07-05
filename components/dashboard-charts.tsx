"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

const performanceDataYearly = [
  { period: "Jan", portfolio: 25, savings: 15, investments: 5 },
  { period: "Feb", portfolio: 30, savings: 22, investments: 12 },
  { period: "Mar", portfolio: 65, savings: 48, investments: 28 },
  { period: "Apr", portfolio: 78, savings: 62, investments: 45 },
  { period: "May", portfolio: 72, savings: 55, investments: 52 },
  { period: "Jun", portfolio: 55, savings: 48, investments: 58 },
  { period: "Jul", portfolio: 52, savings: 42, investments: 48 },
  { period: "Aug", portfolio: 48, savings: 45, investments: 52 },
  { period: "Sep", portfolio: 75, savings: 58, investments: 62 },
  { period: "Oct", portfolio: 82, savings: 72, investments: 75 },
  { period: "Nov", portfolio: 78, savings: 75, investments: 82 },
  { period: "Dec", portfolio: 88, savings: 85, investments: 78 },
]

const performanceDataMonthly = [
  { period: "Week 1", portfolio: 45, savings: 35, investments: 25 },
  { period: "Week 2", portfolio: 52, savings: 42, investments: 32 },
  { period: "Week 3", portfolio: 58, savings: 48, investments: 38 },
  { period: "Week 4", portfolio: 65, savings: 55, investments: 45 },
]

const performanceDataWeekly = [
  { period: "Mon", portfolio: 42, savings: 32, investments: 22 },
  { period: "Tue", portfolio: 48, savings: 38, investments: 28 },
  { period: "Wed", portfolio: 52, savings: 42, investments: 32 },
  { period: "Thu", portfolio: 55, savings: 45, investments: 35 },
  { period: "Fri", portfolio: 58, savings: 48, investments: 38 },
  { period: "Sat", portfolio: 62, savings: 52, investments: 42 },
  { period: "Sun", portfolio: 65, savings: 55, investments: 45 },
]

const performanceDataDaily = [
  { period: "6AM", portfolio: 40, savings: 30, investments: 20 },
  { period: "9AM", portfolio: 42, savings: 32, investments: 22 },
  { period: "12PM", portfolio: 45, savings: 35, investments: 25 },
  { period: "3PM", portfolio: 48, savings: 38, investments: 28 },
  { period: "6PM", portfolio: 50, savings: 40, investments: 30 },
  { period: "9PM", portfolio: 52, savings: 42, investments: 32 },
]

const incomeExpenseYearly = [
  { period: "Jan", income: 75000, expense: 35000 },
  { period: "Feb", income: 82000, expense: 38000 },
  { period: "Mar", income: 85000, expense: 40000 },
  { period: "Apr", income: 88000, expense: 42000 },
  { period: "May", income: 85000, expense: 41000 },
  { period: "Jun", income: 85000, expense: 42500 },
  { period: "Jul", income: 90000, expense: 44000 },
  { period: "Aug", income: 92000, expense: 45000 },
  { period: "Sep", income: 88000, expense: 43000 },
  { period: "Oct", income: 95000, expense: 46000 },
  { period: "Nov", income: 98000, expense: 48000 },
  { period: "Dec", income: 105000, expense: 52000 },
]

const incomeExpenseMonthly = [
  { period: "Week 1", income: 21250, expense: 10625 },
  { period: "Week 2", income: 22500, expense: 11250 },
  { period: "Week 3", income: 23000, expense: 12000 },
  { period: "Week 4", income: 24250, expense: 11625 },
]

const incomeExpenseWeekly = [
  { period: "Mon", income: 12143, expense: 6071 },
  { period: "Tue", income: 13500, expense: 7200 },
  { period: "Wed", income: 14200, expense: 6800 },
  { period: "Thu", income: 12800, expense: 6500 },
  { period: "Fri", income: 15000, expense: 8000 },
  { period: "Sat", income: 8000, expense: 9500 },
  { period: "Sun", income: 5000, expense: 7000 },
]

const incomeExpenseDaily = [
  { period: "6AM", income: 0, expense: 500 },
  { period: "9AM", income: 5000, expense: 1200 },
  { period: "12PM", income: 8000, expense: 2500 },
  { period: "3PM", income: 6000, expense: 1800 },
  { period: "6PM", income: 3000, expense: 3200 },
  { period: "9PM", income: 1000, expense: 1500 },
]

const netWorthYearly = [
  { period: "Jan", worth: 220000, growth: 2.5 },
  { period: "Feb", worth: 235000, growth: 6.8 },
  { period: "Mar", worth: 250000, growth: 6.4 },
  { period: "Apr", worth: 265000, growth: 6.0 },
  { period: "May", worth: 275000, growth: 3.8 },
  { period: "Jun", worth: 285000, growth: 3.6 },
  { period: "Jul", worth: 295000, growth: 3.5 },
  { period: "Aug", worth: 305000, growth: 3.4 },
  { period: "Sep", worth: 315000, growth: 3.3 },
  { period: "Oct", worth: 328000, growth: 4.1 },
  { period: "Nov", worth: 342000, growth: 4.3 },
  { period: "Dec", worth: 358000, growth: 4.7 },
]

const netWorthMonthly = [
  { period: "Week 1", worth: 280000, growth: 0.8 },
  { period: "Week 2", worth: 282500, growth: 0.9 },
  { period: "Week 3", worth: 284200, growth: 0.6 },
  { period: "Week 4", worth: 285000, growth: 0.3 },
]

const netWorthWeekly = [
  { period: "Mon", worth: 284200, growth: 0.1 },
  { period: "Tue", worth: 284350, growth: 0.05 },
  { period: "Wed", worth: 284500, growth: 0.05 },
  { period: "Thu", worth: 284650, growth: 0.05 },
  { period: "Fri", worth: 284800, growth: 0.05 },
  { period: "Sat", worth: 284900, growth: 0.03 },
  { period: "Sun", worth: 285000, growth: 0.03 },
]

const netWorthDaily = [
  { period: "6AM", worth: 284800, growth: 0.01 },
  { period: "9AM", worth: 284850, growth: 0.02 },
  { period: "12PM", worth: 284920, growth: 0.02 },
  { period: "3PM", worth: 284950, growth: 0.01 },
  { period: "6PM", worth: 284980, growth: 0.01 },
  { period: "9PM", worth: 285000, growth: 0.01 },
]

const expenseData = [
  { name: "Food", value: 15000, color: "#10b981" },
  { name: "Transport", value: 8000, color: "#3b82f6" },
  { name: "Entertainment", value: 5000, color: "#8b5cf6" },
  { name: "Utilities", value: 6000, color: "#f59e0b" },
  { name: "Others", value: 8500, color: "#ef4444" },
]

type TimeFilter = "day" | "week" | "month" | "year"

interface DashboardChartsProps {
  type: "income-expense" | "expenses" | "networth" | "performance"
}

const CustomTooltip = ({ active, payload, label, prefix = "₹", suffix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl shadow-black/20">
        <p className="font-bold text-foreground mb-3 text-sm border-b border-border/50 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-3 py-1">
            <span className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground flex-1">{entry.name}:</span>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {prefix}
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
              {suffix}
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
  options = ["day", "week", "month", "year"],
}: {
  value: TimeFilter
  onChange: (v: TimeFilter) => void
  options?: TimeFilter[]
}) => {
  const labels: Record<TimeFilter, string> = {
    day: "DAY",
    week: "WEEK",
    month: "MONTH",
    year: "YEAR",
  }

  return (
    <div className="flex items-center gap-1 bg-secondary/80 backdrop-blur-sm rounded-full p-1 border border-border/50">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 tracking-wide",
            value === opt
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  )
}

export function PerformanceChart() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("year")

  const getData = () => {
    switch (timeFilter) {
      case "day":
        return performanceDataDaily
      case "week":
        return performanceDataWeekly
      case "month":
        return performanceDataMonthly
      case "year":
        return performanceDataYearly
      default:
        return performanceDataYearly
    }
  }

  const totalComponents = 56321
  const components = [
    { label: "Portfolio", value: 3236, color: "#22d3ee" },
    { label: "Savings", value: 8583, color: "#a855f7" },
    { label: "Investments", value: 1142, color: "#4ade80" },
  ]

  const quarterData = [
    { name: "Q1", value: 18, color: "#22d3ee" },
    { name: "Q2", value: 9, color: "#a855f7" },
    { name: "Q3", value: 26, color: "#4ade80" },
    { name: "Q4", value: 47, color: "#c084fc" },
  ]

  const last3Months = [
    { label: "Oct", value: 25000, color: "#22d3ee" },
    { label: "Nov", value: 56000, color: "#a855f7" },
    { label: "Dec", value: 15000, color: "#4ade80" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Report</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your financial growth over time</p>
        </div>
        <TimeFilterToggle value={timeFilter} onChange={setTimeFilter} />
      </div>

      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 overflow-hidden shadow-2xl">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={getData()} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <filter id="glowPerf">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="period"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              dx={-10}
            />
            <Tooltip
              content={<CustomTooltip prefix="" suffix="%" />}
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "25px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotoneX"
              dataKey="portfolio"
              name="Portfolio"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 3, filter: "url(#glowPerf)" }}
            />
            <Line
              type="monotoneX"
              dataKey="savings"
              name="Savings"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#10b981", stroke: "#0f172a", strokeWidth: 3, filter: "url(#glowPerf)" }}
            />
            <Line
              type="monotoneX"
              dataKey="investments"
              name="Investments"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#0f172a", strokeWidth: 3, filter: "url(#glowPerf)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <div className="text-3xl font-bold text-white mb-1">₹{totalComponents.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <span>Total Components</span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">YTD</span>
            </div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3 bg-slate-700/50">
              {components.map((c, i) => (
                <div
                  key={i}
                  className="h-full transition-all duration-500"
                  style={{
                    backgroundColor: c.color,
                    width: `${(c.value / totalComponents) * 100}%`,
                    boxShadow: `0 0 10px ${c.color}40`,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              {components.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>₹{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-3">This Year</div>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quarterData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {quarterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-3">
            {quarterData.map((q, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: q.color }} />
                <span className="text-slate-400">{q.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-4">Last 3 Months</div>
          <div className="space-y-4">
            {last3Months.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{m.label}</span>
                  <span className="font-bold text-white">₹{(m.value / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      backgroundColor: m.color,
                      width: `${(m.value / 60000) * 100}%`,
                      boxShadow: `0 0 10px ${m.color}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function IncomeExpenseChart() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("year")

  const getData = () => {
    switch (timeFilter) {
      case "day":
        return incomeExpenseDaily
      case "week":
        return incomeExpenseWeekly
      case "month":
        return incomeExpenseMonthly
      case "year":
        return incomeExpenseYearly
      default:
        return incomeExpenseYearly
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Income
          </span>
          <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Expense
          </span>
        </div>
        <TimeFilterToggle value={timeFilter} onChange={setTimeFilter} />
      </div>
      <div className="relative">
        <div
          className="absolute inset-0 opacity-[0.015] rounded-xl"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px",
          }}
        />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={getData()}
            barGap={6}
            barCategoryGap="20%"
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--secondary)", opacity: 0.4 }} />
            <Bar dataKey="income" name="Income" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="url(#expenseGradient)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function NetWorthChart() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("year")

  const getData = () => {
    switch (timeFilter) {
      case "day":
        return netWorthDaily
      case "week":
        return netWorthWeekly
      case "month":
        return netWorthMonthly
      case "year":
        return netWorthYearly
      default:
        return netWorthYearly
    }
  }

  const data = getData()
  const firstValue = data[0].worth
  const lastValue = data[data.length - 1].worth
  const percentChange = (((lastValue - firstValue) / firstValue) * 100).toFixed(1)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Current: <span className="font-bold text-foreground text-xl">₹{(lastValue / 100000).toFixed(2)}L</span>
          </div>
          <div
            className={cn(
              "text-xs px-3 py-1.5 rounded-full font-bold border",
              Number(percentChange) >= 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
            )}
          >
            {Number(percentChange) >= 0 ? "+" : ""}
            {percentChange}%
          </div>
        </div>
        <TimeFilterToggle value={timeFilter} onChange={setTimeFilter} />
      </div>
      <div className="relative">
        <div
          className="absolute inset-0 opacity-[0.02] rounded-xl"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--foreground) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="worthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <filter id="glowEffectNet">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              domain={["dataMin - 10000", "dataMax + 10000"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const worth = payload[0].value as number
                  const growth = payload[0].payload.growth
                  return (
                    <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
                      <p className="font-bold text-foreground mb-3 text-sm border-b border-border/50 pb-2">{label}</p>
                      <p className="text-sm flex items-center gap-3 py-1">
                        <span
                          className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg"
                          style={{ boxShadow: "0 0 8px #22d3ee" }}
                        />
                        <span className="text-muted-foreground flex-1">Net Worth:</span>
                        <span className="font-bold text-cyan-500">₹{(worth / 100000).toFixed(2)}L</span>
                      </p>
                      <p className="text-sm flex items-center gap-3 py-1">
                        <span
                          className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg"
                          style={{ boxShadow: "0 0 8px #10b981" }}
                        />
                        <span className="text-muted-foreground flex-1">Growth:</span>
                        <span className={cn("font-bold", growth >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {growth >= 0 ? "+" : ""}
                          {growth}%
                        </span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="worth"
              name="Net Worth"
              stroke="#22d3ee"
              strokeWidth={4}
              fill="url(#worthAreaGradient)"
              dot={{ r: 6, fill: "#22d3ee", stroke: "#fff", strokeWidth: 3 }}
              activeDot={{ r: 10, fill: "#22d3ee", stroke: "#fff", strokeWidth: 4, filter: "url(#glowEffectNet)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ExpenseChart() {
  const total = expenseData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-border/30 animate-spin-slow" />
        </div>
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <defs>
              {expenseData.map((entry, index) => (
                <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#pieGradient${index})`} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `₹${(value as number).toLocaleString()}`}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold gradient-text">₹{(total / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center lg:flex-col lg:gap-2">
        {expenseData.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(0)
          return (
            <div
              key={index}
              className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-bold ml-auto">₹{(item.value / 1000).toFixed(0)}K</span>
              <span className="text-xs text-muted-foreground">({percentage}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardCharts({ type }: DashboardChartsProps) {
  switch (type) {
    case "performance":
      return <PerformanceChart />
    case "income-expense":
      return <IncomeExpenseChart />
    case "expenses":
      return <ExpenseChart />
    case "networth":
      return <NetWorthChart />
    default:
      return null
  }
}
