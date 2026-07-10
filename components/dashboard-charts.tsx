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
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

type TimeFilter = "month" // Simplified for live data MVP

interface DashboardChartsProps {
  type: "income-expense" | "expenses" | "networth" | "performance"
  data?: any
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"]

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

const formatMonth = (YYYYMM: string) => {
  if (!YYYYMM) return ""
  const [year, month] = YYYYMM.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export function PerformanceChart({ data }: { data: any }) {
  if (!data?.monthly) return null

  const chartData = data.monthly.map((m: any) => ({
    period: formatMonth(m.month),
    income: m.income,
    savings: m.savings,
    expenses: m.expenses,
  }))

  const totals = data.totals || { income: 0, savings: 0, expenses: 0 }
  const totalSum = totals.income + totals.savings + totals.expenses || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Report</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your financial growth over time</p>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 overflow-hidden shadow-2xl">
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
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              dx={-10}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "25px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotoneX"
              dataKey="income"
              name="Income"
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
              dataKey="expenses"
              name="Expenses"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#0f172a", strokeWidth: 3, filter: "url(#glowPerf)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden md:col-span-3">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <div className="text-3xl font-bold text-white mb-1">₹{totals.income.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <span>Total Income</span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">Past 6 Months</span>
            </div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3 bg-slate-700/50">
              <div
                className="h-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${(totals.income / totalSum) * 100}%` }}
              />
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${(totals.savings / totalSum) * 100}%` }}
              />
              <div
                className="h-full bg-purple-400 transition-all duration-500"
                style={{ width: `${(totals.expenses / totalSum) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Savings</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Expenses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function IncomeExpenseChart({ data }: { data: any }) {
  if (!data?.monthly) return null

  const chartData = data.monthly.map((m: any) => ({
    period: formatMonth(m.month),
    income: m.income,
    expense: m.expenses,
  }))

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
            data={chartData}
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

export function NetWorthChart({ data }: { data: any }) {
  if (!data?.monthly) return null

  let cumulativeSavings = 0
  const chartData = data.monthly.map((m: any) => {
    cumulativeSavings += m.savings
    return {
      period: formatMonth(m.month),
      worth: cumulativeSavings,
      growth: m.income > 0 ? ((m.savings / m.income) * 100).toFixed(1) : 0,
    }
  })

  if (chartData.length === 0) return null

  const firstValue = chartData[0].worth || 1
  const lastValue = chartData[chartData.length - 1].worth
  const percentChange = (((lastValue - firstValue) / Math.abs(firstValue)) * 100).toFixed(1)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Cumulative Savings: <span className="font-bold text-foreground text-xl">₹{(lastValue / 1000).toFixed(1)}K</span>
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
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
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
                        <span className="text-muted-foreground flex-1">Cum. Savings:</span>
                        <span className="font-bold text-cyan-500">₹{(worth / 1000).toFixed(1)}K</span>
                      </p>
                      <p className="text-sm flex items-center gap-3 py-1">
                        <span
                          className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg"
                          style={{ boxShadow: "0 0 8px #10b981" }}
                        />
                        <span className="text-muted-foreground flex-1">Savings Rate:</span>
                        <span className={cn("font-bold", growth >= 0 ? "text-emerald-500" : "text-rose-500")}>
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

export function ExpenseChart({ data }: { data: any }) {
  if (!data?.categoryBreakdown) return null

  const expenseData = data.categoryBreakdown.map((c: any, i: number) => ({
    name: c.category,
    value: c.total,
    color: COLORS[i % COLORS.length]
  }))

  const total = expenseData.reduce((sum: number, item: any) => sum + item.value, 0)

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-border/30 animate-spin-slow" />
        </div>
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <defs>
              {expenseData.map((entry: any, index: number) => (
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
              {expenseData.map((entry: any, index: number) => (
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
        {expenseData.map((item: any, index: number) => {
          const percentage = ((item.value / (total || 1)) * 100).toFixed(0)
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

export default function DashboardCharts({ type, data }: DashboardChartsProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  switch (type) {
    case "performance":
      return <PerformanceChart data={data} />
    case "income-expense":
      return <IncomeExpenseChart data={data} />
    case "expenses":
      return <ExpenseChart data={data} />
    case "networth":
      return <NetWorthChart data={data} />
    default:
      return null
  }
}
