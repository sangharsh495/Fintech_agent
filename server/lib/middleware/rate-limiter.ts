import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { auth } from "@/server/auth"

/**
 * Rate Limiting Middleware for FinFlow
 * Uses Upstash Redis for distributed rate limiting
 */

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limit configurations per endpoint type
export const RateLimitConfigs = {
  // Auth endpoints - strict limits
  AUTH: {
    tokens: 5,
    window: "1 m",
    prefix: "rl:auth",
  },
  // File upload - moderate limits
  UPLOAD: {
    tokens: 10,
    window: "1 h",
    prefix: "rl:upload",
  },
  // Read APIs - generous limits
  READ_API: {
    tokens: 100,
    window: "1 m",
    prefix: "rl:read",
  },
  // Write APIs - moderate limits
  WRITE_API: {
    tokens: 30,
    window: "1 m",
    prefix: "rl:write",
  },
  // AI Chat - strict to control costs
  AI_CHAT: {
    tokens: 20,
    window: "1 m",
    prefix: "rl:ai",
  },
  // Admin - moderate
  ADMIN: {
    tokens: 50,
    window: "1 m",
    prefix: "rl:admin",
  },
} as const

type RateLimitConfig = (typeof RateLimitConfigs)[keyof typeof RateLimitConfigs]

// Cache of rate limiters
const rateLimiterCache = new Map<string, Ratelimit>()

function getRateLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.prefix}:${config.tokens}:${config.window}`
  
  if (!rateLimiterCache.has(key)) {
    rateLimiterCache.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.tokens, config.window),
        prefix: config.prefix,
        analytics: true,
      })
    )
  }
  
  return rateLimiterCache.get(key)!
}

/**
 * Extract identifier for rate limiting
 * Uses user ID if authenticated, otherwise IP address
 */
async function getIdentifier(request: NextRequest): Promise<string> {
  try {
    const session = await auth()
    if (session?.user?.id) {
      return `user:${session.user.id}`
    }
  } catch {
    // Session not available, fall back to IP
  }
  
  // Get IP from headers (works with Vercel, Cloudflare, etc.)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
  
  return `ip:${ip}`
}

/**
 * Create rate limiting middleware for a specific configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = getRateLimiter(config)
  
  return async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await limiter.limit(identifier)
    
    // Add rate limit headers
    const headers = new Headers()
    headers.set("X-RateLimit-Limit", limit.toString())
    headers.set("X-RateLimit-Remaining", remaining.toString())
    headers.set("X-RateLimit-Reset", reset.toString())
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers,
        }
      )
    }
    
    // Return null to indicate success - attach headers to response later
    return null
  }
}

/**
 * Apply rate limiting to a response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString())
  response.headers.set("X-RateLimit-Remaining", remaining.toString())
  response.headers.set("X-RateLimit-Reset", reset.toString())
  return response
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  auth: createRateLimiter(RateLimitConfigs.AUTH),
  upload: createRateLimiter(RateLimitConfigs.UPLOAD),
  readApi: createRateLimiter(RateLimitConfigs.READ_API),
  writeApi: createRateLimiter(RateLimitConfigs.WRITE_API),
  aiChat: createRateLimiter(RateLimitConfigs.AI_CHAT),
  admin: createRateLimiter(RateLimitConfigs.ADMIN),
}

/**
 * Higher-order function to wrap an API route with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  const limiter = createRateLimiter(config)
  
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    const identifier = await getIdentifier(request)
    const limiterInstance = getRateLimiter(config)
    const { success, limit, reset, remaining } = await limiterInstance.limit(identifier)
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    
    const response = await handler(request)
    
    // Add rate limit headers to successful response
    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Reset", reset.toString())
    
    return response
  }
}

console.log("[RateLimiter] Initialized with Upstash Redis")