import { type NextRequest, NextResponse } from "next/server"

/**
 * Industry-standard CORS middleware
 * Configurable Cross-Origin Resource Sharing
 */

export interface CorsConfig {
  origin: string | string[] | "*" | ((origin: string | null) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export const defaultCorsConfig: CorsConfig = {
  origin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:3000",
    "http://localhost:8081", // React Native default
    "exp://localhost:8081", // Expo
    "capacitor://localhost", // Capacitor iOS
    "http://localhost", // Capacitor Android
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Request-ID",
    "X-CSRF-Token",
  ],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Request-ID",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
}

/**
 * Parse origin config to check if origin is allowed
 */
function isOriginAllowed(origin: string | null, config: CorsConfig): boolean {
  if (!origin) return false
  
  if (config.origin === "*") return true
  if (typeof config.origin === "function") return config.origin(origin)
  if (Array.isArray(config.origin)) return config.origin.includes(origin)
  return config.origin === origin
}

/**
 * Get allowed origin for response
 */
function getAllowedOrigin(origin: string | null, config: CorsConfig): string | null {
  if (!origin) return null
  
  if (config.origin === "*") return "*"
  if (typeof config.origin === "function") return config.origin(origin) ? origin : null
  if (Array.isArray(config.origin)) return config.origin.includes(origin) ? origin : null
  return config.origin === origin ? origin : null
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  req: NextRequest,
  config: CorsConfig = defaultCorsConfig
): NextResponse {
  const origin = req.headers.get("origin")
  const allowedOrigin = getAllowedOrigin(origin, config)

  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
    
    if (config.credentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
  }

  // Expose headers
  if (config.exposedHeaders?.length) {
    response.headers.set(
      "Access-Control-Expose-Headers",
      config.exposedHeaders.join(", ")
    )
  }

  return response
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflight(
  req: NextRequest,
  config: CorsConfig = defaultCorsConfig
): NextResponse | null {
  if (req.method !== "OPTIONS") return null

  const origin = req.headers.get("origin")
  const allowedOrigin = getAllowedOrigin(origin, config)

  if (!allowedOrigin) {
    return new NextResponse(null, { status: 403 })
  }

  const response = new NextResponse(null, { 
    status: config.optionsSuccessStatus || 204 
  })

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
  
  if (config.credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true")
  }

  if (config.methods?.length) {
    response.headers.set("Access-Control-Allow-Methods", config.methods.join(", "))
  }

  if (config.allowedHeaders?.length) {
    response.headers.set("Access-Control-Allow-Headers", config.allowedHeaders.join(", "))
  }

  if (config.maxAge) {
    response.headers.set("Access-Control-Max-Age", config.maxAge.toString())
  }

  return response
}

/**
 * CORS middleware wrapper for Next.js App Router
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CorsConfig = defaultCorsConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight
    const preflightResponse = handlePreflight(req, config)
    if (preflightResponse) return preflightResponse

    // Process actual request
    const response = await handler(req)
    
    // Apply CORS headers
    return applyCorsHeaders(response, req, config)
  }
}

/**
 * Create CORS config for specific origins
 */
export function createCorsConfig(origins: string[]): CorsConfig {
  return {
    ...defaultCorsConfig,
    origin: origins,
  }
}

/**
 * CORS config for mobile apps (more permissive)
 */
export const mobileCorsConfig: CorsConfig = {
  ...defaultCorsConfig,
  origin: (origin) => {
    if (!origin) return false
    // Allow all localhost origins for mobile development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true
    // Allow Expo/React Native origins
    if (origin.startsWith("exp://") || origin.startsWith("capacitor://")) return true
    // Allow configured origins
    const allowed = process.env.CORS_ORIGIN?.split(",") || []
    return allowed.includes(origin)
  },
}

/**
 * CORS config for public API (no credentials)
 */
export const publicApiCorsConfig: CorsConfig = {
  ...defaultCorsConfig,
  origin: "*",
  credentials: false,
}