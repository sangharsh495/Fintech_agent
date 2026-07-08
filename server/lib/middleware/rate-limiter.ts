import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import type { NextRequest, NextResponse } from "next/server"

// Initialize Upstash Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
})

/**
 * Industry-standard rate limiter using Upstash Redis
 * Implements sliding window algorithm
 */
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
  prefix: "ratelimit:finflow",
})

/**
 * Strict rate limiter for sensitive endpoints (auth, upload)
 */
export const strictRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
  prefix: "ratelimit:finflow:strict",
})

/**
 * Rate limiter for AI/chat endpoints
 */
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute
  analytics: true,
  prefix: "ratelimit:finflow:ai",
})

/**
 * Extract identifier from request for rate limiting
 * Uses user ID if authenticated, otherwise IP address
 */
export function getRateLimitIdentifier(req: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    // In production, decode JWT to get user ID
    return `user:${authHeader.slice(7, 27)}` // Use first 20 chars of token as identifier
  }

  // Fallback to IP address
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : 
             req.headers.get("x-real-ip") || 
             "unknown"
  return `ip:${ip}`
}

/**
 * Apply rate limiting to a request
 * Returns rate limit info and whether request should proceed
 */
export async function applyRateLimit(
  req: NextRequest,
  limiter: typeof ratelimit = ratelimit
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  headers: Record<string, string>
}> {
  const identifier = getRateLimitIdentifier(req)
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  const headers = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  }

  return { success, limit, remaining, reset, headers }
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, remaining).toString(),
    "X-RateLimit-Reset": reset.toString(),
    "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
  }
}