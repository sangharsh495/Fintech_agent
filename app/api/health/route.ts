import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { sql } from "drizzle-orm"

/**
 * Health check endpoints for monitoring and load balancers
 * 
 * GET /api/health - Liveness probe (basic health)
 * GET /api/health/ready - Readiness probe (dependencies check)
 * GET /api/health/live - Alias for liveness
 */

// Track startup time for uptime reporting
const startupTime = Date.now()

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: Record<string, CheckResult>
}

interface CheckResult {
  status: "pass" | "fail" | "warn"
  latency?: number
  message?: string
  details?: Record<string, unknown>
}

/**
 * Liveness probe - basic health check
 * Used by load balancers to determine if process is alive
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  const isReadiness = url.pathname.endsWith("/ready")
  const isLiveness = url.pathname.endsWith("/live") || url.pathname === "/api/health"

  if (isReadiness) {
    return readinessCheck()
  }

  if (isLiveness) {
    return livenessCheck()
  }

  return livenessCheck()
}

/**
 * Liveness check - just verifies the process is running
 */
async function livenessCheck(): Promise<NextResponse> {
  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startupTime) / 1000),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      process: {
        status: "pass",
        message: "Process is running",
      },
      memory: {
        status: getMemoryStatus(),
        message: "Memory usage within limits",
        details: getMemoryDetails(),
      },
    },
  }

  return NextResponse.json(result, { 
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}

/**
 * Readiness check - verifies all dependencies are available
 */
async function readinessCheck(): Promise<NextResponse> {
  const checks: Record<string, CheckResult> = {}
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy"

  // Check database connectivity
  const dbCheck = await checkDatabase()
  checks.database = dbCheck
  if (dbCheck.status === "fail") overallStatus = "unhealthy"
  else if (dbCheck.status === "warn") overallStatus = "degraded"

  // Check Redis (if configured)
  const redisCheck = await checkRedis()
  checks.redis = redisCheck
  if (redisCheck.status === "fail") overallStatus = "unhealthy"
  else if (redisCheck.status === "warn") overallStatus = "degraded"

  // Check external services
  const externalCheck = await checkExternalServices()
  checks.externalServices = externalCheck
  if (externalCheck.status === "warn") overallStatus = "degraded"

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startupTime) / 1000),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks,
  }

  const statusCode = overallStatus === "unhealthy" ? 503 : 200

  return NextResponse.json(result, { 
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    // Simple query to verify connection
    await db.execute(sql`SELECT 1 as health_check`)
    const latency = Date.now() - start
    
    return {
      status: latency > 500 ? "warn" : "pass",
      latency,
      message: latency > 500 ? "Database responding slowly" : "Database connected",
      details: { latencyMs: latency },
    }
  } catch (error) {
    return {
      status: "fail",
      latency: Date.now() - start,
      message: "Database connection failed",
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    }
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<CheckResult> {
  const start = Date.now()
  
  // Only check if Redis is configured
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return {
      status: "pass",
      message: "Redis not configured (optional)",
      details: { configured: false },
    }
  }

  try {
    const { Redis } = await import("@upstash/redis")
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
    
    await redis.ping()
    const latency = Date.now() - start
    
    return {
      status: latency > 200 ? "warn" : "pass",
      latency,
      message: latency > 200 ? "Redis responding slowly" : "Redis connected",
      details: { latencyMs: latency, configured: true },
    }
  } catch (error) {
    return {
      status: "fail",
      latency: Date.now() - start,
      message: "Redis connection failed",
      details: { error: error instanceof Error ? error.message : "Unknown error", configured: true },
    }
  }
}

/**
 * Check external services (email, ML service, etc.)
 */
async function checkExternalServices(): Promise<CheckResult> {
  const services = [
    { name: "email", url: process.env.RESEND_API_KEY ? "configured" : "not configured" },
    { name: "ml-service", url: process.env.ML_SERVICE_URL || "not configured" },
  ]

  const results = services.map((svc) => ({
    name: svc.name,
    status: svc.url === "not configured" ? "warn" : "pass",
    message: svc.url === "not configured" ? "Not configured" : "Configured",
  }))

  return {
    status: results.some((r) => r.status === "warn") ? "warn" : "pass",
    message: "External services status",
    details: { services: results },
  }
}

/**
 * Get memory usage status
 */
function getMemoryStatus(): "pass" | "warn" {
  const usage = process.memoryUsage()
  const heapUsedMB = usage.heapUsed / 1024 / 1024
  const heapLimitMB = usage.heapTotal / 1024 / 1024
  const usagePercent = (heapUsedMB / heapLimitMB) * 100
  
  return usagePercent > 80 ? "warn" : "pass"
}

/**
 * Get memory usage details
 */
function getMemoryDetails(): Record<string, unknown> {
  const usage = process.memoryUsage()
  return {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    usagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
  }
}