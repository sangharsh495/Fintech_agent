import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { safeLogError } from "@/server/lib/safe-log";

/**
 * Industry-standard error handling middleware
 * Provides consistent error responses and logging
 */

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
    requestId: string
  }
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: string
  requestId: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  
  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  
  // Business logic errors
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Custom API error class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly isOperational: boolean

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true // Expected errors vs programming errors
    
    Error.captureStackTrace(this, this.constructor)
  }

  static validationError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(ErrorCodes.VALIDATION_ERROR, message, 400, details)
  }

  static unauthorized(message: string = "Unauthorized"): ApiError {
    return new ApiError(ErrorCodes.UNAUTHORIZED, message, 401)
  }

  static forbidden(message: string = "Forbidden"): ApiError {
    return new ApiError(ErrorCodes.FORBIDDEN, message, 403)
  }

  static notFound(resource: string = "Resource"): ApiError {
    return new ApiError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404)
  }

  static conflict(message: string): ApiError {
    return new ApiError(ErrorCodes.CONFLICT, message, 409)
  }

  static rateLimited(message: string = "Too many requests"): ApiError {
    return new ApiError(ErrorCodes.RATE_LIMITED, message, 429)
  }

  static payloadTooLarge(message: string = "Payload too large"): ApiError {
    return new ApiError(ErrorCodes.PAYLOAD_TOO_LARGE, message, 413)
  }

  static unsupportedMediaType(message: string = "Unsupported media type"): ApiError {
    return new ApiError(ErrorCodes.UNSUPPORTED_MEDIA_TYPE, message, 415)
  }

  static internal(message: string = "Internal server error"): ApiError {
    return new ApiError(ErrorCodes.INTERNAL_ERROR, message, 500)
  }

  static serviceUnavailable(message: string = "Service temporarily unavailable"): ApiError {
    return new ApiError(ErrorCodes.SERVICE_UNAVAILABLE, message, 503)
  }

  static databaseError(message: string = "Database error"): ApiError {
    return new ApiError(ErrorCodes.DATABASE_ERROR, message, 500)
  }

  static externalServiceError(service: string): ApiError {
    return new ApiError(
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      `${service} service error`,
      502
    )
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Check if error is a Postgres/Neon database error (from pg or @neondatabase/serverless)
 */
function isPostgresError(error: unknown): error is { code: string; detail?: string; constraint?: string; table?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string" &&
    /^\d{5}$/.test((error as Record<string, unknown>).code as string) // Postgres error codes are 5-digit strings
  )
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error,
  requestId: string = generateRequestId()
): ApiErrorResponse {
  const timestamp = new Date().toISOString()

  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId,
      },
    }
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.reduce((acc, err) => {
      const path = err.path.join(".")
      if (!acc[path]) acc[path] = []
      acc[path].push(err.message)
      return acc
    }, {} as Record<string, string[]>)

    return {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: "Validation failed",
        details,
        timestamp,
        requestId,
      },
    }
  }

  // Handle Postgres/ database errors (Drizzle passes through native pg errors)
  if (isPostgresError(error)) {
    let code: ErrorCode = ErrorCodes.DATABASE_ERROR
    let message = "Database operation failed"
    let statusCode = 500

    switch (error.code) {
      case "23505": // unique_violation
        code = ErrorCodes.CONFLICT
        message = "A record with this value already exists"
        statusCode = 409
        break
      case "23503": // foreign_key_violation
        code = ErrorCodes.VALIDATION_ERROR
        message = "Referenced record does not exist"
        statusCode = 400
        break
      case "23502": // not_null_violation
        code = ErrorCodes.VALIDATION_ERROR
        message = "Required field is missing"
        statusCode = 400
        break
      case "22P02": // invalid_text_representation (e.g. invalid UUID)
        code = ErrorCodes.VALIDATION_ERROR
        message = "Invalid data format"
        statusCode = 400
        break
      case "42P01": // undefined_table
        code = ErrorCodes.DATABASE_ERROR
        message = "Database schema error"
        break
      case "57014": // query_canceled (timeout)
        code = ErrorCodes.SERVICE_UNAVAILABLE
        message = "Database query timed out"
        statusCode = 503
        break
      case "08006": // connection_failure
      case "08001": // sqlclient_unable_to_establish_sqlconnection
      case "08004": // sqlserver_rejected_establishment_of_sqlconnection
        code = ErrorCodes.SERVICE_UNAVAILABLE
        message = "Database connection failed"
        statusCode = 503
        break
    }

    return {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV !== "production"
          ? { pgCode: error.code, constraint: error.constraint, table: error.table, detail: error.detail }
          : undefined,
        timestamp,
        requestId,
      },
    }
  }

  // Unknown errors
  safeLogError("[API ERROR]", {
    requestId,
    error: error.message,
    stack: error.stack,
    timestamp,
  })

  return {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === "production" 
        ? "An unexpected error occurred" 
        : error.message,
      timestamp,
      requestId,
    },
  }
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string = generateRequestId()
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  }
}

/**
 * Error handler middleware for Next.js App Router
 */
export async function errorHandler(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = generateRequestId()
  
  // Add request ID to headers for tracing
  const response = await handler(req)
  response.headers.set("X-Request-ID", requestId)
  
  return response
}

/**
 * Async handler wrapper that catches errors and returns standardized responses
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const req = args[0] as NextRequest
    const requestId = generateRequestId()
    
    try {
      const response = await handler(...args)
      response.headers.set("X-Request-ID", requestId)
      return response
    } catch (error) {
      const errorResponse = createErrorResponse(error as Error, requestId)
      const statusCode = error instanceof ApiError ? error.statusCode : 500
      
      return NextResponse.json(errorResponse, { 
        status: statusCode,
        headers: { "X-Request-ID": requestId }
      })
    }
  }
}

/**
 * Handle errors in route handlers (for use with try/catch)
 */
export function handleRouteError(error: unknown, requestId?: string): NextResponse {
  const id = requestId || generateRequestId()
  const errorResponse = createErrorResponse(error as Error, id)
  const statusCode = error instanceof ApiError ? error.statusCode : 500
  
  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers: { "X-Request-ID": id }
  })
}