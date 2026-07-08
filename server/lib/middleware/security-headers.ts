import type { NextRequest, NextResponse } from "next/server"

/**
 * Industry-standard security headers middleware
 * Implements OWASP recommended security headers
 */

// Content Security Policy - restrict resources to trusted sources
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://api.resend.com https://*.upstash.io wss://*.upstash.io",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

// Permissions Policy - restrict browser features
export const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
  "interest-cohort=()",
].join(", ")

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  csp?: string
  hsts?: boolean
  hstsMaxAge?: number
  hstsIncludeSubdomains?: boolean
  hstsPreload?: boolean
  noSniff?: boolean
  noOpen?: boolean
  xFrameOptions?: "DENY" | "SAMEORIGIN"
  referrerPolicy?: string
  permissionsPolicy?: string
  crossOriginEmbedderPolicy?: boolean
  crossOriginOpenerPolicy?: boolean
  crossOriginResourcePolicy?: "same-origin" | "same-site" | "cross-origin"
}

/**
 * Default security headers configuration
 */
export const defaultSecurityConfig: SecurityHeadersConfig = {
  csp: CSP_POLICY,
  hsts: true,
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubdomains: true,
  hstsPreload: true,
  noSniff: true,
  noOpen: true,
  xFrameOptions: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: PERMISSIONS_POLICY,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: "same-origin",
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultSecurityConfig
): NextResponse {
  const headers = response.headers

  // Content Security Policy
  if (config.csp) {
    headers.set("Content-Security-Policy", config.csp)
  }

  // HTTP Strict Transport Security (HSTS)
  if (config.hsts) {
    const hstsValue = [
      `max-age=${config.hstsMaxAge}`,
      config.hstsIncludeSubdomains ? "includeSubDomains" : "",
      config.hstsPreload ? "preload" : "",
    ]
      .filter(Boolean)
      .join("; ")
    headers.set("Strict-Transport-Security", hstsValue)
  }

  // X-Content-Type-Options
  if (config.noSniff) {
    headers.set("X-Content-Type-Options", "nosniff")
  }

  // X-Download-Options
  if (config.noOpen) {
    headers.set("X-Download-Options", "noopen")
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    headers.set("X-Frame-Options", config.xFrameOptions)
  }

  // Referrer Policy
  if (config.referrerPolicy) {
    headers.set("Referrer-Policy", config.referrerPolicy)
  }

  // Permissions Policy
  if (config.permissionsPolicy) {
    headers.set("Permissions-Policy", config.permissionsPolicy)
  }

  // Cross-Origin Embedder Policy
  if (config.crossOriginEmbedderPolicy) {
    headers.set("Cross-Origin-Embedder-Policy", "require-corp")
  }

  // Cross-Origin Opener Policy
  if (config.crossOriginOpenerPolicy) {
    headers.set("Cross-Origin-Opener-Policy", "same-origin")
  }

  // Cross-Origin Resource Policy
  if (config.crossOriginResourcePolicy) {
    headers.set("Cross-Origin-Resource-Policy", config.crossOriginResourcePolicy)
  }

  // Remove server header for security
  headers.delete("Server")
  headers.delete("X-Powered-By")

  return response
}

/**
 * Middleware wrapper for Next.js App Router
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: SecurityHeadersConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req)
    return applySecurityHeaders(response, config)
  }
}

/**
 * Security headers for API routes (stricter CSP)
 */
export const apiSecurityConfig: SecurityHeadersConfig = {
  ...defaultSecurityConfig,
  csp: [
    "default-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; "),
  crossOriginResourcePolicy: "same-site",
}

/**
 * Security headers for public assets (more permissive)
 */
export const assetSecurityConfig: SecurityHeadersConfig = {
  ...defaultSecurityConfig,
  csp: undefined, // No CSP for static assets
  crossOriginResourcePolicy: "cross-origin",
  hsts: true,
}