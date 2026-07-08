import { z } from "zod"
import type { NextRequest, NextResponse } from "next/server"
import { ApiError, ErrorCodes } from "./error-handler"

/**
 * Industry-standard request validation middleware
 * Provides centralized validation with Zod schemas
 */

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string
  message: string
  code: string
  received?: unknown
}

/**
 * Parse and validate request body against schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
        received: err.received,
      }))
      
      throw ApiError.validationError("Request body validation failed", {
        validationErrors: details,
      })
    }
    throw error
  }
}

/**
 * Parse and validate query parameters against schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    const searchParams = req.nextUrl.searchParams
    const query: Record<string, string | string[]> = {}
    
    searchParams.forEach((value, key) => {
      const existing = query[key]
      if (existing === undefined) {
        query[key] = value
      } else if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        query[key] = [existing, value]
      }
    })
    
    return schema.parse(query)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
        received: err.received,
      }))
      
      throw ApiError.validationError("Query parameter validation failed", {
        validationErrors: details,
      })
    }
    throw error
  }
}

/**
 * Parse and validate route parameters against schema
 */
export function validateParams<T>(
  params: Promise<Record<string, string>> | Record<string, string>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
        received: err.received,
      }))
      
      throw ApiError.validationError("Route parameter validation failed", {
        validationErrors: details,
      })
    }
    throw error
  }
}

/**
 * Parse and validate headers against schema
 */
export function validateHeaders<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    return schema.parse(headers)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
        received: err.received,
      }))
      
      throw ApiError.validationError("Header validation failed", {
        validationErrors: details,
      })
    }
    throw error
  }
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => 
        typeof item === "string" ? sanitizeInput(item) : 
        typeof item === "object" && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}

/**
 * Create validation middleware for a route
 */
export function createValidationMiddleware<TBody, TQuery, TParams>(
  schemas: {
    body?: z.ZodSchema<TBody>
    query?: z.ZodSchema<TQuery>
    params?: z.ZodSchema<TParams>
  }
) {
  return async (
    req: NextRequest,
    params?: Promise<Record<string, string>> | Record<string, string>
  ): Promise<{
    body?: TBody
    query?: TQuery
    params?: TParams
  }> => {
    const result: {
      body?: TBody
      query?: TQuery
      params?: TParams
    } = {}

    if (schemas.body) {
      result.body = await validateBody(req, schemas.body)
    }

    if (schemas.query) {
      result.query = validateQuery(req, schemas.query)
    }

    if (schemas.params && params) {
      const resolvedParams = params instanceof Promise ? await params : params
      result.params = validateParams(resolvedParams, schemas.params)
    }

    return result
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid("Invalid ID format"),
  }),

  // Email
  email: z.string().email("Invalid email format"),

  // Phone (Indian format)
  phone: z.string().regex(/^(\+91|91)?[6-9]\d{9}$/, "Invalid Indian phone number"),

  // Amount (positive decimal)
  amount: z.number().positive("Amount must be positive").finite(),

  // UUID
  uuid: z.string().uuid("Invalid UUID format"),
}

/**
 * Validation middleware wrapper for Next.js App Router
 */
export function withValidation<TBody, TQuery, TParams>(
  handler: (
    req: NextRequest,
    validated: {
      body?: TBody
      query?: TQuery
      params?: TParams
    }
  ) => Promise<NextResponse>,
  schemas: {
    body?: z.ZodSchema<TBody>
    query?: z.ZodSchema<TQuery>
    params?: z.ZodSchema<TParams>
  }
) {
  const validationMiddleware = createValidationMiddleware(schemas)
  
  return async (
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    const validated = await validationMiddleware(req, context?.params)
    return handler(req, validated)
  }
}