"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Sparkles, IndianRupee, ShieldCheck, ArrowUpRight, Coins } from "lucide-react"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-3.5 shadow-2xl">
        <p className="font-bold text-foreground mb-2 text-xs border-b border-border/50 pb-1.5">Year {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center gap-3 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground flex-1">{entry.name}:</span>
            <span className="font-bold tabular-nums font-mono text-foreground">
              ₹{((entry.value as number) / 100000).toFixed(2)}L
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SIPCalculator() {
  const [mode, setMode] = useState<"sip" | "lumpsum">("sip")
  const [chartType, setChartType] = useState<"area" | "bar">("bar")
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000)
  const [lumpsumInvestment, setLumpsumInvestment] = useState(50000)
  const [annualReturn, setAnnualReturn] = useState(12)
  const [years, setYears] = useState(10)

  // Calculations
  const calculateResults = () => {
    if (mode === "sip") {
      const monthlyRate = annualReturn / 100 / 12
      const months = years * 12
      const futureValue =
        monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
      const investedAmount = monthlyInvestment * months
      const gains = futureValue - investedAmount
      return { futureValue, investedAmount, gains }
    } else {
      const r = annualReturn / 100
      const futureValue = lumpsumInvestment * Math.pow(1 + r, years)
      const investedAmount = lumpsumInvestment
      const gains = futureValue - investedAmount
      return { futureValue, investedAmount, gains }
    }
  }

  const { futureValue, investedAmount, gains } = calculateResults()

  const chartData = Array.from({ length: years }, (_, i) => {
    const year = i + 1
    if (mode === "sip") {
      const monthlyRate = annualReturn / 100 / 12
      const months = year * 12
      const value = monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
      return {
        year,
        invested: monthlyInvestment * months,
        value,
      }
    } else {
      const r = annualReturn / 100
      const value = lumpsumInvestment * Math.pow(1 + r, year)
      return {
        year,
        invested: lumpsumInvestment,
        value,
      }
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <Card className="p-6 lg:col-span-1 border border-border bg-card/60 backdrop-blur-xl rounded-2xl space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {mode === "sip" ? "SIP Wealth Calculator" : "Lump Sum Compounder"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "sip" ? "Systematic monthly investing with rupee-cost averaging" : "One-time investment compounding over time"}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-secondary border border-border/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("sip")}
            className={cn(
              "py-1.5 rounded-lg transition-all text-center cursor-pointer",
              mode === "sip" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly SIP
          </button>
          <button
            type="button"
            onClick={() => setMode("lumpsum")}
            className={cn(
              "py-1.5 rounded-lg transition-all text-center cursor-pointer",
              mode === "lumpsum" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Lump Sum / One-Time
          </button>
        </div>

        <div className="space-y-5">
          {/* Investment Amount */}
          {mode === "sip" ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-end gap-4">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Monthly SIP Amount</Label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">₹</span>
                  <Input
                    type="number"
                    value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(Math.max(100, Number(e.target.value) || 0))}
                    className="h-8 text-right font-bold text-xs bg-secondary/50 border-border focus-visible:ring-1 focus-visible:ring-primary pl-7 font-mono"
                  />
                </div>
              </div>
              <Slider
                value={[monthlyInvestment]}
                min={500}
                max={200000}
                step={500}
                onValueChange={(v) => setMonthlyInvestment(v[0])}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹2,00,000</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between items-end gap-4">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Initial Lump Sum</Label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">₹</span>
                  <Input
                    type="number"
                    value={lumpsumInvestment}
                    onChange={(e) => setLumpsumInvestment(Math.max(1000, Number(e.target.value) || 0))}
                    className="h-8 text-right font-bold text-xs bg-secondary/50 border-border focus-visible:ring-1 focus-visible:ring-primary pl-7 font-mono"
                  />
                </div>
              </div>
              <Slider
                value={[lumpsumInvestment]}
                min={5000}
                max={1000000}
                step={5000}
                onValueChange={(v) => setLumpsumInvestment(v[0])}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>₹5,000</span>
                <span>₹5,00,000</span>
                <span>₹10,00,000</span>
              </div>
            </div>
          )}

          {/* Expected Return */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Expected Return (CAGR)</Label>
              <div className="relative w-28">
                <Input
                  type="number"
                  value={annualReturn}
                  step={0.5}
                  onChange={(e) => setAnnualReturn(Math.max(1, Math.min(35, Number(e.target.value) || 0)))}
                  className="h-8 text-right font-bold text-xs bg-secondary/50 border-border focus-visible:ring-1 focus-visible:ring-primary pr-7 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
            <Slider
              value={[annualReturn]}
              min={1}
              max={30}
              step={0.5}
              onValueChange={(v) => setAnnualReturn(v[0])}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>FD (6.5%)</span>
              <span>Nifty (12%)</span>
              <span>Midcap (15%)</span>
            </div>
          </div>

          {/* Time Horizon */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Investment Duration</Label>
              <div className="relative w-28">
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                  className="h-8 text-right font-bold text-xs bg-secondary/50 border-border focus-visible:ring-1 focus-visible:ring-primary pr-9 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Yrs</span>
              </div>
            </div>
            <Slider
              value={[years]}
              min={1}
              max={30}
              step={1}
              onValueChange={(v) => setYears(v[0])}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>1 Yr</span>
              <span>15 Yrs</span>
              <span>30 Yrs</span>
            </div>
          </div>
        </div>

        {/* Quick Benchmark Chips */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-[11px] font-bold text-muted-foreground mb-2">Market Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "FD / Debt (7%)", rate: 7 },
              { label: "Hybrid (9%)", rate: 9 },
              { label: "Nifty 50 (12%)", rate: 12 },
              { label: "Aggressive Equity (15%)", rate: 15 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAnnualReturn(p.rate)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer",
                  annualReturn === p.rate
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Projection & Chart Column */}
      <Card className="p-6 lg:col-span-2 border border-border bg-card/60 backdrop-blur-xl rounded-2xl flex flex-col justify-between space-y-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Maturity Projection</p>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight mt-0.5">
                ₹{Math.round(futureValue).toLocaleString("en-IN")}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartType("bar")}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer",
                  chartType === "bar" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                )}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setChartType("area")}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer",
                  chartType === "area" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                )}
              >
                Growth Area
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Invested</p>
              <p className="text-lg font-bold text-foreground font-mono mt-1">
                ₹{Math.round(investedAmount).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Estimated Wealth Gain
              </p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                +₹{Math.round(gains).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-[10px] font-bold uppercase text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Wealth Multiplier
              </p>
              <p className="text-lg font-bold text-primary font-mono mt-1">
                {(futureValue / (investedAmount || 1)).toFixed(2)}x
              </p>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="invested" name="Invested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="value" name="Future Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#growthGrad)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 border border-border text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Formula: {mode === "sip" ? "FV = P × [((1+r)^n - 1) / r] × (1+r)" : "A = P × (1 + r)^t"}</span>
          <span className="font-semibold text-foreground">Compounded Periodically</span>
        </div>
      </Card>
    </div>
  )
}
