"use client"

import { useState, useEffect } from "react"

// ─── Types ──────────────────────────────────────────────────

export interface ClusterChartData {
  name: string
  value: number
  amount: number
  avgAmount: number
  percentage: number
  color: string
}

export interface ClusterDistribution {
  clusters: ClusterMetaItem[]
  total_clusters: number
  chart_data: ClusterChartData[]
}

export interface ClusterMetaItem {
  cluster_type: string
  cluster_id: number
  label: string
  description: string
  color: string
  transaction_count: number
  total_amount: number
  avg_amount: number
  min_amount: number
  max_amount: number
  dominant_category: string
  dominant_payment_method: string
  percentage_of_total: number
}

export interface AnomalySummary {
  total_anomalies: number
  anomaly_rate: number
  total_anomaly_amount: number
  top_anomalies: Array<{
    id: string
    amount: number
    category: string
    merchant: string
    date: string
    anomalyScore: number
  }>
}

export interface MonthlyTrendEntry {
  month: string
  [key: string]: string | number
}

export interface ClusterSummary {
  distributions: Record<string, ClusterDistribution>
  anomaly_summary: AnomalySummary
  run_history: Array<{
    cluster_type: string
    algorithm: string
    n_clusters: number
    silhouette_score: number | null
    inertia: number | null
    total_transactions: number
  }>
}

// ─── Hook ───────────────────────────────────────────────────

export function useClusterData() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null)
  const [trends, setTrends] = useState<Record<string, MonthlyTrendEntry[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [summaryRes, trendsRes] = await Promise.all([
          fetch("/api/analytics/clusters?view=summary&type=all"),
          fetch("/api/analytics/clusters?view=trends&type=all"),
        ])

        if (!summaryRes.ok) {
          throw new Error("Failed to fetch cluster summary")
        }

        const summaryData = await summaryRes.json()
        const trendsData = trendsRes.ok ? await trendsRes.json() : null

        setSummary(summaryData)
        setTrends(trendsData)
      } catch (err: any) {
        console.error("Error fetching cluster data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    summary,
    trends,
    loading,
    error,
    distributions: summary?.distributions || {},
    anomalySummary: summary?.anomaly_summary || null,
    runHistory: summary?.run_history || [],
  }
}
