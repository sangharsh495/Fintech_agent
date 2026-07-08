import { NextRequest, NextResponse } from "next/server"
import { generateOpenAPISpec, serveOpenAPISpec, apiInfo, RouteDefinition } from "@/server/lib/middleware/openapi"
import { commonSchemas } from "@/server/lib/middleware/validation"
import { z } from "zod"

/**
 * OpenAPI specification endpoint
 * GET /api/docs/openapi.json
 */

// Define all API routes for documentation
const routeDefinitions: RouteDefinition[] = [
  // Auth routes
  {
    path: "/api/auth/mobile-login",
    method: "POST",
    tags: ["Authentication"],
    summary: "Mobile login with email/phone",
    description: "Authenticate mobile user with email or phone number",
    auth: false,
    requestBody: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }),
    responses: {
      "200": { description: "OTP sent successfully", schema: z.object({ success: z.boolean(), message: z.string() }) },
      "400": { description: "Invalid request" },
      "429": { description: "Rate limited" },
    },
  },
  {
    path: "/api/auth/verify-otp",
    method: "POST",
    tags: ["Authentication"],
    summary: "Verify OTP and get session",
    description: "Verify OTP code and return session token",
    auth: false,
    requestBody: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      code: z.string().length(6),
    }),
    responses: {
      "200": { description: "Login successful", schema: z.object({ user: z.object({ id: z.string(), email: z.string() }), token: z.string() }) },
      "400": { description: "Invalid OTP" },
      "401": { description: "OTP expired or invalid" },
    },
  },

  // Dashboard routes
  {
    path: "/api/dashboard",
    method: "GET",
    tags: ["Dashboard"],
    summary: "Get dashboard overview",
    description: "Get user dashboard with accounts, recent transactions, and summary",
    auth: true,
    query: commonSchemas.pagination,
    responses: {
      "200": { description: "Dashboard data", schema: z.object({ accounts: z.array(z.any()), transactions: z.array(z.any()), summary: z.any() }) },
      "401": { description: "Unauthorized" },
    },
  },

  // Transaction routes
  {
    path: "/api/transactions",
    method: "GET",
    tags: ["Transactions"],
    summary: "List transactions",
    description: "Get paginated list of transactions with filtering",
    auth: true,
    query: commonSchemas.pagination.merge(commonSchemas.dateRange).extend({
      accountId: z.string().uuid().optional(),
      category: z.string().optional(),
      type: z.enum(["income", "expense"]).optional(),
      minAmount: z.coerce.number().optional(),
      maxAmount: z.coerce.number().optional(),
      search: z.string().optional(),
    }),
    responses: {
      "200": { description: "Transactions list", schema: z.object({ data: z.array(z.any()), pagination: z.any() }) },
      "401": { description: "Unauthorized" },
    },
  },
  {
    path: "/api/transactions",
    method: "POST",
    tags: ["Transactions"],
    summary: "Create transaction",
    description: "Create a new transaction manually",
    auth: true,
    requestBody: z.object({
      accountId: z.string().uuid(),
      amount: z.number().positive(),
      type: z.enum(["income", "expense"]),
      category: z.string(),
      description: z.string(),
      date: z.string().datetime(),
      notes: z.string().optional(),
    }),
    responses: {
      "201": { description: "Transaction created", schema: z.object({ id: z.string().uuid() }) },
      "400": { description: "Validation error" },
      "401": { description: "Unauthorized" },
    },
  },
  {
    path: "/api/transactions/{id}",
    method: "GET",
    tags: ["Transactions"],
    summary: "Get transaction",
    description: "Get a single transaction by ID",
    auth: true,
    params: z.object({ id: z.string().uuid() }),
    responses: {
      "200": { description: "Transaction details", schema: z.any() },
      "404": { description: "Not found" },
    },
  },
  {
    path: "/api/transactions/{id}",
    method: "PUT",
    tags: ["Transactions"],
    summary: "Update transaction",
    description: "Update an existing transaction",
    auth: true,
    params: z.object({ id: z.string().uuid() }),
    requestBody: z.object({
      amount: z.number().positive().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      date: z.string().datetime().optional(),
      notes: z.string().optional(),
    }),
    responses: {
      "200": { description: "Transaction updated" },
      "404": { description: "Not found" },
    },
  },
  {
    path: "/api/transactions/{id}",
    method: "DELETE",
    tags: ["Transactions"],
    summary: "Delete transaction",
    description: "Delete a transaction",
    auth: true,
    params: z.object({ id: z.string().uuid() }),
    responses: {
      "204": { description: "Transaction deleted" },
      "404": { description: "Not found" },
    },
  },

  // Analytics routes
  {
    path: "/api/analytics",
    method: "GET",
    tags: ["Analytics"],
    summary: "Get analytics",
    description: "Get spending analytics and insights",
    auth: true,
    query: commonSchemas.dateRange.extend({
      groupBy: z.enum(["category", "merchant", "account", "day", "week", "month"]).optional(),
    }),
    responses: {
      "200": { description: "Analytics data", schema: z.any() },
      "401": { description: "Unauthorized" },
    },
  },
  {
    path: "/api/analytics/clusters",
    method: "GET",
    tags: ["Analytics"],
    summary: "Get transaction clusters",
    description: "Get ML-based transaction clustering results",
    auth: true,
    responses: {
      "200": { description: "Cluster data", schema: z.any() },
      "401": { description: "Unauthorized" },
    },
  },

  // Banks routes
  {
    path: "/api/banks/supported",
    method: "GET",
    tags: ["Banks"],
    summary: "Get supported banks",
    description: "List all supported banks for statement parsing",
    auth: false,
    responses: {
      "200": { description: "Supported banks", schema: z.array(z.object({ id: z.string(), name: z.string(), logo: z.string().optional() })) },
    },
  },
  {
    path: "/api/banks",
    method: "GET",
    tags: ["Banks"],
    summary: "Get user bank accounts",
    description: "Get linked bank accounts for current user",
    auth: true,
    responses: {
      "200": { description: "Bank accounts", schema: z.array(z.any()) },
      "401": { description: "Unauthorized" },
    },
  },
  {
    path: "/api/banks",
    method: "POST",
    tags: ["Banks"],
    summary: "Link bank account",
    description: "Link a new bank account",
    auth: true,
    requestBody: z.object({
      bankId: z.string(),
      accountType: z.enum(["checking", "savings", "credit", "investment"]),
      accountNumber: z.string(),
      nickname: z.string().optional(),
    }),
    responses: {
      "201": { description: "Bank account linked", schema: z.object({ id: z.string().uuid() }) },
      "400": { description: "Validation error" },
      "401": { description: "Unauthorized" },
    },
  },

  // Upload routes
  {
    path: "/api/upload/statement",
    method: "POST",
    tags: ["Upload"],
    summary: "Upload bank statement",
    description: "Upload and parse bank statement (PDF/CSV/Excel)",
    auth: true,
    requestBody: z.object({
      file: z.instanceof(File),
      bankId: z.string(),
      accountId: z.string().uuid().optional(),
    }),
    responses: {
      "200": { description: "Statement parsed", schema: z.object({ transactions: z.array(z.any()), parsed: z.number(), duplicates: z.number() }) },
      "400": { description: "Invalid file or parsing failed" },
      "401": { description: "Unauthorized" },
      "413": { description: "File too large" },
      "415": { description: "Unsupported file type" },
    },
  },

  // Profile routes
  {
    path: "/api/profile",
    method: "GET",
    tags: ["Profile"],
    summary: "Get user profile",
    description: "Get current user profile information",
    auth: true,
    responses: {
      "200": { description: "User profile", schema: z.any() },
      "401": { description: "Unauthorized" },
    },
  },
  {
    path: "/api/profile",
    method: "PUT",
    tags: ["Profile"],
    summary: "Update user profile",
    description: "Update user profile information",
    auth: true,
    requestBody: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      currency: z.string().optional(),
      timezone: z.string().optional(),
      preferences: z.any().optional(),
    }),
    responses: {
      "200": { description: "Profile updated" },
      "400": { description: "Validation error" },
    },
  },

  // Tax routes
  {
    path: "/api/tax",
    method: "GET",
    tags: ["Tax"],
    summary: "Get tax summary",
    description: "Get tax-related transaction summary",
    auth: true,
    query: commonSchemas.dateRange,
    responses: {
      "200": { description: "Tax summary", schema: z.any() },
      "401": { description: "Unauthorized" },
    },
  },
  {
    path: "/api/tax/report",
    method: "GET",
    tags: ["Tax"],
    summary: "Generate tax report",
    description: "Generate detailed tax report (PDF/CSV)",
    auth: true,
    query: commonSchemas.dateRange.extend({
      format: z.enum(["pdf", "csv"]).default("pdf"),
    }),
    responses: {
      "200": { description: "Tax report file" },
      "401": { description: "Unauthorized" },
    },
  },

  // AI Chat routes
  {
    path: "/api/ai/chat",
    method: "POST",
    tags: ["AI"],
    summary: "Chat with AI assistant",
    description: "Send message to AI financial assistant",
    auth: true,
    requestBody: z.object({
      message: z.string().min(1).max(4000),
      context: z.any().optional(),
    }),
    responses: {
      "200": { description: "AI response", schema: z.object({ response: z.string(), suggestions: z.array(z.string()).optional() }) },
      "400": { description: "Invalid message" },
      "401": { description: "Unauthorized" },
      "429": { description: "Rate limited" },
    },
  },

  // Health routes
  {
    path: "/api/health",
    method: "GET",
    tags: ["System"],
    summary: "Liveness probe",
    description: "Basic health check for load balancers",
    auth: false,
    responses: {
      "200": { description: "Health status", schema: z.any() },
    },
  },
  {
    path: "/api/health/ready",
    method: "GET",
    tags: ["System"],
    summary: "Readiness probe",
    description: "Dependency health check for Kubernetes",
    auth: false,
    responses: {
      "200": { description: "Ready", schema: z.any() },
      "503": { description: "Not ready", schema: z.any() },
    },
  },
]

// Generate and cache the spec
let cachedSpec: ReturnType<typeof generateOpenAPISpec> | null = null

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!cachedSpec) {
    cachedSpec = generateOpenAPISpec(routeDefinitions, apiInfo)
  }
  
  return serveOpenAPISpec(cachedSpec)(req)
}