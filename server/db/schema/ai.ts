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

// ─── Types ──────────────────────────────────────────────────

export type AiChatLog = typeof aiChatLogs.$inferSelect
export type NewAiChatLog = typeof aiChatLogs.$inferInsert
export type AiAccessPolicy = typeof aiAccessPolicies.$inferSelect
export type NewAiAccessPolicy = typeof aiAccessPolicies.$inferInsert