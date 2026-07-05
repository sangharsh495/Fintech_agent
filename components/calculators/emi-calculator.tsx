"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
        <p className="font-bold text-foreground mb-2 text-sm border-b border-border/50 pb-2">Month {label}</p>
        <p className="text-sm flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg" />
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-bold text-cyan-400">₹{((payload[0].value as number) / 100000).toFixed(2)}L</span>
        </p>
      </div>
    )
  }
  return null
}

export default function EMICalculator() {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const [principal, setPrincipal] = useState(500000)
  const [rate, setRate] = useState(8.5)
  const [tenure, setTenure] = useState(5)

  const calculateEMI = () => {
    const P = principal
    const R = rate / 100 / 12
    const N = tenure * 12
    return (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1)
  }

  const emi = calculateEMI()
  const totalPayable = emi * tenure * 12
  const totalInterest = totalPayable - principal

  const amortizationSchedule = Array.from({ length: tenure * 12 }, (_, i) => {
    const R = rate / 100 / 12
    let balance = principal
    for (let j = 0; j <= i; j++) {
      const interest = balance * R
      const principalPayment = emi - interest
      balance -= principalPayment
    }
    return {
      month: i + 1,
      balance: Math.max(0, balance),
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 card-hover lg:col-span-1 border border-border">
        <h2 className="text-xl font-bold mb-2">EMI Calculator</h2>
        <p className="text-sm text-muted-foreground mb-6">Calculate your monthly loan payments</p>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-sm font-semibold text-foreground/90">Loan Amount</Label>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value) || 100000)}
                  className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pl-7"
                />
              </div>
            </div>
            <Slider
              value={[principal]}
              min={100000}
              max={10000000}
              step={50000}
              onValueChange={(v) => setPrincipal(v[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
              <span>₹1L</span>
              <span>₹1Cr</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-sm font-semibold text-foreground/90">Interest Rate</Label>
              <div className="relative w-28">
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 3)}
                  className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">% p.a.</span>
              </div>
            </div>
            <Slider
              value={[rate]}
              min={3}
              max={15}
              step={0.1}
              onValueChange={(v) => setRate(v[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
              <span>3%</span>
              <span>15%</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <Label className="text-sm font-semibold text-foreground/90">Tenure</Label>
              <div className="relative w-28">
                <Input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value) || 1)}
                  className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Yrs</span>
              </div>
            </div>
            <Slider
              value={[tenure]}
              min={1}
              max={30}
              step={1}
              onValueChange={(v) => setTenure(v[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
              <span>1 yr</span>
              <span>30 yrs</span>
            </div>
          </div>

          <Button className="w-full btn-interactive">Save Result</Button>
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Monthly EMI", value: `₹${(emi / 1000).toFixed(1)}K`, color: "from-cyan-500 to-blue-500" },
            {
              label: "Total Interest",
              value: `₹${(totalInterest / 100000).toFixed(2)}L`,
              color: "from-rose-500 to-orange-500",
            },
            {
              label: "Total Payable",
              value: `₹${(totalPayable / 100000).toFixed(2)}L`,
              color: "from-emerald-500 to-teal-500",
            },
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
                <h3 className="text-lg font-bold mb-1">Amortization Schedule</h3>
                <p className="text-sm text-muted-foreground mb-1">See how your loan balance decreases over time</p>
              </div>
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'area' | 'bar')} className="w-auto">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="area" className="text-xs">Area</TabsTrigger>
                  <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              {chartType === 'area' ? (
                <AreaChart data={amortizationSchedule.slice(0, tenure * 12)}>
                  <defs>
                    <linearGradient id="emiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    fill="url(#emiGradient)"
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, fill: "#22d3ee", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={amortizationSchedule.slice(0, tenure * 12)} barGap={4}>
                  <defs>
                    <linearGradient id="emiBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.3 }} />
                  <Bar
                    dataKey="balance"
                    name="Balance"
                    fill="url(#emiBarGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
