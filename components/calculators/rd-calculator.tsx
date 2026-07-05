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
                <p className="font-bold text-foreground mb-2 text-sm border-b border-border/50 pb-2">Year {label}</p>
                <div className="space-y-1">
                    <p className="text-sm flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Total Invested
                        </span>
                        <span className="font-bold text-foreground">₹{((payload[0].value as number) / 1000).toFixed(1)}K</span>
                    </p>
                    <p className="text-sm flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" /> Interest Earned
                        </span>
                        <span className="font-bold text-foreground">₹{((payload[1].value as number) / 1000).toFixed(1)}K</span>
                    </p>
                </div>
            </div>
        )
    }
    return null
}

export default function RDCalculator() {
    const [chartType, setChartType] = useState<'area' | 'bar'>('area')
    const [monthlyDeposit, setMonthlyDeposit] = useState(5000)
    const [rate, setRate] = useState(6.5)
    const [tenure, setTenure] = useState(5) // in years

    // RD calculation formula: A = P * (n(n+1)/2) * (r/12) + (P * n) where n is months
    const calculateRD = () => {
        const P = monthlyDeposit
        const r = rate / 100 / 12
        const n = tenure * 12

        // Correct bank RD formula (compounded quarterly usually, but simplified monthly compounding for UI speed)
        // Maturity value = P * ((1+r)^n - 1) / (1-(1+r)^(-1/3)) // Standard formula is complex, using simplified compounding

        let maturityAmount = 0
        for (let i = 0; i < n; i++) {
            maturityAmount += P * Math.pow(1 + (rate / 100) / 4, 4 * ((n - i) / 12))
        }
        return maturityAmount
    }

    const matureAmount = calculateRD()
    const totalInvestment = monthlyDeposit * tenure * 12
    const wealthGained = matureAmount - totalInvestment

    const graphData = Array.from({ length: tenure + 1 }, (_, i) => {
        const months = i * 12
        const investedSoFar = monthlyDeposit * months
        let maturitySoFar = 0
        for (let j = 0; j < months; j++) {
            maturitySoFar += monthlyDeposit * Math.pow(1 + (rate / 100) / 4, 4 * ((months - j) / 12))
        }

        return {
            year: i,
            invested: investedSoFar,
            interest: maturitySoFar - investedSoFar,
        }
    })

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <Card className="p-6 card-hover lg:col-span-1 border border-border">
                <h2 className="text-xl font-bold mb-2">Recurring Deposit Calculator</h2>
                <p className="text-sm text-muted-foreground mb-6">Calculate maturity value of your RD</p>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end gap-4">
                            <Label className="text-sm font-semibold text-foreground/90">Monthly Investment</Label>
                            <div className="relative w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                <Input
                                    type="number"
                                    value={monthlyDeposit}
                                    onChange={(e) => setMonthlyDeposit(Number(e.target.value) || 500)}
                                    className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pl-7"
                                />
                            </div>
                        </div>
                        <Slider
                            value={[monthlyDeposit]}
                            min={500}
                            max={100000}
                            step={500}
                            onValueChange={(v) => setMonthlyDeposit(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
                            <span>₹500</span>
                            <span>₹100K</span>
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
                            max={12}
                            step={0.1}
                            onValueChange={(v) => setRate(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
                            <span>3%</span>
                            <span>12%</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end gap-4">
                            <Label className="text-sm font-semibold text-foreground/90">Time Period</Label>
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
                            max={15}
                            step={1}
                            onValueChange={(v) => setTenure(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
                            <span>1 yr</span>
                            <span>15 yrs</span>
                        </div>
                    </div>

                    <Button className="w-full btn-interactive">Calculate Maturity</Button>
                </div>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Total Invested", value: `₹${(totalInvestment / 100000).toFixed(2)}L`, color: "from-violet-500 to-purple-500" },
                        { label: "Est. Returns", value: `₹${(wealthGained / 100000).toFixed(2)}L`, color: "from-emerald-500 to-teal-500" },
                        { label: "Maturity Value", value: `₹${(matureAmount / 100000).toFixed(2)}L`, color: "from-fuchsia-500 to-pink-500" },
                    ].map((item, i) => (
                        <Card
                            key={i}
                            className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 relative overflow-hidden group hover:border-primary/50 transition-all duration-300"
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
                                <h3 className="text-lg font-bold mb-1">Steady Growth Trajectory</h3>
                                <p className="text-sm text-muted-foreground mb-1">See how your monthly deposits compound</p>
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
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        </linearGradient>
                                        <linearGradient id="gainedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#d946ef" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#d946ef" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="invested"
                                        stackId="1"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fill="url(#investedGradient)"
                                        activeDot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="interest"
                                        stackId="1"
                                        stroke="#d946ef"
                                        strokeWidth={2}
                                        fill="url(#gainedGradient)"
                                        activeDot={{ r: 6, fill: "#d946ef", stroke: "#fff", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            ) : (
                                <BarChart data={graphData} barGap={4}>
                                    <defs>
                                        <linearGradient id="investedBarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="gainedBarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#d946ef" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#d946ef" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.3 }} />
                                    <Bar
                                        dataKey="invested"
                                        stackId="a"
                                        name="Total Invested"
                                        fill="url(#investedBarGradient)"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="interest"
                                        stackId="a"
                                        name="Interest Earned"
                                        fill="url(#gainedBarGradient)"
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
