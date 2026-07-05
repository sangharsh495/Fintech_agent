"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"
import {
  Brain,
  ShieldAlert,
  Clock,
  ShoppingBag,
  Layers,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useClusterData,
  type ClusterDistribution,
  type ClusterChartData,
  type MonthlyTrendEntry,
  type AnomalySummary,
} from "@/hooks/use-cluster-data"

// ─── Custom Tooltip ─────────────────────────────────────────

const ClusterTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xl min-w-[200px]">
        <p className="font-bold text-foreground mb-3 text-sm border-b border-border pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-3 py-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
            />
            <span className="text-muted-foreground flex-1">{entry.name}:</span>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {typeof entry.value === "number" && entry.value > 1000
                ? `₹${(entry.value / 1000).toFixed(1)}K`
                : entry.value}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Distribution Pie Chart ─────────────────────────────────

function DistributionPieChart({
  data,
  title,
  subtitle,
  icon: Icon,
}: {
  data: ClusterChartData[]
  title: string
  subtitle: string
  icon: any
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="p-6 border border-border bg-card relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <defs>
                  {data.map((entry, index) => (
                    <linearGradient key={index} id={`clusterGrad-${title}-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1200}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={`url(#clusterGrad-${title}-${index})`} />
                  ))}
                </Pie>
                <Tooltip content={<ClusterTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">{total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 w-full">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-border"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}50` }}
                />
                <span className="text-muted-foreground flex-1 text-xs">{item.name}</span>
                <span className="font-bold text-foreground text-xs">{item.value}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Cluster Trend Line Chart ───────────────────────────────

function ClusterTrendChart({
  data,
  title,
  subtitle,
  colors,
  icon: Icon,
  valueFormatter,
}: {
  data: MonthlyTrendEntry[]
  title: string
  subtitle: string
  colors: Record<string, string>
  icon: any
  valueFormatter?: (val: number) => string
}) {
  if (!data || data.length === 0) return null

  const keys = Object.keys(data[0]).filter((k) => k !== "month")
  const formatVal = valueFormatter || ((val: number) => `₹${(val / 1000).toFixed(0)}K`)

  return (
    <Card className="p-6 border border-border bg-card relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              {keys.map((key) => (
                <linearGradient key={key} id={`grad-${title}-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[key] || "#6366f1"} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors[key] || "#6366f1"} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
              tickFormatter={(val) => {
                const parts = val.split("-")
                return parts.length === 2 ? `${parts[1]}/${parts[0].slice(2)}` : val
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
              tickFormatter={(val) => formatVal(val)}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
            />
            <Tooltip content={<ClusterTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              formatter={(value) => <span className="text-foreground font-medium ml-1 text-xs">{value}</span>}
              iconType="circle"
            />
            {keys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key] || "#6366f1"}
                fill={`url(#grad-${title}-${key})`}
                strokeWidth={2.5}
                name={key}
                dot={{ r: 4, fill: colors[key] || "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{
                  r: 7,
                  fill: colors[key] || "#6366f1",
                  stroke: "#fff",
                  strokeWidth: 3,
                  style: { filter: `drop-shadow(0 0 6px ${colors[key] || "#6366f1"})` },
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Anomaly Alert Panel ────────────────────────────────────

function AnomalyPanel({ anomalySummary }: { anomalySummary: AnomalySummary }) {
  if (!anomalySummary || anomalySummary.total_anomalies === 0) return null

  return (
    <Card className="p-6 border border-rose-500/30 bg-rose-500/5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">Anomaly Detection</h3>
            <p className="text-xs text-muted-foreground">DBSCAN-powered unusual transaction detection</p>
          </div>
          <Badge variant="destructive" className="text-xs px-3 py-1">
            {anomalySummary.total_anomalies} Flagged
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-card/80 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Total Anomalies</p>
            <p className="text-2xl font-bold text-rose-500">{anomalySummary.total_anomalies}</p>
          </div>
          <div className="bg-card/80 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Anomaly Rate</p>
            <p className="text-2xl font-bold text-amber-500">{anomalySummary.anomaly_rate}%</p>
          </div>
          <div className="bg-card/80 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{(anomalySummary.total_anomaly_amount / 1000).toFixed(1)}K
            </p>
          </div>
        </div>

        {anomalySummary.top_anomalies && anomalySummary.top_anomalies.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Top Flagged Transactions</p>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {anomalySummary.top_anomalies.slice(0, 6).map((txn, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/80 border border-border hover:border-rose-500/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{txn.merchant}</p>
                    <p className="text-xs text-muted-foreground">{txn.category} &bull; {new Date(txn.date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-rose-500">₹{Number(txn.amount).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">
                      Score: {(Number(txn.anomalyScore) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Model Performance Card ─────────────────────────────────

function ModelPerformanceCard({ runHistory }: { runHistory: any[] }) {
  if (!runHistory || runHistory.length === 0) return null

  return (
    <Card className="p-6 border border-border bg-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Model Performance</h3>
          <p className="text-xs text-muted-foreground">Clustering quality metrics</p>
        </div>
      </div>

      <div className="space-y-3">
        {runHistory.map((run, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-transparent hover:border-border transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground capitalize">
                {run.cluster_type.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {run.algorithm.toUpperCase()} &bull; {run.n_clusters} clusters &bull; {run.total_transactions} txns
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {run.silhouette_score !== null ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-mono",
                    run.silhouette_score > 0.4 ? "border-emerald-500 text-emerald-500" :
                    run.silhouette_score > 0.2 ? "border-amber-500 text-amber-500" :
                    "border-rose-500 text-rose-500"
                  )}
                >
                  Sil: {run.silhouette_score.toFixed(3)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-muted-foreground text-muted-foreground">
                  {run.anomalies_detected || 0} anomalies
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Cluster Size Comparison Bar Chart ──────────────────────

function ClusterComparisonChart({ distributions }: { distributions: Record<string, ClusterDistribution> }) {
  // Build comparison data across all cluster types
  const comparisonData: any[] = []
  const allColors: Record<string, string> = {}

  for (const [type, dist] of Object.entries(distributions)) {
    for (const chart of dist.chart_data) {
      comparisonData.push({
        name: chart.name,
        type: type.replace(/_/g, " "),
        transactions: chart.value,
        amount: chart.amount,
        avgAmount: chart.avgAmount,
        color: chart.color,
      })
      allColors[chart.name] = chart.color
    }
  }

  // Group by cluster type for a stacked bar
  const types = [...new Set(comparisonData.map((d) => d.type))]

  return (
    <Card className="p-6 border border-border bg-card relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Cluster Size Overview</h3>
            <p className="text-xs text-muted-foreground">Transaction count per cluster across all models</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
              angle={-25}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb", strokeOpacity: 0.5 }}
            />
            <Tooltip content={<ClusterTooltip />} cursor={{ fill: "#6366f1", opacity: 0.1 }} />
            <Bar dataKey="transactions" name="Transactions" radius={[6, 6, 0, 0]}>
              {comparisonData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Main Cluster Analytics Component ───────────────────────

export default function ClusterAnalytics() {
  const { summary, trends, loading, error, distributions, anomalySummary, runHistory } = useClusterData()
  const [activeTab, setActiveTab] = useState("overview")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ML Cluster Analytics</h2>
            <p className="text-sm text-muted-foreground">Loading cluster data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-[400px] border border-border bg-card animate-pulse">
              <div className="h-full bg-secondary/30 rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 border border-amber-500/30 bg-amber-500/5 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">Cluster Data Not Available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Run the ML clustering pipeline to generate analytics data.
        </p>
        <div className="bg-card rounded-lg p-4 text-left max-w-md mx-auto border border-border">
          <p className="text-xs font-mono text-muted-foreground mb-1">$ cd ml-service</p>
          <p className="text-xs font-mono text-muted-foreground mb-1">$ source venv/bin/activate</p>
          <p className="text-xs font-mono text-muted-foreground">$ python -m app.main</p>
        </div>
      </Card>
    )
  }

  // Color maps for trend charts
  const spendingColors: Record<string, string> = {
    "Essential Spender": "#22c55e",
    "Lifestyle Enthusiast": "#8b5cf6",
    "Conservative Saver": "#3b82f6",
    "Impulse Buyer": "#f59e0b",
  }

  const sizeColors: Record<string, string> = {
    "Micro (< ₹500)": "#06b6d4",
    "Small (₹500 - ₹2K)": "#22c55e",
    "Medium (₹2K - ₹10K)": "#f59e0b",
    "Large (₹10K+)": "#ef4444",
  }

  const temporalColors: Record<string, string> = {
    "Early Bird": "#f59e0b",
    "Afternoon Active": "#22c55e",
    "Evening Spender": "#8b5cf6",
    "Night Owl": "#3b82f6",
  }

  const categoryColors: Record<string, string> = {
    "Living Essentials": "#22c55e",
    "Food & Transport": "#f59e0b",
    "Shopping & Lifestyle": "#8b5cf6",
    "Financial Obligations": "#ef4444",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">ML Cluster Analytics</h2>
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            K-Means & DBSCAN clustering on {summary?.total_cluster_types || 0} dimensions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="behavior" className="text-xs">Behavior</TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
          <TabsTrigger value="anomalies" className="text-xs">Anomalies</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Distribution Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {distributions.spending_behavior && (
              <DistributionPieChart
                data={distributions.spending_behavior.chart_data}
                title="Spending Behavior"
                subtitle="How you spend your money"
                icon={Layers}
              />
            )}
            {distributions.transaction_size && (
              <DistributionPieChart
                data={distributions.transaction_size.chart_data}
                title="Transaction Sizes"
                subtitle="Amount-based segmentation"
                icon={BarChart3}
              />
            )}
            {distributions.temporal && (
              <DistributionPieChart
                data={distributions.temporal.chart_data}
                title="Time Patterns"
                subtitle="When you make transactions"
                icon={Clock}
              />
            )}
            {distributions.category_affinity && (
              <DistributionPieChart
                data={distributions.category_affinity.chart_data}
                title="Category Affinity"
                subtitle="What you spend on"
                icon={ShoppingBag}
              />
            )}
          </div>

          {/* Cluster Comparison */}
          <ClusterComparisonChart distributions={distributions} />

          {/* Model Performance */}
          <ModelPerformanceCard runHistory={runHistory} />
        </TabsContent>

        {/* ── Behavior Tab ── */}
        <TabsContent value="behavior" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {distributions.spending_behavior && (
              <DistributionPieChart
                data={distributions.spending_behavior.chart_data}
                title="Spending Behavior Clusters"
                subtitle="K-Means segmentation by spending patterns"
                icon={Layers}
              />
            )}
            {distributions.category_affinity && (
              <DistributionPieChart
                data={distributions.category_affinity.chart_data}
                title="Category Affinity Clusters"
                subtitle="Grouped by dominant spending categories"
                icon={ShoppingBag}
              />
            )}
          </div>

          {/* Spending Behavior Trend */}
          {trends?.spending_behavior && (
            <ClusterTrendChart
              data={trends.spending_behavior}
              title="Spending Behavior Monthly Trend"
              subtitle="How spending behavior clusters evolve over time"
              colors={spendingColors}
              icon={TrendingUp}
            />
          )}

          {/* Category Affinity Trend */}
          {trends?.category_affinity && (
            <ClusterTrendChart
              data={trends.category_affinity}
              title="Category Affinity Monthly Trend"
              subtitle="Spending by category cluster over time"
              colors={categoryColors}
              icon={TrendingUp}
            />
          )}

          {/* Cluster Details */}
          {distributions.spending_behavior && (
            <Card className="p-6 border border-border bg-card">
              <h3 className="text-base font-bold text-foreground mb-4">Cluster Descriptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {distributions.spending_behavior.clusters.map((cluster, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cluster.color }}
                      />
                      <p className="text-sm font-bold text-foreground">{cluster.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{cluster.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Avg Amount:</span>
                        <span className="font-bold text-foreground ml-1">₹{cluster.avg_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transactions:</span>
                        <span className="font-bold text-foreground ml-1">{cluster.transaction_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Top Category:</span>
                        <span className="font-bold text-foreground ml-1 capitalize">
                          {cluster.dominant_category?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">% of Total:</span>
                        <span className="font-bold text-foreground ml-1">{cluster.percentage_of_total}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── Patterns Tab ── */}
        <TabsContent value="patterns" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {distributions.transaction_size && (
              <DistributionPieChart
                data={distributions.transaction_size.chart_data}
                title="Transaction Size Clusters"
                subtitle="Segmented by transaction amount"
                icon={BarChart3}
              />
            )}
            {distributions.temporal && (
              <DistributionPieChart
                data={distributions.temporal.chart_data}
                title="Temporal Clusters"
                subtitle="When transactions occur"
                icon={Clock}
              />
            )}
          </div>

          {/* Size Trend */}
          {trends?.transaction_size && (
            <ClusterTrendChart
              data={trends.transaction_size}
              title="Transaction Size Monthly Trend"
              subtitle="How transaction sizes distribute over months"
              colors={sizeColors}
              icon={TrendingUp}
              valueFormatter={(val) => `${val}`}
            />
          )}

          {/* Temporal Trend */}
          {trends?.temporal && (
            <ClusterTrendChart
              data={trends.temporal}
              title="Temporal Pattern Monthly Trend"
              subtitle="Transaction timing patterns over time"
              colors={temporalColors}
              icon={Clock}
              valueFormatter={(val) => `${val}`}
            />
          )}
        </TabsContent>

        {/* ── Anomalies Tab ── */}
        <TabsContent value="anomalies" className="space-y-6 mt-6">
          {anomalySummary && <AnomalyPanel anomalySummary={anomalySummary} />}
          <ModelPerformanceCard runHistory={runHistory} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
