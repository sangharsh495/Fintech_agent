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
import * as fs from "fs"
import * as path from "path"

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

      // Build a comprehensive summary
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
        anomalous_transactions: anomalies.slice(0, 50), // limit to 50
      })
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
  } catch (error: any) {
    console.error("Cluster API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
