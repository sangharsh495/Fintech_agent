"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Construction } from "lucide-react"

const dummyData = [
    { year: 1, value: 100 },
    { year: 2, value: 120 },
    { year: 3, value: 150 },
    { year: 4, value: 160 },
    { year: 5, value: 200 },
    { year: 6, value: 240 },
    { year: 7, value: 290 },
    { year: 8, value: 340 },
    { year: 9, value: 410 },
    { year: 10, value: 500 },
]

export default function GenericCalculator({ title = "Calculator" }: { title?: string }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <Card className="p-6 card-hover lg:col-span-1 border border-border flex flex-col items-center justify-center text-center opacity-70">
                <Construction className="w-12 h-12 text-primary mb-4 opacity-50" />
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    The complex math engine for this specific tool is currently under development. Interactive inputs will be enabled soon!
                </p>
                <div className="space-y-4 w-full opacity-50 pointer-events-none">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/20 w-1/3" />
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/20 w-2/3" />
                    </div>
                    <Button className="w-full" disabled>Coming Soon</Button>
                </div>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-70">
                    {[
                        { label: "Estimated Return", value: "₹ --", color: "from-cyan-500 to-blue-500" },
                        { label: "Projected Growth", value: "-- %", color: "from-emerald-500 to-teal-500" },
                        { label: "Total Value", value: "₹ --", color: "from-purple-500 to-pink-500" },
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
                    <div className="relative z-10 flex flex-col items-center justify-center opacity-60">
                        <h3 className="text-lg font-bold mb-2">Interactive Data Model Placeholder</h3>
                        <p className="text-sm text-muted-foreground mb-4">A preview of the interactive graph capabilities</p>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={dummyData}>
                                <defs>
                                    <linearGradient id="dummyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                                <YAxis tickLine={false} tick={false} axisLine={false} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="var(--primary)"
                                    strokeWidth={3}
                                    fill="url(#dummyGradient)"
                                    dot={false}
                                    activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    )
}
