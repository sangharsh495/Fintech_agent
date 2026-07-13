/**
 * Cluster Analytics API
 *
 * GET /api/analytics/clusters
 *   Query params:
 *     type: "spending_behavior" | "transaction_size" | "temporal" | "category_affinity" | "all"
 *     view: "distributions" | "trends" | "metadata" | "anomalies" | "summary"
 *
 * Returns cluster data pre-computed by the ML service
 */

import { NextRequest, NextResponse } from "next/server"
import { safeLogError, safeLogInfo } from "@/server/lib/safe-log"
import * as fs from "fs"
import * as path from "path"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { clusterMetadata, clusterRuns, transactions } from "@/server/db/schema"
import { eq, and, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

// ─── Data Loading (from ML service output) ──────────────────

const ML_DATA_DIR = path.join(process.cwd(), "ml-service", "data")

function loadJSON(filename: string): any {
  const filepath = path.join(ML_DATA_DIR, filename)
  if (!fs.existsSync(filepath)) {
    return null
  }
  const raw = fs.readFileSync(filepath, "utf-8")
  return JSON.parse(raw)
}

// Cache loaded data in memory
let cachedMetadata: any = null
let cachedTrends: any = null
let cachedTransactions: any = null

function getMetadata() {
  if (!cachedMetadata) {
    cachedMetadata = loadJSON("cluster_metadata.json")
  }
  return cachedMetadata
}

function getTrends() {
  if (!cachedTrends) {
    cachedTrends = loadJSON("cluster_trends.json")
  }
  return cachedTrends
}

function getTransactions() {
  if (!cachedTransactions) {
    cachedTransactions = loadJSON("transactions_clustered.json")
  }
  return cachedTransactions
}

// ─── API Handler ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    const view = searchParams.get("view") || "summary"

    const session = await getSession(request)
    const userId = session?.user?.id

    // Check if database contains real computed ML clustering for this user
    if (userId) {
      const userMeta = await db
        .select()
        .from(clusterMetadata)
        .where(eq(clusterMetadata.userId, userId))

      if (userMeta.length > 0) {
        safeLogInfo(`[Clusters API] Serving dynamic DB-backed ML insights for user ${userId}`)

        const userRunsList = await db
          .select()
          .from(clusterRuns)
          .where(eq(clusterRuns.userId, userId))
          .orderBy(desc(clusterRuns.runAt))

        const userAnomalies = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.userId, userId), eq(transactions.isAnomaly, true)))
          .orderBy(desc(transactions.date))
          .limit(50)

        // 1. Build cluster distributions
        const distributions: Record<string, any> = {}
        const clusterTypes = ["spending_behavior", "transaction_size", "temporal", "category_affinity"]

        for (const cType of clusterTypes) {
          const typeMeta = userMeta.filter((m) => m.clusterType === cType)
          const clusters = typeMeta.map((m) => ({
            cluster_id: m.clusterId,
            label: m.label,
            description: m.description,
            color: m.color,
            centroid: m.centroid ? JSON.parse(m.centroid) : [],
            transaction_count: m.transactionCount || 0,
            total_amount: m.totalAmount || 0,
            avg_amount: m.avgAmount || 0,
            min_amount: m.minAmount,
            max_amount: m.maxAmount,
            dominant_category: m.dominantCategory,
            dominant_payment_method: m.dominantPaymentMethod,
            percentage_of_total: m.percentageOfTotal,
          }))

          distributions[cType] = {
            chart_data: clusters.map((c) => ({
              name: c.label,
              value: c.transaction_count,
            })),
            clusters,
          }
        }

        // 2. Build anomaly summary
        const totalTxns = userMeta.reduce((sum, m) => sum + (m.transactionCount || 0), 0)
        const anomalySummary = {
          total_anomalies: userAnomalies.length,
          percentage_anomalies: totalTxns > 0 ? parseFloat(((userAnomalies.length / totalTxns) * 100).toFixed(2)) : 0,
          top_anomalies: userAnomalies.map((a) => ({
            transaction_id: a.id,
            amount: parseFloat(a.amount),
            category: a.category,
            date: a.date.toISOString(),
            description: a.description || a.rawDescription || "",
          })),
        }

        // 3. Build run history
        const runHistory = userRunsList.map((r) => ({
          cluster_type: r.clusterType,
          algorithm: r.algorithm,
          n_clusters: r.nClusters,
          silhouette_score: r.silhouetteScore || 0,
          inertia: r.inertia || 0,
          total_transactions: r.totalTransactions,
          status: r.status,
          run_at: r.runAt.toISOString(),
        }))

        // ── View: Summary ──
        if (view === "summary") {
          const summary: Record<string, any> = {
            generated_at: userRunsList[0]?.runAt.toISOString() || new Date().toISOString(),
            total_cluster_types: Object.keys(distributions).length,
            anomaly_summary: anomalySummary,
            run_history: runHistory,
          }

          if (type === "all") {
            summary.distributions = distributions
          } else if (distributions[type]) {
            summary.distributions = { [type]: distributions[type] }
          } else {
            return NextResponse.json({ error: `Unknown cluster type: ${type}` }, { status: 400 })
          }

          return NextResponse.json(summary)
        }

        // ── View: Distributions (chart data) ──
        if (view === "distributions") {
          if (type === "all") {
            return NextResponse.json(distributions)
          }
          if (distributions[type]) {
            return NextResponse.json(distributions[type])
          }
          return NextResponse.json({ error: `Unknown cluster type: ${type}` }, { status: 400 })
        }

        // ── View: Trends (monthly) ──
        if (view === "trends") {
          const staticTrends = getTrends() || {}
          if (type === "all") {
            return NextResponse.json(staticTrends)
          }
          if (staticTrends[type]) {
            return NextResponse.json(staticTrends[type])
          }
          return NextResponse.json({ error: `Unknown cluster type: ${type}` }, { status: 400 })
        }

        // ── View: Metadata (detailed cluster info) ──
        if (view === "metadata") {
          const allMetadata = userMeta.map((m) => ({
            cluster_type: m.clusterType,
            cluster_id: m.clusterId,
            label: m.label,
            description: m.description,
            color: m.color,
            transaction_count: m.transactionCount || 0,
            total_amount: m.totalAmount || 0,
            avg_amount: m.avgAmount || 0,
            min_amount: m.minAmount,
            max_amount: m.maxAmount,
            dominant_category: m.dominantCategory,
            dominant_payment_method: m.dominantPaymentMethod,
            percentage_of_total: m.percentageOfTotal,
          }))

          if (type === "all") {
            return NextResponse.json(allMetadata)
          }
          const filtered = allMetadata.filter((m: any) => m.cluster_type === type)
          return NextResponse.json(filtered)
        }

        // ── View: Anomalies ──
        if (view === "anomalies") {
          return NextResponse.json({
            ...anomalySummary,
            anomalous_transactions: anomalySummary.top_anomalies,
          })
        }

        return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
      }
    }

    // ─── Fallback to pre-computed static JSON files (Demo Seed Data) ───
    const metadata = getMetadata()
    const trends = getTrends()

    if (!metadata) {
      return NextResponse.json(
        {
          error: "Cluster data not found. Run the ML service first.",
          instructions: [
            "1. cd ml-service",
            "2. source venv/bin/activate",
            "3. python -m app.main",
          ],
        },
        { status: 404 }
      )
    }

    // ── View: Summary ──
    if (view === "summary") {
      const distributions = metadata.cluster_distributions || {}
      const anomalySummary = metadata.anomaly_summary || {}

      const summary: Record<string, any> = {
        generated_at: metadata.generated_at,
        total_cluster_types: Object.keys(distributions).length,
        anomaly_summary: anomalySummary,
        run_history: metadata.run_history || [],
      }

      if (type === "all") {
        summary.distributions = distributions
      } else if (distributions[type]) {
        summary.distributions = { [type]: distributions[type] }
      } else {
        return NextResponse.json({ error: `Unknown cluster type: ${type}` }, { status: 400 })
      }

      return NextResponse.json(summary)
    }

    // ── View: Distributions (chart data) ──
    if (view === "distributions") {
      const distributions = metadata.cluster_distributions || {}
      if (type === "all") {
        return NextResponse.json(distributions)
      }
      if (distributions[type]) {
        return NextResponse.json(distributions[type])
      }
      return NextResponse.json({ error: `Unknown cluster type: ${type}` }, { status: 400 })
    }

    // ── View: Trends (monthly) ──
    if (view === "trends") {
      if (!trends) {
        return NextResponse.json({ error: "Trend data not available" }, { status: 404 })
      }
      if (type === "all") {
        return NextResponse.json(trends)
      }
      if (trends[type]) {
        return NextResponse.json(trends[type])
      }
      return NextResponse.json({ error: `Unknown cluster type: ${type}` }, { status: 400 })
    }

    // ── View: Metadata (detailed cluster info) ──
    if (view === "metadata") {
      const allMetadata = metadata.cluster_metadata || []
      if (type === "all") {
        return NextResponse.json(allMetadata)
      }
      const filtered = allMetadata.filter((m: any) => m.cluster_type === type)
      return NextResponse.json(filtered)
    }

    // ── View: Anomalies ──
    if (view === "anomalies") {
      const anomalySummary = metadata.anomaly_summary || {}
      const transactions = getTransactions()
      const anomalies = transactions
        ? transactions.filter((t: any) => t.isAnomaly === true)
        : []

      return NextResponse.json({
        ...anomalySummary,
        anomalous_transactions: anomalies.slice(0, 50),
      })
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
  } catch (error: any) {
    safeLogError("Cluster API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
