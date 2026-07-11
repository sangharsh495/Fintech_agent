-- AI Chat Logs & Access Control Migration
-- FinFlow v2: Oracle Cloud AI integration with per-user page-level access control

-- Enums for AI feature tracking
CREATE TYPE "public"."ai_model_provider" AS ENUM('oracle_cloud', 'groq', 'fallback');--> statement-breakpoint
CREATE TYPE "public"."ai_page" AS ENUM('/', '/analytics', '/calculators', '/tax', '/upload', '/onboarding', '/settings');--> statement-breakpoint
CREATE TYPE "public"."ai_context_type" AS ENUM('profile', 'transactions', 'analytics', 'ml-clusters', 'tax', 'documents', 'summary', 'full-context');--> statement-breakpoint

-- AI Chat Logs: tracks every AI interaction per user for auditing and rate limiting
CREATE TABLE "ai_chat_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "page" "ai_page" NOT NULL,
  "context_types" jsonb DEFAULT '[]'::jsonb,
  "model_provider" "ai_model_provider" NOT NULL,
  "model_name" varchar(128) NOT NULL,
  "messages_count" integer DEFAULT 0 NOT NULL,
  "tokens_used" integer DEFAULT 0,
  "prompt_tokens" integer DEFAULT 0,
  "completion_tokens" integer DEFAULT 0,
  "cost_estimated" varchar(32),
  "user_message" text,
  "assistant_message" text,
  "response_time_ms" integer,
  "is_error" boolean DEFAULT false,
  "error_message" text,
  "ip_address" varchar(64),
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- AI Access Policies: per-user page-level access and rate limiting
CREATE TABLE "ai_access_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "allowed_pages" jsonb DEFAULT '["/", "/analytics", "/calculators", "/tax", "/upload", "/onboarding"]'::jsonb,
  "allowed_context_types" jsonb DEFAULT '["profile", "transactions", "analytics", "ml-clusters", "tax", "documents", "summary", "full-context"]'::jsonb,
  "max_tokens_per_request" integer DEFAULT 4096,
  "max_daily_requests" integer DEFAULT 50,
  "max_daily_tokens" integer DEFAULT 50000,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "rate_limit_message" varchar(255),
  "subscription_tier" varchar(32) DEFAULT 'free',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_access_policies_user_id_unique" UNIQUE("user_id")
);--> statement-breakpoint

-- Foreign key constraints
ALTER TABLE "ai_chat_logs" ADD CONSTRAINT "ai_chat_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_access_policies" ADD CONSTRAINT "ai_access_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Create indexes for efficient querying
CREATE INDEX "idx_ai_chat_logs_user_id" ON "ai_chat_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_logs_created_at" ON "ai_chat_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_logs_user_page" ON "ai_chat_logs" ("user_id", "page", "created_at");--> statement-breakpoint