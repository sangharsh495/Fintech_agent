import { NextRequest, NextResponse } from "next/server"

/**
 * Structured logging system for production monitoring
 * Supports multiple log levels, structured fields, and correlation IDs
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  userId?: string
  service: string
  environment: string
  version: string
  fields?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  duration?: number
}

export interface LoggerConfig {
  level: LogLevel
  service: string
  version: string
  environment: string
  prettyPrint?: boolean
  redactFields?: string[]
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
  service: "finflow-api",
  version: process.env.npm_package_version || "1.0.0",
  environment: process.env.NODE_ENV || "development",
  prettyPrint: process.env.NODE_ENV !== "production",
  redactFields: ["password", "token", "secret", "key", "authorization", "cookie", "creditCard", "ssn"],
}

let loggerConfig: LoggerConfig = DEFAULT_CONFIG

/**
 * Configure logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  loggerConfig = { ...DEFAULT_CONFIG, ...config }
}

/**
 * Get current log level threshold
 */
function getLogLevelThreshold(): number {
  return LOG_LEVELS[loggerConfig.level] ?? LOG_LEVELS.info
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= getLogLevelThreshold()
}

/**
 * Redact sensitive fields from log data
 */
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data }
  const fields = loggerConfig.redactFields || []
  
  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase()
    if (fields.some((field) => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = "[REDACTED]"
    }
  }
  
  return redacted
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (loggerConfig.prettyPrint) {
    const { timestamp, level, message, requestId, userId, fields, error, duration, ...rest } = entry
    const parts = [
      `${timestamp} [${level.toUpperCase()}] ${message}`,
      requestId && `requestId=${requestId}`,
      userId && `userId=${userId}`,
      duration !== undefined && `duration=${duration}ms`,
    ].filter(Boolean)
    
    let output = parts.join(" | ")
    
    if (fields && Object.keys(fields).length > 0) {
      output += ` | ${JSON.stringify(redactSensitiveData(fields), null, 2)}`
    }
    
    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`
      if (error.stack && loggerConfig.environment !== "production") {
        output += `\n  Stack: ${error.stack}`
      }
    }
    
    return output
  }
  
  // JSON format for production
  return JSON.stringify({
    ...entry,
    fields: entry.fields ? redactSensitiveData(entry.fields) : undefined,
  })
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, fields?: Record<string, unknown>, error?: Error, duration?: number): void {
  if (!shouldLog(level)) return
  
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: loggerConfig.service,
    environment: loggerConfig.environment,
    version: loggerConfig.version,
    fields,
    duration,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as { code?: string }).code,
        }
      : undefined,
  }
  
  console.log(formatLogEntry(entry))
  
  // In production, you could also send to external logging service
  // e.g., Datadog, LogRocket, Sentry, CloudWatch, etc.
  if (loggerConfig.environment === "production" && level >= LOG_LEVELS.error) {
    // sendToExternalLogger(entry)
  }
}

/**
 * Logger instance with all log levels
 */
export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => 
    log("debug", message, fields),
  
  info: (message: string, fields?: Record<string, unknown>) => 
    log("info", message, fields),
  
  warn: (message: string, fields?: Record<string, unknown>) => 
    log("warn", message, fields),
  
  error: (message: string, error?: Error, fields?: Record<string, unknown>) => 
    log("error", message, fields, error),
  
  fatal: (message: string, error?: Error, fields?: Record<string, unknown>) => 
    log("fatal", message, fields, error),
  
  // Convenience method for HTTP requests
  http: (req: NextRequest, res: NextResponse, duration: number) => {
    const requestId = req.headers.get("x-request-id") || "unknown"
    const userId = req.headers.get("x-user-id") || "anonymous"
    const method = req.method
    const url = req.url
    const status = res.status
    
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info"
    const message = `${method} ${url} ${status}`
    
    log(level, message, {
      method,
      url,
      status,
      requestId,
      userId,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    }, undefined, duration)
  },
  
  // Performance timing
  time: (label: string) => {
    const start = process.hrtime.bigint()
    return {
      end: (message?: string, fields?: Record<string, unknown>) => {
        const end = process.hrtime.bigint()
        const duration = Number(end - start) / 1_000_000 // Convert to ms
        logger.info(message || label, { ...fields, label, duration })
        return duration
      },
    }
  },
  
  // Create child logger with additional context
  child: (context: Record<string, unknown>) => ({
    debug: (message: string, fields?: Record<string, unknown>) => 
      log("debug", message, { ...context, ...fields }),
    info: (message: string, fields?: Record<string, unknown>) => 
      log("info", message, { ...context, ...fields }),
    warn: (message: string, fields?: Record<string, unknown>) => 
      log("warn", message, { ...context, ...fields }),
    error: (message: string, error?: Error, fields?: Record<string, unknown>) => 
      log("error", message, { ...context, ...fields }, error),
    fatal: (message: string, error?: Error, fields?: Record<string, unknown>) => 
      log("fatal", message, { ...context, ...fields }, error),
  }),
}

/**
 * Request logging middleware
 */
export function withRequestLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = process.hrtime.bigint()
    const requestId = req.headers.get("x-request-id") || `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    
    // Add request ID to headers for downstream use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-request-id", requestId)
    
    // Create request with modified headers
    const loggedReq = new NextRequest(req.url, {
      method: req.method,
      headers: requestHeaders,
      body: req.body,
      redirect: req.redirect,
      credentials: req.credentials,
      cache: req.cache,
      integrity: req.integrity,
      keepalive: req.keepalive,
      mode: req.mode,
      signal: req.signal,
    })
    
    logger.debug("Request started", {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    })
    
    try {
      const response = await handler(loggedReq)
      
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1_000_000
      
      // Add timing headers
      response.headers.set("X-Response-Time", `${duration.toFixed(2)}ms`)
      response.headers.set("X-Request-ID", requestId)
      
      logger.http(req, response, duration)
      
      return response
    } catch (error) {
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1_000_000
      
      logger.error("Request failed", error as Error, {
        requestId,
        method: req.method,
        url: req.url,
        duration,
      })
      
      throw error
    }
  }
}

/**
 * Metrics collector for monitoring
 */
export interface MetricPoint {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: number
  type: "counter" | "gauge" | "histogram"
}

const metricsBuffer: MetricPoint[] = []
const MAX_BUFFER_SIZE = 1000

/**
 * Record a metric
 */
export function recordMetric(
  name: string,
  value: number,
  type: "counter" | "gauge" | "histogram" = "counter",
  tags?: Record<string, string>
): void {
  const metric: MetricPoint = {
    name,
    value,
    type,
    tags,
    timestamp: Date.now(),
  }
  
  metricsBuffer.push(metric)
  
  // Prevent memory leak
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift()
  }
  
  // In production, flush to monitoring system
  if (loggerConfig.environment === "production") {
    // flushToMonitoringSystem(metric)
  }
}

/**
 * Increment a counter
 */
export function incrementCounter(name: string, tags?: Record<string, string>, value: number = 1): void {
  recordMetric(name, value, "counter", tags)
}

/**
 * Set a gauge value
 */
export function setGauge(name: string, value: number, tags?: Record<string, string>): void {
  recordMetric(name, value, "gauge", tags)
}

/**
 * Record a histogram value
 */
export function recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
  recordMetric(name, value, "histogram", tags)
}

/**
 * Get buffered metrics (for /metrics endpoint)
 */
export function getMetrics(): MetricPoint[] {
  return [...metricsBuffer]
}

/**
 * Clear metrics buffer
 */
export function clearMetrics(): void {
  metricsBuffer.length = 0
}

/**
 * Predefined metric names
 */
export const Metrics = {
  // HTTP metrics
  HTTP_REQUESTS_TOTAL: "http_requests_total",
  HTTP_REQUEST_DURATION: "http_request_duration_ms",
  HTTP_REQUEST_SIZE: "http_request_size_bytes",
  HTTP_RESPONSE_SIZE: "http_response_size_bytes",
  
  // Business metrics
  TRANSACTIONS_CREATED: "transactions_created_total",
  TRANSACTIONS_PARSED: "transactions_parsed_total",
  STATEMENTS_UPLOADED: "statements_uploaded_total",
  USERS_LOGGED_IN: "users_logged_in_total",
  
  // Database metrics
  DB_QUERY_DURATION: "db_query_duration_ms",
  DB_QUERY_ERRORS: "db_query_errors_total",
  DB_CONNECTIONS_ACTIVE: "db_connections_active",
  
  // Cache metrics
  CACHE_HITS: "cache_hits_total",
  CACHE_MISSES: "cache_misses_total",
  CACHE_ERRORS: "cache_errors_total",
  
  // External API metrics
  EXTERNAL_API_DURATION: "external_api_duration_ms",
  EXTERNAL_API_ERRORS: "external_api_errors_total",
  
  // ML service metrics
  ML_CLUSTERING_DURATION: "ml_clustering_duration_ms",
  ML_PREDICTIONS: "ml_predictions_total",
} as const