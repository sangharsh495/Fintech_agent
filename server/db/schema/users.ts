import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  integer,
  text,
  date,
} from "drizzle-orm/pg-core"

// ─── Enums ──────────────────────────────────────────────────

export const genderEnum = pgEnum("gender", ["male", "female", "other", "prefer_not_to_say"])

export const incomeBracketEnum = pgEnum("income_bracket", [
  "below_3l",
  "3l_5l",
  "5l_10l",
  "10l_25l",
  "above_25l",
])

export const taxRegimeEnum = pgEnum("tax_regime", ["old", "new"])

export const accountTypeEnum = pgEnum("account_type", ["savings", "current", "salary"])

export const fileTypeEnum = pgEnum("file_type", ["pdf", "xlsx", "csv"])

export const processingStatusEnum = pgEnum("processing_status", [
  "pending",
  "processing",
  "completed",
  "failed",
])

// ─── Users ──────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  name: varchar("name", { length: 128 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  image: varchar("image", { length: 512 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── NextAuth Tables ────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 }),
})

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
})

// ─── OTP Verifications ──────────────────────────────────────

export const otpVerifications = pgTable("otp_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── TOTP & Backup Codes ────────────────────────────────────

export const userTotpSecrets = pgTable("user_totp_secrets", {
  userId: uuid("user_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: varchar("secret", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
})

export const user2faBackupCodes = pgTable("user_2fa_backup_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 255 }).notNull(),
  used: boolean("used").default(false).notNull(),
})

// ─── User Profiles ──────────────────────────────────────────

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  dob: date("dob"),
  gender: genderEnum("gender"),
  occupation: varchar("occupation", { length: 128 }),
  incomeBracket: incomeBracketEnum("income_bracket"),
  panNumber: varchar("pan_number", { length: 10 }),
  aadhaarLast4: varchar("aadhaar_last4", { length: 4 }),
  city: varchar("city", { length: 64 }),
  state: varchar("state", { length: 64 }),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  taxRegime: taxRegimeEnum("tax_regime").default("new").notNull(),
  // Permissions / Consent
  consentDataProcessing: boolean("consent_data_processing").default(false),
  consentMLAnalytics: boolean("consent_ml_analytics").default(false),
  consentAIAssistant: boolean("consent_ai_assistant").default(false),
  consentMarketing: boolean("consent_marketing").default(false),
  preferences: text("preferences"), // JSON stringified preferences (jsonb not available in all Neon versions by default without casting, text is safer for simple JSON)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Bank Accounts ──────────────────────────────────────────

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 64 }).notNull(),
  accountNickname: varchar("account_nickname", { length: 128 }),
  accountLast4: varchar("account_last4", { length: 4 }),
  accountType: accountTypeEnum("account_type").default("savings").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Statement Uploads ──────────────────────────────────────

export const statementUploads = pgTable("statement_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  s3Key: varchar("s3_key", { length: 512 }),
  fileSize: integer("file_size"),
  statementMonth: varchar("statement_month", { length: 7 }), // "2025-03"
  statementYear: integer("statement_year"),
  processingStatus: processingStatusEnum("processing_status").default("pending").notNull(),
  transactionsExtracted: integer("transactions_extracted").default(0),
  transactionsDuplicate: integer("transactions_duplicate").default(0),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Types ──────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
export type BankAccount = typeof bankAccounts.$inferSelect
export type NewBankAccount = typeof bankAccounts.$inferInsert
export type StatementUpload = typeof statementUploads.$inferSelect
export type NewStatementUpload = typeof statementUploads.$inferInsert
export type OtpVerification = typeof otpVerifications.$inferSelect
export type UserTotpSecret = typeof userTotpSecrets.$inferSelect
export type User2faBackupCode = typeof user2faBackupCodes.$inferSelect
