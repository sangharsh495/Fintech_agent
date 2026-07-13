import { NextRequest, NextResponse } from "next/server"
import { refreshAllAggregates } from "@/server/jobs/refresh-aggregates"
import { safeLogError } from "@/server/lib/safe-log"

/**
 * POST /api/jobs/refresh-aggregates
 *
 * Cron-triggered endpoint to refresh all aggregation tables.
 * Protected by a shared secret (CRON_SECRET) — NOT user-authenticated.
 *
 * Call this from:
 * - Render cron job (nightly)
 * - Vercel cron
 * - After a successful statement upload (for immediate freshness)
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await refreshAllAggregates()
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    safeLogError("[REFRESH AGGREGATES JOB]", error)
    return NextResponse.json({ error: "Aggregation refresh failed" }, { status: 500 })
  }
}
