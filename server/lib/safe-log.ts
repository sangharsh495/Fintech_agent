/**
 * server/lib/safe-log.ts
 *
 * Log-safe hashing utility for FinFlow.
 *
 * Any account number, PAN, Aadhaar, IFSC, card number, or statement identifier
 * that could appear in application logs MUST be hashed before logging.
 *
 * This module provides:
 * - `safeLog()` wrapper that auto-hashes sensitive fields
 * - `hashSensitive()` for hashing individual values
 * - `redactObject()` for deep-redacting objects before logging
 *
 * Uses SHA-256, truncated to first 12 chars for readability in logs.
 */

import crypto from "crypto"
import { logger } from "@/server/lib/middleware/logger"

// ─── Sensitive Field Patterns ───────────────────────────────
// Fields matching these patterns will be auto-hashed in log output.

const SENSITIVE_FIELD_NAMES = new Set([
  "accountnumber",
  "account_number",
  "accountno",
  "account_no",
  "pan",
  "pannumber",
  "pan_number",
  "pancard",
  "aadhaar",
  "aadhaarnumber",
  "aadhaar_number",
  "aadhaarlast4",
  "aadhaar_last4",
  "ifsc",
  "ifsccode",
  "ifsc_code",
  "cardnumber",
  "card_number",
  "cvv",
  "ssn",
  "bankaccountnumber",
  "bank_account_number",
  "routingnumber",
  "routing_number",
  "swift",
  "swiftcode",
  "swift_code",
  "password",
  "passwordhash",
  "password_hash",
  "secret",
  "apikey",
  "api_key",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "otp",
  "statementid",
  "statement_id",
])

// Regex patterns for values that look like sensitive data
const SENSITIVE_VALUE_PATTERNS = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,            // PAN: ABCDE1234F
  /\b[0-9]{12}\b/,                           // Aadhaar: 12 digits
  /\b[0-9]{9,18}\b/,                         // Bank account numbers: 9-18 digits
  /\b[A-Z]{4}0[A-Z0-9]{6}\b/,              // IFSC: ABCD0123456
  /\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/, // Card numbers
]

// ─── Core Hashing Function ─────────────────────────────────

/**
 * Hash a sensitive value using SHA-256, truncated to 12 chars.
 * The truncation is intentional — these hashes are for log readability
 * and audit trails, NOT for security storage.
 */
export function hashSensitive(value: string): string {
  if (!value || typeof value !== "string") return "[EMPTY]"
  const hash = crypto.createHash("sha256").update(value).digest("hex")
  return `hash:${hash.substring(0, 12)}`
}

// ─── Field Name Check ───────────────────────────────────────

function isSensitiveField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase().replace(/[^a-z0-9_]/g, "")
  return SENSITIVE_FIELD_NAMES.has(normalized)
}

// ─── Value Pattern Check ────────────────────────────────────

function matchesSensitivePattern(value: string): boolean {
  if (typeof value !== "string") return false
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))
}

// ─── Deep Object Redaction ──────────────────────────────────

/**
 * Recursively redact sensitive fields from an object.
 * Returns a new object (does not mutate the original).
 */
export function redactObject(
  obj: unknown,
  depth = 0
): unknown {
  // Prevent infinite recursion
  if (depth > 10) return "[DEEP_NESTED]"

  if (obj === null || obj === undefined) return obj

  if (typeof obj === "string") {
    return matchesSensitivePattern(obj) ? hashSensitive(obj) : obj
  }

  if (typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1))
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isSensitiveField(key)) {
      redacted[key] = typeof value === "string" ? hashSensitive(value) : "[REDACTED]"
    } else if (typeof value === "string" && matchesSensitivePattern(value)) {
      redacted[key] = hashSensitive(value)
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactObject(value, depth + 1)
    } else {
      redacted[key] = value
    }
  }
  return redacted
}

// ─── safeLog() Wrapper ──────────────────────────────────────

type LogLevel = "info" | "warn" | "error" | "debug" | "trace" | "fatal"

/**
 * Safe logging wrapper that auto-hashes sensitive fields before logging.
 *
 * Usage:
 *   safeLog("info", "[UPLOAD]", { accountNumber: "1234567890", amount: 5000 })
 *   safeLog("error", "[AI CHAT]", error, { userId, panNumber: "ABCDE1234F" })
 */
export function safeLog(
  level: LogLevel,
  message: string,
  ...args: unknown[]
): void {
  const redactedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: redactObject(arg.message) as string,
        stack: arg.stack?.split("\n").slice(0, 5).join("\n"), // Limit stack depth
      }
    }
    return redactObject(arg)
  })

  // Use the pino logger with structured output
  if (redactedArgs.length === 1 && typeof redactedArgs[0] === "object") {
    logger[level](redactedArgs[0] as Record<string, unknown>, message)
  } else if (redactedArgs.length > 0) {
    logger[level]({ details: redactedArgs }, message)
  } else {
    logger[level](message)
  }
}

// ─── Convenience exports ────────────────────────────────────

export const safeLogInfo = (msg: string, ...args: unknown[]) => safeLog("info", msg, ...args)
export const safeLogWarn = (msg: string, ...args: unknown[]) => safeLog("warn", msg, ...args)
export const safeLogError = (msg: string, ...args: unknown[]) => safeLog("error", msg, ...args)
export const safeLogDebug = (msg: string, ...args: unknown[]) => safeLog("debug", msg, ...args)
