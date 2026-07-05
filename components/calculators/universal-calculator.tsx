"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { CalculatorConfig } from "@/lib/calculator-configs"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Custom Tooltip for the Recharts graph
const CustomChartTooltip = ({ active, payload, label, config }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl min-w-[200px]">
                <p className="font-bold text-foreground mb-2 text-sm border-b border-border/50 pb-2">
                    {config.xAxisKey === 'year' ? 'Year ' : ''}{label}
                </p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="font-bold text-foreground">
                                {config.tooltipPrefix || ''}
                                {config.tooltipFormatter ? config.tooltipFormatter(entry.value) : entry.value}
                            </span>
                        </p>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

export default function UniversalCalculator({ config }: { config: CalculatorConfig }) {
    const [chartType, setChartType] = useState<'area' | 'bar'>('area')
    // Initialize state with default values from config
    const [values, setValues] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        config.inputs.forEach(input => {
            initial[input.id] = input.defaultValue
        })
        return initial
    })

    // Whenever config changes (user switches tools), reset the state
    useEffect(() => {
        const initial: Record<string, number> = {}
        config.inputs.forEach(input => {
            initial[input.id] = input.defaultValue
        })
        setValues(initial)
    }, [config])

    const handleSliderChange = (id: string, val: number[]) => {
        setValues(prev => ({ ...prev, [id]: val[0] }))
    }

    const handleInputChange = (id: string, e: React.ChangeEvent<HTMLInputElement>, min: number, max: number) => {
        let val = parseFloat(e.target.value)
        if (isNaN(val)) val = min // fallback
        // We don't strictly clamp while typing to allow users to clear and type,
        // but we can clamp on blur if needed. For now, just update state.
        setValues(prev => ({ ...prev, [id]: val }))
    }

    // Calculate results based on current values
    const { outputs, chartData, chartConfig } = config.calculate(values)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">

            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: Input Control Panel                       */}
            {/* ---------------------------------------------------- */}
            <Card className="p-6 card-hover lg:col-span-1 border border-border">
                <h2 className="text-xl font-bold mb-2">{config.title}</h2>
                <p className="text-sm text-muted-foreground mb-6">{config.description}</p>

                <div className="space-y-8">
                    {config.inputs.map((input) => {
                        const val = values[input.id] ?? input.defaultValue
                        return (
                            <div key={input.id} className="space-y-3">
                                <div className="flex justify-between items-end gap-4">
                                    <Label className="text-sm font-semibold text-foreground/90">{input.label}</Label>

                                    {/* Hybrid Typed Input */}
                                    <div className="relative w-28">
                                        {input.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{input.prefix}</span>}
                                        <Input
                                            type="number"
                                            value={val}
                                            onChange={(e) => handleInputChange(input.id, e, input.min, input.max)}
                                            className={cn(
                                                "h-8 text-right font-medium no-spinners bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary",
                                                input.prefix && "pl-7",
                                                input.suffix && "pr-12"
                                            )}
                                        />
                                        {input.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{input.suffix}</span>}
                                    </div>
                                </div>

                                {/* Slider Control */}
                                <Slider
                                    value={[val]}
                                    min={input.min}
                                    max={input.max}
                                    step={input.step}
                                    onValueChange={(v) => handleSliderChange(input.id, v)}
                                    className="py-2"
                                />

                                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
                                    <span>
                                        {input.prefix || ''}
                                        {input.transformDisplay ? input.transformDisplay(input.min).replace(input.prefix || '', '') : input.min}
                                        {input.suffix || ''}
                                    </span>
                                    <span>
                                        {input.prefix || ''}
                                        {input.transformDisplay ? input.transformDisplay(input.max).replace(input.prefix || '', '') : input.max}
                                        {input.suffix || ''}
                                    </span>
                                </div>
                            </div>
                        )
                    })}

                    <Button className="w-full btn-interactive mt-4">Save Calculation</Button>
                </div>
            </Card>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: Outputs & Charts                         */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-2 space-y-6">

                {/* Output KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {outputs.map((item, i) => (
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
                                <p className="text-xs text-muted-foreground mb-1 font-medium">{item.label}</p>
                                <p className="text-2xl font-bold gradient-text">{item.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Dynamic Area Chart */}
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
                                <p className="text-sm text-muted-foreground mb-1">Interactive data visualization over time</p>
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
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        {chartConfig.areas.map((area, idx) => (
                                            <linearGradient key={`grad-${idx}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={area.color} stopOpacity={0.8} />
                                                <stop offset="100%" stopColor={area.color} stopOpacity={0.1} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                                    <XAxis
                                        dataKey={chartConfig.xAxisKey}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={chartConfig.yAxisFormatter}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <RechartsTooltip content={<CustomChartTooltip config={chartConfig} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />

                                    {chartConfig.areas.map((area, idx) => (
                                        <Area
                                            key={idx}
                                            type="monotone"
                                            dataKey={area.dataKey}
                                            name={area.name}
                                            stroke={area.color}
                                            strokeWidth={2}
                                            fill={`url(#color-${idx})`}
                                            activeDot={{ r: 5, fill: area.color, stroke: "var(--background)", strokeWidth: 2 }}
                                        />
                                    ))}
                                </AreaChart>
                            ) : (
                                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        {chartConfig.areas.map((area, idx) => (
                                            <linearGradient key={`grad-bar-${idx}`} id={`color-bar-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={area.color} stopOpacity={1} />
                                                <stop offset="100%" stopColor={area.color} stopOpacity={0.6} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                                    <XAxis
                                        dataKey={chartConfig.xAxisKey}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={chartConfig.yAxisFormatter}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <RechartsTooltip content={<CustomChartTooltip config={chartConfig} />} cursor={{ fill: 'var(--secondary)', opacity: 0.3 }} />
                                    {chartConfig.areas.map((area, idx) => (
                                        <Bar
                                            key={idx}
                                            dataKey={area.dataKey}
                                            name={area.name}
                                            fill={`url(#color-bar-${idx})`}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    ))}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

        </div>
    )
}
