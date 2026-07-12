"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Calculator, Download, IndianRupee, Percent, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react"

import { AIWidget } from "@/components/ai-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DeductionItem {
  name: string
  amount: number
  limit: number
}

const currency = (value = 0) => `₹${Number(value).toLocaleString("en-IN")}`

export default function TaxPage() {
  const [loading, setLoading] = useState(true)
  const [isNewRegime, setIsNewRegime] = useState(false)
  const [income, setIncome] = useState(1000000)
  const [deductions, setDeductions] = useState<DeductionItem[]>([
    { name: "Section 80C", amount: 150000, limit: 150000 },
    { name: "Section 80D", amount: 25000, limit: 50000 },
    { name: "Home loan interest", amount: 200000, limit: 200000 },
    { name: "Standard deduction", amount: 50000, limit: 50000 },
  ])

  useEffect(() => {
    fetch("/api/tax")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        if (data.grossIncome > 0) setIncome(data.grossIncome)
        setIsNewRegime(data.taxRegime === "new")
      })
      .finally(() => setLoading(false))
  }, [])

  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0)
  const taxableOld = Math.max(0, income - totalDeductions)
  const taxableNew = Math.max(0, income - 75000)

  const calculateTax = (amount: number, nextRegime: boolean) => {
    if (nextRegime) {
      if (amount <= 300000) return 0
      if (amount <= 600000) return (amount - 300000) * 0.05
      if (amount <= 900000) return 15000 + (amount - 600000) * 0.1
      if (amount <= 1200000) return 45000 + (amount - 900000) * 0.15
      if (amount <= 1500000) return 90000 + (amount - 1200000) * 0.2
      return 150000 + (amount - 1500000) * 0.3
    }
    if (amount <= 250000) return 0
    if (amount <= 500000) return (amount - 250000) * 0.05
    if (amount <= 1000000) return 12500 + (amount - 500000) * 0.2
    return 112500 + (amount - 1000000) * 0.3
  }

  const oldTax = calculateTax(taxableOld, false)
  const newTax = calculateTax(taxableNew, true)
  const activeTax = isNewRegime ? newTax : oldTax
  const cess = activeTax * 0.04
  const totalTax = activeTax + cess
  const betterRegime = oldTax * 1.04 < newTax * 1.04 ? "Old" : "New"

  const summary = [
    { label: "Gross income", value: income, icon: IndianRupee },
    { label: "Deductions", value: isNewRegime ? 75000 : totalDeductions, icon: ShieldCheck },
    { label: "Tax payable", value: activeTax, icon: Percent },
    { label: "Tax plus cess", value: totalTax, icon: Calculator },
  ]
  const breakdown = [
    { name: "Tax", value: activeTax },
    { name: "Cess", value: cess },
  ]
  const comparison = [
    { regime: "Old", tax: oldTax, cess: oldTax * 0.04 },
    { regime: "New", tax: newTax, cess: newTax * 0.04 },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height-desktop))] items-center justify-center">
        <Calculator className="size-[var(--icon-3xl)] animate-pulse text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <main className="mx-auto w-full max-w-[var(--content-max-xl)] py-[var(--section-spacing-desktop)]">
        <header className="mb-[var(--card-padding-xl)]">
          <h1 className="app-heading-1">Tax Estimation</h1>
          <p className="app-body-lg app-muted mt-2">Compare regimes, tune deductions, and estimate your tax outflow.</p>
        </header>

        <section className="mb-[var(--card-padding-xl)] grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-[var(--card-padding-lg)]">
                <Icon className="mb-3 size-[var(--icon-xl)] text-primary" />
                <p className="numeric-lg">{currency(value)}</p>
                <p className="app-body-sm app-muted mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-[var(--card-padding-xl)] grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="app-body-md font-medium">Annual income</label>
                  <span className="app-heading-3">{currency(income)}</span>
                </div>
                <input className="w-full accent-primary" type="range" min="250000" max="5000000" step="50000" value={income} onChange={(event) => setIncome(Number(event.target.value))} />
              </div>
              <div className="flex gap-2 rounded-[var(--radius-md)] border border-border bg-muted p-2">
                <Button className="flex-1" variant={!isNewRegime ? "default" : "ghost"} onClick={() => setIsNewRegime(false)}>Old Regime</Button>
                <Button className="flex-1" variant={isNewRegime ? "default" : "ghost"} onClick={() => setIsNewRegime(true)}>New Regime</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deductions Planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deductions.map((deduction, index) => (
                <div key={deduction.name} className="rounded-[var(--radius-md)] border border-border p-4">
                  <div className="mb-3 flex justify-between gap-4">
                    <span className="app-body-md font-medium">{deduction.name}</span>
                    <span className="app-body-md font-semibold">{currency(deduction.amount)}</span>
                  </div>
                  <input
                    className="w-full accent-primary"
                    type="range"
                    min="0"
                    max={deduction.limit}
                    step="5000"
                    value={deduction.amount}
                    onChange={(event) => setDeductions((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(event.target.value) } : item))}
                    disabled={isNewRegime}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mb-[var(--card-padding-xl)] grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" innerRadius={70} outerRadius={105}>
                      <Cell fill="var(--chart-1)" />
                      <Cell fill="var(--chart-5)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Regime Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 app-body-sm font-medium text-primary">
                <TrendingUp className="size-[var(--icon-sm)]" />
                {betterRegime} regime estimates lower tax
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="regime" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
                    <Bar dataKey="tax" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="cess" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
          <div className="border-b border-border bg-muted p-[var(--card-padding-md)]">
            <h2 className="app-heading-3">Tax Table</h2>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {comparison.map((item) => (
                <tr key={item.regime} className="border-t border-border">
                  <td className="p-[var(--card-padding-md)] app-body-md font-medium">{item.regime} regime</td>
                  <td className="p-[var(--card-padding-md)] app-body-md">{currency(item.tax)}</td>
                  <td className="p-[var(--card-padding-md)] app-body-md">{currency(item.cess)} cess</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-[var(--card-padding-xl)] flex justify-end gap-4">
          <Button variant="outline">
            <TrendingDown className="size-[var(--icon-sm)]" />
            Review Deductions
          </Button>
          <Button>
            <Download className="size-[var(--icon-sm)]" />
            Export Tax Summary
          </Button>
        </div>
      </main>

      <AIWidget pageContext="/tax" defaultOpen={false} contextTypes={["profile", "transactions", "tax", "analytics", "documents"]} maxTokens={3500} />
    </div>
  )
}
