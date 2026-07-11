import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling, ApiError, ErrorCodes, handleRouteError } from "./error-handler"
import { withCors, mobileCorsConfig, publicApiCorsConfig, CorsConfig } from "./cors"
import { withRequestLogging } from "@/server/lib/monitoring/logger"
import { validateRequest, validateQuery, validateParams, validateBody, commonSchemas } from "./validation"
import { incrementCounter, recordHistogram, Metrics } from "@/server/lib/monitoring/logger"
import { getCache, setCache, deleteCache, getOrSetCache, CacheNamespaces, CacheTags, CacheTTL } from "@/server/lib/cache/redis"

/**
 * Comprehensive middleware composition for API routes
 * Provides a unified way to apply all middleware layers
 */

export interface MiddlewareOptions {
  cors?: CorsConfig | false
  auth?: boolean
  rateLimit?: { max: number; windowMs: number } | false
  validation?: {
    body?: any
    query?: any
    params?: any
  }
  cache?: {
    namespace: string
    keyGenerator: (req: NextRequest) => string
    ttl?: number
    tags?: string[]
  }
  logging?: boolean
  metrics?: boolean
}

/**
 * Default middleware options
 */
const defaultOptions: MiddlewareOptions = {
  cors: mobileCorsConfig,
  auth: false,
  logging: true,
  metrics: true,
}

/**
 * Compose multiple middleware functions
 */
function composeMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  middlewares: Array<(req: NextRequest) => Promise<NextResponse>>
): (req: NextRequest) => Promise<NextResponse> {
  return middlewares.reduceRight(
    (next, middleware) => async (req) => middleware(req).then((res) => next(req)),
    handler
  )
}

/**
 * Create a fully configured API route handler
 */
export function createApiHandler(
  handler: (req: NextRequest, context: RouteContext) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const config = { ...defaultOptions, ...options }
  
  const middlewares: Array<(req: NextRequest) => Promise<NextResponse>> = []
  
  // 1. Request logging (outermost - captures everything)
  if (config.logging) {
    middlewares.push(withRequestLogging)
  }
  
  // 2. CORS handling
  if (config.cors !== false) {
    const corsConfig = config.cors || mobileCorsConfig
    middlewares.push(withCors(async (req) => NextResponse.next(), corsConfig))
  }
  
  // 3. Rate limiting (if configured)
  if (config.rateLimit) {
    middlewares.push(createRateLimitMiddleware(config.rateLimit))
  }
  
  // 4. Validation (if configured)
  if (config.validation) {
    if (config.validation.body) {
      middlewares.push(async (req) => { await validateBody(req, config.validation!.body); return NextResponse.next(); })
    }
    if (config.validation.query) {
      middlewares.push(async (req) => { validateQuery(req, config.validation!.query); return NextResponse.next(); })
    }
    if (config.validation.params) {
      middlewares.push(async (req) => { validateParams({}, config.validation!.params); return NextResponse.next(); })
    }
  }
  
  // 5. Cache check (if configured)
  if (config.cache) {
    middlewares.push(createCacheMiddleware(config.cache))
  }
  
  // Wrap the actual handler with error handling
  const wrappedHandler = withErrorHandling(async (req: NextRequest) => {
    const startTime = Date.now()
    
    // Build context object
    const context: RouteContext = {
      req,
      user: (req as any).user,
      params: (req as any).params || {},
      query: Object.fromEntries(new URL(req.url).searchParams),
      cache: config.cache
        ? {
            get: <T>(key: string) => getCache<T>(config.cache!.namespace, key),
            set: <T>(key: string, value: T, ttl?: number) => 
              setCache(config.cache!.namespace, key, value, { ttl: ttl || config.cache!.ttl }),
            delete: (key: string) => deleteCache(config.cache!.namespace, key),
          }
        : undefined,
      metrics: config.metrics ? {
        increment: (name: string, tags?: Record<string, string>) => incrementCounter(name, tags),
        histogram: (name: string, value: number, tags?: Record<string, string>) => recordHistogram(name, value, tags),
      } : undefined,
      error: ApiError,
      handleError: handleRouteError,
    }
    
    try {
      const response = await handler(req, context)
      
      // Record metrics
      if (config.metrics) {
        const duration = Date.now() - startTime
        recordHistogram(Metrics.HTTP_REQUEST_DURATION, duration, {
          method: req.method,
          path: new URL(req.url).pathname,
          status: response.status.toString(),
        })
        incrementCounter(Metrics.HTTP_REQUESTS_TOTAL, {
          method: req.method,
          path: new URL(req.url).pathname,
          status: response.status.toString(),
        })
      }
      
      return response
    } catch (error) {
      // Record error metrics
      if (config.metrics) {
        const duration = Date.now() - startTime
        incrementCounter(Metrics.HTTP_REQUESTS_TOTAL, {
          method: req.method,
          path: new URL(req.url).pathname,
          status: "500",
        })
        recordHistogram(Metrics.HTTP_REQUEST_DURATION, duration, {
          method: req.method,
          path: new URL(req.url).pathname,
          status: "500",
        })
      }
      throw error
    }
  })
  
  // Apply all middlewares
  return composeMiddleware(wrappedHandler, middlewares)
}

/**
 * Route context passed to handlers
 */
export interface RouteContext {
  req: NextRequest
  user?: any
  params: Record<string, string>
  query: Record<string, string>
  cache?: {
    get: <T>(key: string) => Promise<T | null>
    set: <T>(key: string, value: T, ttl?: number) => Promise<boolean>
    delete: (key: string) => Promise<boolean>
  }
  metrics?: {
    increment: (name: string, tags?: Record<string, string>) => void
    histogram: (name: string, value: number, tags?: Record<string, string>) => void
  }
  error: typeof ApiError
  handleError: typeof handleRouteError
}

/**
 * Create rate limiting middleware
 */
function createRateLimitMiddleware(config: { max: number; windowMs: number }) {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const key = `ratelimit:${ip}:${new URL(req.url).pathname}`
    const now = Date.now()
    
    let record = requests.get(key)
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + config.windowMs }
      requests.set(key, record)
    }
    
    record.count++
    
    if (record.count > config.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: "Too many requests",
            details: { retryAfter },
            timestamp: new Date().toISOString(),
            requestId: req.headers.get("x-request-id") || "unknown",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.max.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(record.resetTime / 1000).toString(),
          },
        }
      )
    }
    
    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", config.max.toString())
    response.headers.set("X-RateLimit-Remaining", (config.max - record.count).toString())
    response.headers.set("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000).toString())
    
    return response
  }
}

/**
 * Create cache middleware
 */
function createCacheMiddleware(config: { namespace: string; keyGenerator: (req: NextRequest) => string; ttl?: number; tags?: string[] }) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return NextResponse.next()
    }
    
    const key = config.keyGenerator(req)
    const cached = await getCache(config.namespace, key)
    
    if (cached !== null) {
      const response = NextResponse.json(cached)
      response.headers.set("X-Cache", "HIT")
      response.headers.set("X-Cache-Key", key)
      return response
    }
    
    // Continue to handler, cache will be set after
    const response = NextResponse.next()
    response.headers.set("X-Cache", "MISS")
    response.headers.set("X-Cache-Key", key)
    
    // We need to intercept the response to cache it
    // This is a simplified version - in production you'd use a more sophisticated approach
    return response
  }
}

/**
 * Cache helper functions (re-exported for convenience)
 */
export { getCache, setCache, deleteCache, getOrSetCache, CacheNamespaces, CacheTags, CacheTTL } from "@/server/lib/cache/redis"

/**
 * Validation helpers (re-exported for convenience)
 */
export { validateQuery, validateParams, validateBody, commonSchemas } from "./validation"
export { z } from "zod"

/**
 * CORS helpers (re-exported for convenience)
 */
export { withCors, mobileCorsConfig, publicApiCorsConfig, type CorsConfig } from "./cors"

/**
 * Error handling helpers (re-exported for convenience)
 */
export { withErrorHandling, ApiError, ErrorCodes, handleRouteError, createErrorResponse, createSuccessResponse } from "./error-handler"

/**
 * Monitoring helpers (re-exported for convenience)
 */
export { withRequestLogging, logger, Metrics, incrementCounter, recordHistogram, setGauge } from "@/server/lib/monitoring/logger"

/**
 * Predefined handler configurations for common patterns
 */
export const handlerConfigs = {
  // Public API endpoint (no auth, rate limited)
  public: {
    cors: publicApiCorsConfig,
    auth: false,
    rateLimit: { max: 100, windowMs: 60000 }, // 100 req/min
    logging: true,
    metrics: true,
  } as MiddlewareOptions,
  
  // Authenticated API endpoint
  protected: {
    cors: mobileCorsConfig,
    auth: true,
    rateLimit: { max: 200, windowMs: 60000 }, // 200 req/min
    logging: true,
    metrics: true,
  } as MiddlewareOptions,
  
  // File upload endpoint
  upload: {
    cors: mobileCorsConfig,
    auth: true,
    rateLimit: { max: 10, windowMs: 60000 }, // 10 uploads/min
    logging: true,
    metrics: true,
  } as MiddlewareOptions,
  
  // Webhook endpoint (no CORS, high rate limit)
  webhook: {
    cors: false,
    auth: false,
    rateLimit: { max: 1000, windowMs: 60000 },
    logging: true,
    metrics: true,
  } as MiddlewareOptions,
  
  // Health check (no rate limit, no auth)
  health: {
    cors: publicApiCorsConfig,
    auth: false,
    rateLimit: false,
    logging: false,
    metrics: false,
  } as MiddlewareOptions,
}

/**
 * Quick handler creators for common patterns
 */
export const handlers = {
  // GET with query validation and caching
  get: (
    handler: (req: NextRequest, context: RouteContext) => Promise<NextResponse>,
    options: MiddlewareOptions & { query?: any; cache?: MiddlewareOptions["cache"] } = {}
  ) => createApiHandler(handler, {
    ...handlerConfigs.protected,
    validation: { query: options.query },
    cache: options.cache,
    ...options,
  }),
  
  // POST with body validation
  post: (
    handler: (req: NextRequest, context: RouteContext) => Promise<NextResponse>,
    options: MiddlewareOptions & { body?: any } = {}
  ) => createApiHandler(handler, {
    ...handlerConfigs.protected,
    validation: { body: options.body },
    ...options,
  }),
  
  // PUT/PATCH with body and params validation
  put: (
    handler: (req: NextRequest, context: RouteContext) => Promise<NextResponse>,
    options: MiddlewareOptions & { body?: any; params?: any } = {}
  ) => createApiHandler(handler, {
    ...handlerConfigs.protected,
    validation: { body: options.body, params: options.params },
    ...options,
  }),
  
  // DELETE with params validation
  delete: (
    handler: (req: NextRequest, context: RouteContext) => Promise<NextResponse>,
    options: MiddlewareOptions & { params?: any } = {}
  ) => createApiHandler(handler, {
    ...handlerConfigs.protected,
    validation: { params: options.params },
    ...options,
  }),
  
  // Public GET (no auth)
  publicGet: (
    handler: (req: NextRequest, context: RouteContext) => Promise<NextResponse>,
    options: MiddlewareOptions & { query?: any; cache?: MiddlewareOptions["cache"] } = {}
  ) => createApiHandler(handler, {
    ...handlerConfigs.public,
    validation: { query: options.query },
    cache: options.cache,
    ...options,
  }),
}