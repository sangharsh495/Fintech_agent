"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
        <p className="font-bold text-foreground mb-3 text-sm border-b border-border/50 pb-2">Year {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-3 py-1">
            <span className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground flex-1">{entry.name}:</span>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
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
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar')
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000)
  const [annualReturn, setAnnualReturn] = useState(12)
  const [years, setYears] = useState(10)

  const calculateSIP = () => {
    const monthlyRate = annualReturn / 100 / 12
    const months = years * 12
    const futureValue =
      monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
    const investedAmount = monthlyInvestment * months
    const gains = futureValue - investedAmount

    return { futureValue, investedAmount, gains }
  }

  const { futureValue, investedAmount, gains } = calculateSIP()

  const chartData = Array.from({ length: years }, (_, i) => {
    const year = i + 1
    const monthlyRate = annualReturn / 100 / 12
    const months = year * 12
    const value = monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
    return {
      year,
      invested: monthlyInvestment * months,
      value,
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 card-hover lg:col-span-1 border border-border">
        <h2 className="text-xl font-bold mb-2">SIP Calculator</h2>
        <p className="text-sm text-muted-foreground mb-6">Plan your systematic investment strategy</p>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-sm font-semibold text-foreground/90">Monthly Investment</Label>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value) || 500)}
                  className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pl-7"
                />
              </div>
            </div>
            <Slider
              value={[monthlyInvestment]}
              min={1000}
              max={500000}
              step={1000}
              onValueChange={(v) => setMonthlyInvestment(v[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
              <span>₹1K</span>
              <span>₹5L</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-sm font-semibold text-foreground/90">Expected Annual Return</Label>
              <div className="relative w-28">
                <Input
                  type="number"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(Number(e.target.value) || 5)}
                  className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">% p.a.</span>
              </div>
            </div>
            <Slider
              value={[annualReturn]}
              min={1}
              max={30}
              step={0.1}
              onValueChange={(v) => setAnnualReturn(v[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-sm font-semibold text-foreground/90">Investment Period</Label>
              <div className="relative w-28">
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value) || 1)}
                  className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Yrs</span>
              </div>
            </div>
            <Slider
              value={[years]}
              min={1}
              max={50}
              step={1}
              onValueChange={(v) => setYears(v[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
              <span>1 yr</span>
              <span>50 yrs</span>
            </div>
          </div>

          <Button className="w-full btn-interactive">Save Result</Button>
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Future Value", value: `₹${(futureValue / 100000).toFixed(2)}L` },
            { label: "Invested Amount", value: `₹${(investedAmount / 100000).toFixed(2)}L` },
            { label: "Estimated Gains", value: `₹${(gains / 100000).toFixed(2)}L` },
          ].map((item, i) => (
            <Card
              key={i}
              className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, var(--foreground) 1px, transparent 0)`,
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative z-10">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-2xl font-bold gradient-text">{item.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 card-hover border border-border relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(var(--border) 1px, transparent 1px),
                linear-gradient(90deg, var(--border) 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Investment Growth Projection</h3>
                <p className="text-sm text-muted-foreground mb-1">See how your wealth grows with compound interest</p>
              </div>
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'area' | 'bar')} className="w-auto">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="area" className="text-xs">Area</TabsTrigger>
                  <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ? (
                <BarChart data={chartData} barGap={4}>
                  <defs>
                    <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--secondary)", opacity: 0.3 }} />
                  <Legend />
                  <Bar dataKey="invested" name="Invested" fill="url(#investedGradient)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="value" name="Value" fill="url(#valueGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="valueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="investedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#valueAreaGradient)"
                    activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    name="Invested"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#investedAreaGradient)"
                    activeDot={false}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
