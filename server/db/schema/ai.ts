import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core"
import { users } from "./users"

// ─── Enums ──────────────────────────────────────────────────

export const aiModelProviderEnum = pgEnum("ai_model_provider", [
  "oracle_cloud",
  "groq",
  "fallback",
])

export const aiPageEnum = pgEnum("ai_page", [
  "/",
  "/analytics",
  "/calculators",
  "/tax",
  "/upload",
  "/onboarding",
  "/settings",
])

export const aiContextTypeEnum = pgEnum("ai_context_type", [
  "profile",
  "transactions",
  "analytics",
  "ml-clusters",
  "tax",
  "documents",
  "summary",
  "full-context",
])

export const chatRoleEnum = pgEnum("chat_role", [
  "user",
  "assistant",
  "system",
])

// ─── AI Chat Logs (per-user usage tracking) ─────────────────

export const aiChatLogs = pgTable("ai_chat_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  page: aiPageEnum("page").notNull(),
  contextTypes: jsonb("context_types").$type<string[]>().default([]),
  modelProvider: aiModelProviderEnum("model_provider").notNull(),
  modelName: varchar("model_name", { length: 128 }).notNull(),
  messagesCount: integer("messages_count").default(0).notNull(),
  tokensUsed: integer("tokens_used").default(0),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  costEstimated: varchar("cost_estimated", { length: 32 }),
  userMessage: text("user_message"),
  assistantMessage: text("assistant_message"),
  responseTimeMs: integer("response_time_ms"),
  isError: boolean("is_error").default(false),
  errorMessage: text("error_message"),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── AI Access Policies (per-user page-level access control) ─

export const aiAccessPolicies = pgTable("ai_access_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  allowedPages: jsonb("allowed_pages").$type<string[]>().default([
    "/",
    "/analytics",
    "/calculators",
    "/tax",
    "/upload",
    "/onboarding",
  ]),
  allowedContextTypes: jsonb("allowed_context_types").$type<string[]>().default([
    "profile",
    "transactions",
    "analytics",
    "ml-clusters",
    "tax",
    "documents",
    "summary",
    "full-context",
  ]),
  maxTokensPerRequest: integer("max_tokens_per_request").default(4096),
  maxDailyRequests: integer("max_daily_requests").default(50),
  maxDailyTokens: integer("max_daily_tokens").default(50000),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  rateLimitMessage: varchar("rate_limit_message", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 32 }).default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── AI Audit Log (Phase 5: security audit trail) ───────────
// Logs EVERY AI call with context HASH (not raw content) for compliance.
// Used for anomaly detection, billing, and security reviews.

export const aiAuditLog = pgTable("ai_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id"),  // FK to chat_sessions (nullable for one-off chats)
  contextHash: varchar("context_hash", { length: 64 }).notNull(), // SHA-256 of system prompt (NOT raw content)
  inputTokenCount: integer("input_token_count").default(0),
  outputTokenCount: integer("output_token_count").default(0),
  outputSummary: varchar("output_summary", { length: 255 }), // First 255 chars of response (truncated)
  modelUsed: varchar("model_used", { length: 128 }).notNull(),
  modelProvider: varchar("model_provider", { length: 32 }).notNull(),
  latencyMs: integer("latency_ms"),
  pageContext: varchar("page_context", { length: 64 }),
  isError: boolean("is_error").default(false),
  errorType: varchar("error_type", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Chat Sessions (Phase 6: persistent chat history) ───────
// Each session represents a conversation thread. user_id is redundant
// (also on chat_messages) for direct RLS policy enforcement.

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default("New Chat"),
  pageContext: varchar("page_context", { length: 64 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Chat Messages (Phase 6: persistent message history) ────
// Stores every message in a chat session. user_id on each message
// enables direct RLS without a JOIN to chat_sessions.

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Types ──────────────────────────────────────────────────

export type AiChatLog = typeof aiChatLogs.$inferSelect
export type NewAiChatLog = typeof aiChatLogs.$inferInsert
export type AiAccessPolicy = typeof aiAccessPolicies.$inferSelect
export type NewAiAccessPolicy = typeof aiAccessPolicies.$inferInsert
export type AiAuditLog = typeof aiAuditLog.$inferSelect
export type NewAiAuditLog = typeof aiAuditLog.$inferInsert
export type ChatSession = typeof chatSessions.$inferSelect
export type NewChatSession = typeof chatSessions.$inferInsert
export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert