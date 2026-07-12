"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BarChart3, Calendar, Filter, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { AIWidget } from "@/components/ai-sidebar"
import ClusterAnalytics from "@/components/cluster-analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const currency = (value = 0) => `₹${Number(value).toLocaleString("en-IN")}`
const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("all")
  const [query, setQuery] = useState("")
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((res) => res.json()),
      fetch("/api/analytics").then((res) => res.json()),
    ])
      .then(([dashboard, analytics]) => {
        setDashboardData(dashboard)
        setAnalyticsData(analytics)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const monthly = useMemo(
    () =>
      (analyticsData?.monthly || []).map((item: any) => ({
        month: item.month,
        income: item.income,
        expenses: item.expenses,
      })),
    [analyticsData],
  )

  const categories = useMemo(
    () =>
      (analyticsData?.categoryBreakdown || []).map((item: any, index: number) => ({
        name: item.category,
        value: item.total,
        fill: chartColors[index % chartColors.length],
      })),
    [analyticsData],
  )

  const rows = useMemo(() => {
    const source = dashboardData?.recentTransactions || []
    return source.filter((row: any) => {
      const text = `${row.merchant || ""} ${row.description || ""} ${row.category || ""}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })
  }, [dashboardData, query])

  const kpis = [
    { label: "Total Balance", value: dashboardData?.totalBalance || dashboardData?.stats?.totalBalance || 0, icon: Wallet },
    { label: "Income", value: analyticsData?.totals?.income || 0, icon: TrendingUp },
    { label: "Expenses", value: analyticsData?.totals?.expenses || 0, icon: TrendingDown },
    { label: "Savings", value: analyticsData?.totals?.savings || 0, icon: PiggyBank },
  ]

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <header className="mb-[var(--card-padding-lg)]">
        <h1 className="app-heading-1">Analytics</h1>
        <p className="app-body-lg app-muted mt-1">Filter, compare, and inspect your financial movement.</p>
      </header>

      <section className="mb-[var(--card-padding-xl)] flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-[var(--card-padding-md)] md:flex-row md:items-center">
        <div className="relative min-w-[15rem] flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Filter transactions" />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="md:w-80">
            <Calendar className="size-[var(--icon-sm)] text-primary" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">This quarter</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="mb-[var(--card-padding-xl)] grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-[var(--card-padding-lg)]">
              <Icon className="mb-3 size-[var(--icon-xl)] text-primary" />
              {isLoading ? <Skeleton className="h-9 w-32" /> : <p className="numeric-lg">{currency(value)}</p>}
              <p className="app-body-sm app-muted mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mb-[var(--card-padding-xl)] grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" tickFormatter={(value) => `₹${Number(value) / 1000}K`} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
                  <Bar dataKey="income" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" innerRadius={70} outerRadius={105} paddingAngle={3}>
                    {categories.map((entry: any) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-[var(--card-padding-xl)] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
        <div className="border-b border-border bg-muted p-[var(--card-padding-md)]">
          <h2 className="app-heading-3">Transaction Detail</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                {["Date", "Description", "Category", "Amount"].map((heading) => (
                  <th key={heading} className="p-[var(--card-padding-md)] text-left app-body-sm font-medium text-muted-foreground">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows.length ? rows : [{ date: new Date().toISOString(), description: "No matching transactions", category: "--", amount: 0 }]).slice(0, 8).map((row: any, index: number) => (
                <tr key={row.id || index} className="border-t border-border hover:bg-muted">
                  <td className="p-[var(--card-padding-md)] app-body-md">{new Date(row.date).toLocaleDateString("en-IN")}</td>
                  <td className="p-[var(--card-padding-md)] app-body-md">{row.merchant || row.description}</td>
                  <td className="p-[var(--card-padding-md)] app-body-md text-muted-foreground">{row.category || "--"}</td>
                  <td className="p-[var(--card-padding-md)] app-body-md font-semibold">{row.amount ? currency(row.amount) : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 p-[var(--card-padding-md)]">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </section>

      <section className="mb-[var(--card-padding-xl)]">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-[var(--icon-md)] text-primary" />
          <h2 className="app-heading-3">Cluster Insights</h2>
        </div>
        <ClusterAnalytics />
      </section>

      <AIWidget pageContext="/analytics" defaultOpen={false} contextTypes={["profile", "transactions", "analytics", "ml-clusters", "full-context"]} maxTokens={4000} />
    </div>
  )
}
