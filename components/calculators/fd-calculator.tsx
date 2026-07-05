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
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Principal
                        </span>
                        <span className="font-bold text-foreground">₹{((payload[0].value as number) / 1000).toFixed(1)}K</span>
                    </p>
                    <p className="text-sm flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Interest
                        </span>
                        <span className="font-bold text-foreground">₹{((payload[1].value as number) / 1000).toFixed(1)}K</span>
                    </p>
                </div>
            </div>
        )
    }
    return null
}

export default function FDCalculator() {
    const [chartType, setChartType] = useState<'area' | 'bar'>('area')
    const [principal, setPrincipal] = useState(100000)
    const [rate, setRate] = useState(7.0)
    const [tenure, setTenure] = useState(5)

    // FD calculations based on quarterly compounding (standard for most banks)
    const calculateFD = () => {
        const P = principal
        const r = rate / 100
        const n = 4 // compounded quarterly
        const t = tenure
        return P * Math.pow(1 + r / n, n * t)
    }

    const matureAmount = calculateFD()
    const wealthGained = matureAmount - principal

    const graphData = Array.from({ length: tenure + 1 }, (_, i) => {
        const yearPrincipal = principal
        const currentMaturity = principal * Math.pow(1 + (rate / 100) / 4, 4 * i)
        return {
            year: i,
            principal: yearPrincipal,
            interest: currentMaturity - yearPrincipal,
        }
    })

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <Card className="p-6 card-hover lg:col-span-1 border border-border">
                <h2 className="text-xl font-bold mb-2">Fixed Deposit Calculator</h2>
                <p className="text-sm text-muted-foreground mb-6">Calculate maturity value of your FD</p>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end gap-4">
                            <Label className="text-sm font-semibold text-foreground/90">Total Investment</Label>
                            <div className="relative w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                <Input
                                    type="number"
                                    value={principal}
                                    onChange={(e) => setPrincipal(Number(e.target.value) || 10000)}
                                    className="h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary pl-7"
                                />
                            </div>
                        </div>
                        <Slider
                            value={[principal]}
                            min={10000}
                            max={5000000}
                            step={10000}
                            onValueChange={(v) => setPrincipal(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
                            <span>₹10K</span>
                            <span>₹50L</span>
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
                            max={20}
                            step={1}
                            onValueChange={(v) => setTenure(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
                            <span>1 yr</span>
                            <span>20 yrs</span>
                        </div>
                    </div>

                    <Button className="w-full btn-interactive">Calculate Breakdown</Button>
                </div>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Total Investment", value: `₹${(principal / 100000).toFixed(2)}L`, color: "from-blue-500 to-indigo-500" },
                        { label: "Wealth Gained", value: `₹${(wealthGained / 100000).toFixed(2)}L`, color: "from-emerald-500 to-teal-500" },
                        { label: "Maturity Value", value: `₹${(matureAmount / 100000).toFixed(2)}L`, color: "from-cyan-500 to-blue-500" },
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
                                <h3 className="text-lg font-bold mb-1">Growth Projection</h3>
                                <p className="text-sm text-muted-foreground mb-1">See how interest compounds over your tenure</p>
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
                                        <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        </linearGradient>
                                        <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="principal"
                                        stackId="1"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#principalGradient)"
                                        activeDot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="interest"
                                        stackId="1"
                                        stroke="#22d3ee"
                                        strokeWidth={2}
                                        fill="url(#interestGradient)"
                                        activeDot={{ r: 6, fill: "#22d3ee", stroke: "#fff", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            ) : (
                                <BarChart data={graphData} barGap={4}>
                                    <defs>
                                        <linearGradient id="principalBarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="interestBarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.3 }} />
                                    <Bar
                                        dataKey="principal"
                                        stackId="a"
                                        name="Principal"
                                        fill="url(#principalBarGradient)"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="interest"
                                        stackId="a"
                                        name="Interest"
                                        fill="url(#interestBarGradient)"
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
