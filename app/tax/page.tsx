"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calculator, TrendingDown, TrendingUp, Percent, IndianRupee } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

interface DeductionItem {
  name: string
  amount: number
  limit: number
}

function AnimatedValue({ value, prefix = "₹" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 40
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span>
      {prefix}
      {(displayValue / 100000).toFixed(2)}L
    </span>
  )
}

export default function TaxPage() {
  const [isNewRegime, setIsNewRegime] = useState(false)
  const [income, setIncome] = useState(1000000)
  const [deductions, setDeductions] = useState<DeductionItem[]>([
    { name: "Section 80C (PPF, ELSS, LIC)", amount: 150000, limit: 150000 },
    { name: "Section 80D (Health Insurance)", amount: 25000, limit: 50000 },
    { name: "Section 80E (Education Loan)", amount: 0, limit: 0 },
    { name: "Section 24 (Home Loan Interest)", amount: 200000, limit: 0 },
    { name: "Other Deductions", amount: 50000, limit: 0 },
  ])

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
  const taxableIncome = Math.max(0, income - totalDeductions)

  const calculateTax = (income: number, regime: boolean) => {
    if (regime) {
      if (income <= 250000) return 0
      if (income <= 500000) return (income - 250000) * 0.05
      if (income <= 750000) return 12500 + (income - 500000) * 0.1
      if (income <= 1000000) return 37500 + (income - 750000) * 0.15
      if (income <= 1250000) return 75000 + (income - 1000000) * 0.2
      if (income <= 1500000) return 125000 + (income - 1250000) * 0.25
      return 187500 + (income - 1500000) * 0.3
    } else {
      if (income <= 250000) return 0
      if (income <= 500000) return (income - 250000) * 0.05
      if (income <= 750000) return 12500 + (income - 500000) * 0.1
      if (income <= 1000000) return 37500 + (income - 750000) * 0.15
      if (income <= 1250000) return 75000 + (income - 1000000) * 0.2
      if (income <= 1500000) return 125000 + (income - 1250000) * 0.25
      return 187500 + (income - 1500000) * 0.3
    }
  }

  const oldRegimeTax = calculateTax(taxableIncome, false)
  const newRegimeTax = calculateTax(income, true)
  const taxToShow = isNewRegime ? newRegimeTax : oldRegimeTax
  const cess = taxToShow * 0.04
  const totalTax = taxToShow + cess

  const taxData = [
    { name: "Tax Payable", value: taxToShow },
    { name: "Cess (4%)", value: cess },
  ]

  const comparisonData = [
    { regime: "Old Regime", tax: oldRegimeTax, cess: oldRegimeTax * 0.04 },
    { regime: "New Regime", tax: newRegimeTax, cess: newRegimeTax * 0.04 },
  ]

  const handleUpdateDeduction = (index: number, amount: number) => {
    const newDeductions = [...deductions]
    newDeductions[index].amount = Math.min(amount, newDeductions[index].limit || Number.POSITIVE_INFINITY)
    setDeductions(newDeductions)
  }

  const betterRegime = oldRegimeTax + oldRegimeTax * 0.04 < newRegimeTax + newRegimeTax * 0.04 ? "Old" : "New"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">

        {/* Decorative Blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-up max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <Calculator className="w-4 h-4" />
              Tax Optimization
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Tax Estimation <span className="gradient-text">Engine</span>
            </h1>
            <p className="text-lg text-muted-foreground w-full">
              Calculate your tax liability, compare old vs new regime, and maximize your savings with smart deduction
              planning.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-8 py-8 space-y-8">
        {/* Top Row - Income & Regime Selection */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Income Input */}
          <Card className="p-6 card-hover slide-up border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Income Details</h2>
                <p className="text-sm text-muted-foreground">Adjust your annual income</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold">Annual Income</label>
                  <span className="text-3xl font-bold gradient-text">₹{(income / 100000).toFixed(2)}L</span>
                </div>
                <input
                  type="range"
                  min="250000"
                  max="5000000"
                  step="50000"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>₹2.5L</span>
                  <span>₹50L</span>
                </div>
              </div>

              {/* Regime Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl bg-secondary/50 border border-border">
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Tax Regime</p>
                  <p className="text-xs text-muted-foreground">
                    {isNewRegime ? "Simplified tax structure, no deductions" : "Maximize your deductions"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsNewRegime(false)} className={cn("tab-btn", !isNewRegime && "active")}>
                    Old Regime
                  </button>
                  <button onClick={() => setIsNewRegime(true)} className={cn("tab-btn", isNewRegime && "active")}>
                    New Regime
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tax Summary */}
          <Card className="p-6 card-hover slide-up border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Tax Summary</h2>
                <p className="text-sm text-muted-foreground">Your tax breakdown</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <p className="text-sm text-muted-foreground mb-2">Gross Income</p>
                <p className="text-2xl font-bold gradient-text">
                  <AnimatedValue value={income} />
                </p>
              </div>
              {!isNewRegime && (
                <div className="stat-card">
                  <p className="text-sm text-muted-foreground mb-2">Total Deductions</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    <AnimatedValue value={totalDeductions} />
                  </p>
                </div>
              )}
              <div className="stat-card">
                <p className="text-sm text-muted-foreground mb-2">Tax Payable</p>
                <p className="text-2xl font-bold text-destructive">
                  <AnimatedValue value={taxToShow} />
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground mb-2">Cess (4%)</p>
                <p className="text-2xl font-bold">
                  <AnimatedValue value={cess} />
                </p>
              </div>
              <div className="stat-card col-span-2 border-2 border-primary/30">
                <p className="text-sm text-muted-foreground mb-2">Total Tax + Cess</p>
                <p className="text-3xl font-bold gradient-text">
                  <AnimatedValue value={totalTax} />
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Deductions (Only for Old Regime) */}
        {!isNewRegime && (
          <Card className="p-6 card-hover slide-up border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Deductions Planning</h2>
                <p className="text-sm text-muted-foreground">Maximize your tax savings</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
              {deductions.map((deduction, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-sm">{deduction.name}</p>
                      {deduction.limit > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Limit: ₹{(deduction.limit / 100000).toFixed(2)}L
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-primary">₹{(deduction.amount / 100000).toFixed(2)}L</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={deduction.limit || 500000}
                    step="5000"
                    value={deduction.amount}
                    onChange={(e) => handleUpdateDeduction(i, Number(e.target.value))}
                    className="w-full"
                  />
                  {deduction.limit > 0 && (
                    <div className="mt-3 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 progress-animate"
                        style={{ width: `${(deduction.amount / deduction.limit) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Charts Row - Better distribution */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tax Breakdown Pie */}
          <Card className="p-6 card-hover slide-up flex flex-col border border-border">
            <h2 className="text-lg font-bold mb-4 text-center">Tax Breakdown</h2>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taxData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {taxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "var(--chart-1)" : "var(--chart-5)"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <span className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-chart-1" /> Tax
              </span>
              <span className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-chart-5" /> Cess
              </span>
            </div>
          </Card>

          {/* Regime Comparison */}
          <Card className="xl:col-span-2 p-6 card-hover slide-up border border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Regime Comparison</h2>
                  <p className="text-sm text-muted-foreground">Compare old vs new tax regime</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                {betterRegime} Regime saves more!
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="regime" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                  formatter={(value) => `₹${((value as number) / 100000).toFixed(2)}L`}
                />
                <Bar dataKey="tax" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cess" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Export Button */}
        <div className="flex justify-center slide-up">
          <Button className="rounded-full px-8 btn-interactive" size="lg">
            <Download className="w-5 h-5 mr-2" />
            Export Tax Summary
          </Button>
        </div>
      </div>
    </div>
  )
}
