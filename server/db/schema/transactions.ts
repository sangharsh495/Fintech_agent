import { pgTable, uuid, varchar, decimal, timestamp, text, integer, boolean, real, pgEnum } from "drizzle-orm/pg-core"

// ─── Enums ──────────────────────────────────────────────────

export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"])

export const transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending", "failed"])

export const categoryEnum = pgEnum("category", [
  "salary",
  "freelance",
  "investment_return",
  "refund",
  "gift_received",
  "rental_income",
  "food_dining",
  "groceries",
  "transportation",
  "fuel",
  "utilities",
  "rent",
  "emi_loan",
  "insurance",
  "healthcare",
  "education",
  "entertainment",
  "shopping",
  "travel",
  "subscriptions",
  "personal_care",
  "charity",
  "miscellaneous",
  "transfer",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "neft",
  "imps",
  "credit_card",
  "debit_card",
  "cash",
  "net_banking",
  "wallet",
  "auto_debit",
  "cheque",
])

// ─── Main Transactions Table ────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  subcategory: varchar("subcategory", { length: 64 }),
  description: text("description"),
  merchant: varchar("merchant", { length: 128 }),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  date: timestamp("date").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun, 6=Sat
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  isRecurring: boolean("is_recurring").default(false),
  tags: text("tags"), // comma-separated tags
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }),

  // ── Bank / Upload references ──
  bankAccountId: uuid("bank_account_id"),          // FK → bankAccounts.id
  statementUploadId: uuid("statement_upload_id"),  // FK → statementUploads.id
  rawDescription: text("raw_description"),         // Original description before categorization
  hash: varchar("hash", { length: 64 }),           // SHA256(date+amount+rawDescription) for dedup

  // ── Cluster assignments (populated by ML service) ──
  spendingCluster: integer("spending_cluster"),    // Behavioral cluster ID
  sizeCluster: integer("size_cluster"),            // Transaction size cluster ID
  temporalCluster: integer("temporal_cluster"),    // Time-based pattern cluster ID
  categoryCluster: integer("category_cluster"),    // Category affinity cluster ID
  isAnomaly: boolean("is_anomaly").default(false), // Anomaly flag from DBSCAN
  anomalyScore: real("anomaly_score"),             // Anomaly confidence score

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Cluster Metadata (stores centroid info & stats per cluster) ───

export const clusterMetadata = pgTable("cluster_metadata", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  clusterType: varchar("cluster_type", { length: 32 }).notNull(), // spending_behavior | transaction_size | temporal | category_affinity
  clusterId: integer("cluster_id").notNull(),
  label: varchar("label", { length: 64 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull(), // hex color for UI
  centroid: text("centroid"),              // JSON string of centroid vector
  transactionCount: integer("transaction_count").default(0),
  totalAmount: real("total_amount").default(0),
  avgAmount: real("avg_amount").default(0),
  minAmount: real("min_amount"),
  maxAmount: real("max_amount"),
  dominantCategory: varchar("dominant_category", { length: 64 }),
  dominantPaymentMethod: varchar("dominant_payment_method", { length: 32 }),
  percentageOfTotal: real("percentage_of_total"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Cluster Run History (tracks when clustering was performed) ───

export const clusterRuns = pgTable("cluster_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  clusterType: varchar("cluster_type", { length: 32 }).notNull(),
  algorithm: varchar("algorithm", { length: 32 }).notNull(), // kmeans | dbscan | agglomerative
  nClusters: integer("n_clusters").notNull(),
  silhouetteScore: real("silhouette_score"),
  inertia: real("inertia"),
  totalTransactions: integer("total_transactions").notNull(),
  parameters: text("parameters"), // JSON of hyperparameters used
  status: varchar("status", { length: 16 }).default("completed"),
  runAt: timestamp("run_at").defaultNow().notNull(),
})

// ─── Types ──────────────────────────────────────────────────

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type ClusterMeta = typeof clusterMetadata.$inferSelect
export type ClusterRun = typeof clusterRuns.$inferSelect
