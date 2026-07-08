import pino from "pino"
import type { NextRequest } from "next/server"

/**
 * Industry-standard structured logging middleware
 * Uses Pino for high-performance JSON logging
 */

// Configure logger based on environment
const isProduction = process.env.NODE_ENV === "production"
const isDevelopment = process.env.NODE_ENV === "development"

/**
 * Logger configuration
 */
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "finflow-api",
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  },
  // Redact sensitive fields
  redact: {
    paths: [
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.secret",
      "*.apiKey",
      "*.authorization",
      "*.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },
  // Pretty print in development
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
}

/**
 * Main logger instance
 */
export const logger = pino(loggerConfig)

/**
 * Child logger with context
 */
export function createContextLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Request logger with request ID and context
 */
export function createRequestLogger(req: NextRequest, requestId: string) {
  return logger.child({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent") || "unknown",
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
        req.headers.get("x-real-ip") || 
        "unknown",
  })
}

/**
 * Log levels
 */
export const LogLevel = {
  FATAL: "fatal",
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
  TRACE: "trace",
} as const

/**
 * Structured log entry
 */
export interface LogEntry {
  level: string
  time: string
  message: string
  service: string
  environment: string
  version: string
  requestId?: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  userId?: string
  error?: {
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, unknown>
}

/**
 * Audit log for security events
 */
export const auditLogger = createContextLogger({ type: "audit" })

export function logAuditEvent(
  event: string,
  details: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info"
) {
  auditLogger[level]({ event, ...details }, `Audit: ${event}`)
}

/**
 * Business event logging
 */
export const businessLogger = createContextLogger({ type: "business" })

export function logBusinessEvent(
  event: string,
  details: Record<string, unknown>,
  userId?: string
) {
  businessLogger.info(
    { event, userId, ...details },
    `Business event: ${event}`
  )
}

/**
 * Performance logging
 */
export const perfLogger = createContextLogger({ type: "performance" })

export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>
) {
  const level = durationMs > 1000 ? "warn" : durationMs > 500 ? "info" : "debug"
  perfLogger[level](
    { operation, durationMs, ...metadata },
    `Performance: ${operation} took ${durationMs}ms`
  )
}

/**
 * Database query logging
 */
export const dbLogger = createContextLogger({ type: "database" })

export function logQuery(
  query: string,
  durationMs: number,
  params?: unknown[]
) {
  const level = durationMs > 500 ? "warn" : "debug"
  dbLogger[level](
    { query, durationMs, params: params ? "[PARAMS]" : undefined },
    `DB Query: ${durationMs}ms`
  )
}

/**
 * External API call logging
 */
export const externalLogger = createContextLogger({ type: "external" })

export function logExternalCall(
  service: string,
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode?: number,
  error?: Error
) {
  const level = error ? "error" : statusCode && statusCode >= 400 ? "warn" : "info"
  externalLogger[level](
    { service, endpoint, method, durationMs, statusCode, error: error?.message },
    `External API: ${service} ${method} ${endpoint} - ${statusCode || "ERROR"} (${durationMs}ms)`
  )
}

/**
 * Middleware to log requests
 */
export function createRequestLoggingMiddleware() {
  return async (req: NextRequest, handler: (req: NextRequest) => Promise<Response>) => {
    const requestId = req.headers.get("x-request-id") || `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const startTime = Date.now()
    const requestLogger = createRequestLogger(req, requestId)
    
    requestLogger.info({ requestId }, `Incoming request: ${req.method} ${req.url}`)
    
    try {
      const response = await handler(req)
      const duration = Date.now() - startTime
      
      requestLogger.info(
        { 
          requestId, 
          statusCode: response.status,
          duration,
        },
        `Request completed: ${req.method} ${req.url} - ${response.status} (${duration}ms)`
      )
      
      response.headers.set("X-Request-ID", requestId)
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      requestLogger.error(
        { 
          requestId, 
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        `Request failed: ${req.method} ${req.url} (${duration}ms)`
      )
      throw error
    }
  }
}

/**
 * Get logger for a specific module
 */
export function getModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName })
}