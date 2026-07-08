import { NextRequest, NextResponse } from "next/server"
import { getMetrics, Metrics } from "@/server/lib/monitoring/logger"
import { getCacheStats } from "@/server/lib/cache/redis"
import { db } from "@/server/db"
import { sql } from "drizzle-orm"

/**
 * Prometheus-compatible metrics endpoint
 * GET /api/metrics
 */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const metrics = getMetrics()
  const cacheStats = await getCacheStats()
  
  // Get database stats
  let dbStats = { connected: false, latency: 0 }
  try {
    const start = Date.now()
    await db.execute(sql`SELECT 1`)
    dbStats = { connected: true, latency: Date.now() - start }
  } catch {
    dbStats = { connected: false, latency: 0 }
  }

  // Aggregate metrics by name
  const aggregated = new Map<string, { value: number; type: string; tags: Record<string, string> }>()
  
  for (const metric of metrics) {
    const key = `${metric.name}${JSON.stringify(metric.tags || {})}`
    const existing = aggregated.get(key)
    
    if (existing) {
      if (metric.type === "counter") {
        existing.value += metric.value
      } else if (metric.type === "gauge") {
        existing.value = metric.value // Last value wins for gauges
      } else if (metric.type === "histogram") {
        // For histograms, we keep the last value (in production, you'd use proper buckets)
        existing.value = metric.value
      }
    } else {
      aggregated.set(key, { value: metric.value, type: metric.type, tags: metric.tags || {} })
    }
  }

  // Generate Prometheus format
  const lines: string[] = [
    "# HELP finflow_build_info Build information",
    "# TYPE finflow_build_info gauge",
    `finflow_build_info{version="${process.env.npm_package_version || "1.0.0"}",environment="${process.env.NODE_ENV || "development"}"} 1`,
    "",
  ]

  // HTTP metrics
  const httpRequests = aggregated.get(Metrics.HTTP_REQUESTS_TOTAL)?.value || 0
  lines.push(
    "# HELP finflow_http_requests_total Total HTTP requests",
    "# TYPE finflow_http_requests_total counter",
    `finflow_http_requests_total ${httpRequests}`,
    ""
  )

  const httpDuration = aggregated.get(Metrics.HTTP_REQUEST_DURATION)?.value || 0
  lines.push(
    "# HELP finflow_http_request_duration_ms HTTP request duration in milliseconds",
    "# TYPE finflow_http_request_duration_ms histogram",
    `finflow_http_request_duration_ms_sum ${httpDuration}`,
    `finflow_http_request_duration_ms_count ${httpRequests}`,
    ""
  )

  // Business metrics
  const businessMetrics = [
    Metrics.TRANSACTIONS_CREATED,
    Metrics.TRANSACTIONS_PARSED,
    Metrics.STATEMENTS_UPLOADED,
    Metrics.USERS_LOGGED_IN,
  ]

  for (const metricName of businessMetrics) {
    const value = aggregated.get(metricName)?.value || 0
    lines.push(
      `# HELP finflow_${metricName.toLowerCase()} Total ${metricName.toLowerCase().replace(/_/g, " ")}`,
      `# TYPE finflow_${metricName.toLowerCase()} counter`,
      `finflow_${metricName.toLowerCase()} ${value}`,
      ""
    )
  }

  // Database metrics
  lines.push(
    "# HELP finflow_db_connected Database connection status",
    "# TYPE finflow_db_connected gauge",
    `finflow_db_connected ${dbStats.connected ? 1 : 0}`,
    ""
  )

  lines.push(
    "# HELP finflow_db_latency_ms Database query latency in milliseconds",
    "# TYPE finflow_db_latency_ms gauge",
    `finflow_db_latency_ms ${dbStats.latency}`,
    ""
  )

  // Cache metrics
  lines.push(
    "# HELP finflow_cache_connected Cache connection status",
    "# TYPE finflow_cache_connected gauge",
    `finflow_cache_connected ${cacheStats.connected ? 1 : 0}`,
    ""
  )

  if (cacheStats.keyCount !== undefined) {
    lines.push(
      "# HELP finflow_cache_keys_total Total keys in cache",
      "# TYPE finflow_cache_keys_total gauge",
      `finflow_cache_keys_total ${cacheStats.keyCount}`,
      ""
    )
  }

  const cacheHits = aggregated.get(Metrics.CACHE_HITS)?.value || 0
  const cacheMisses = aggregated.get(Metrics.CACHE_MISSES)?.value || 0
  const cacheTotal = cacheHits + cacheMisses
  const cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0

  lines.push(
    "# HELP finflow_cache_hits_total Total cache hits",
    "# TYPE finflow_cache_hits_total counter",
    `finflow_cache_hits_total ${cacheHits}`,
    ""
  )

  lines.push(
    "# HELP finflow_cache_misses_total Total cache misses",
    "# TYPE finflow_cache_misses_total counter",
    `finflow_cache_misses_total ${cacheMisses}`,
    ""
  )

  lines.push(
    "# HELP finflow_cache_hit_rate_percent Cache hit rate percentage",
    "# TYPE finflow_cache_hit_rate_percent gauge",
    `finflow_cache_hit_rate_percent ${cacheHitRate.toFixed(2)}`,
    ""
  )

  // Process metrics
  const memUsage = process.memoryUsage()
  lines.push(
    "# HELP finflow_process_memory_bytes Process memory usage in bytes",
    "# TYPE finflow_process_memory_bytes gauge",
    `finflow_process_memory_bytes{type="heap_used"} ${memUsage.heapUsed}`,
    `finflow_process_memory_bytes{type="heap_total"} ${memUsage.heapTotal}`,
    `finflow_process_memory_bytes{type="external"} ${memUsage.external}`,
    `finflow_process_memory_bytes{type="rss"} ${memUsage.rss}`,
    ""
  )

  lines.push(
    "# HELP finflow_process_uptime_seconds Process uptime in seconds",
    "# TYPE finflow_process_uptime_seconds gauge",
    `finflow_process_uptime_seconds ${process.uptime()}`,
    ""
  )

  lines.push(
    "# HELP finflow_process_cpu_seconds_total Process CPU time in seconds",
    "# TYPE finflow_process_cpu_seconds_total counter",
    `finflow_process_cpu_seconds_total${{}} ${(process.cpuUsage().user + process.cpuUsage().system) / 1_000_000}`,
    ""
  )

  // Node.js event loop lag (if available)
  try {
    const { performance } = await import("perf_hooks")
    // This is a rough approximation
    lines.push(
      "# HELP finflow_event_loop_lag_ms Event loop lag in milliseconds",
      "# TYPE finflow_event_loop_lag_ms gauge",
      `finflow_event_loop_lag_ms 0`, // Would need proper monitoring
      ""
    )
  } catch {
    // perf_hooks not available
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}