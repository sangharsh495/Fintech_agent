CREATE TYPE "public"."category" AS ENUM('salary', 'freelance', 'investment_return', 'refund', 'gift_received', 'rental_income', 'food_dining', 'groceries', 'transportation', 'fuel', 'utilities', 'rent', 'emi_loan', 'insurance', 'healthcare', 'education', 'entertainment', 'shopping', 'travel', 'subscriptions', 'personal_care', 'charity', 'miscellaneous', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('upi', 'neft', 'imps', 'credit_card', 'debit_card', 'cash', 'net_banking', 'wallet', 'auto_debit', 'cheque');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('completed', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('savings', 'current', 'salary');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('pdf', 'xlsx', 'csv');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."income_bracket" AS ENUM('below_3l', '3l_5l', '5l_10l', '10l_25l', 'above_25l');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tax_regime" AS ENUM('old', 'new');--> statement-breakpoint
CREATE TABLE "cluster_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_type" varchar(32) NOT NULL,
	"cluster_id" integer NOT NULL,
	"label" varchar(64) NOT NULL,
	"description" text,
	"color" varchar(7) NOT NULL,
	"centroid" text,
	"transaction_count" integer DEFAULT 0,
	"total_amount" real DEFAULT 0,
	"avg_amount" real DEFAULT 0,
	"min_amount" real,
	"max_amount" real,
	"dominant_category" varchar(64),
	"dominant_payment_method" varchar(32),
	"percentage_of_total" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cluster_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_type" varchar(32) NOT NULL,
	"algorithm" varchar(32) NOT NULL,
	"n_clusters" integer NOT NULL,
	"silhouette_score" real,
	"inertia" real,
	"total_transactions" integer NOT NULL,
	"parameters" text,
	"status" varchar(16) DEFAULT 'completed',
	"run_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" varchar(64) NOT NULL,
	"subcategory" varchar(64),
	"description" text,
	"merchant" varchar(128),
	"payment_method" varchar(32) NOT NULL,
	"status" "transaction_status" DEFAULT 'completed' NOT NULL,
	"date" timestamp NOT NULL,
	"day_of_week" integer NOT NULL,
	"hour_of_day" integer NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"tags" text,
	"balance_after" numeric(12, 2),
	"bank_account_id" uuid,
	"statement_upload_id" uuid,
	"raw_description" text,
	"hash" varchar(64),
	"spending_cluster" integer,
	"size_cluster" integer,
	"temporal_cluster" integer,
	"category_cluster" integer,
	"is_anomaly" boolean DEFAULT false,
	"anomaly_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bank_name" varchar(64) NOT NULL,
	"account_nickname" varchar(128),
	"account_last4" varchar(4),
	"account_type" "account_type" DEFAULT 'savings' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "statement_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" "file_type" NOT NULL,
	"s3_key" varchar(512),
	"file_size" integer,
	"statement_month" varchar(7),
	"statement_year" integer,
	"processing_status" "processing_status" DEFAULT 'pending' NOT NULL,
	"transactions_extracted" integer DEFAULT 0,
	"transactions_duplicate" integer DEFAULT 0,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_2fa_backup_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(255) NOT NULL,
	"used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dob" date,
	"gender" "gender",
	"occupation" varchar(128),
	"income_bracket" "income_bracket",
	"pan_number" varchar(10),
	"aadhaar_last4" varchar(4),
	"city" varchar(64),
	"state" varchar(64),
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"tax_regime" "tax_regime" DEFAULT 'new' NOT NULL,
	"consent_data_processing" boolean DEFAULT false,
	"consent_ml_analytics" boolean DEFAULT false,
	"consent_ai_assistant" boolean DEFAULT false,
	"consent_marketing" boolean DEFAULT false,
	"preferences" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_totp_secrets" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"secret" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"name" varchar(128),
	"password_hash" varchar(255),
	"phone" varchar(20),
	"image" varchar(512),
	"stripe_customer_id" varchar(255),
	"stripe_payment_method_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"status" varchar(64) NOT NULL,
	"processed_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payments_stripe_charge_id_unique" UNIQUE("stripe_charge_id")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" varchar(255) NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"status" varchar(64) NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_uploads" ADD CONSTRAINT "statement_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_uploads" ADD CONSTRAINT "statement_uploads_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_2fa_backup_codes" ADD CONSTRAINT "user_2fa_backup_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_totp_secrets" ADD CONSTRAINT "user_totp_secrets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;