import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  text,
  date,
} from "drizzle-orm/pg-core"
import { users } from "./users"

// ─── Monthly Summaries ──────────────────────────────────────
// Pre-aggregated monthly spending/income by category per user.
// Dashboard and Analytics pages MUST query this table, not raw transactions.

export const monthlySummaries = pgTable("monthly_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month", { length: 7 }).notNull(),  // "2025-07"
  category: varchar("category", { length: 64 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),    // "credit" | "debit"
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  txCount: integer("tx_count").notNull().default(0),
  avgAmount: decimal("avg_amount", { precision: 14, scale: 2 }).default("0"),
  minAmount: decimal("min_amount", { precision: 14, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Tax Summaries ──────────────────────────────────────────
// Pre-aggregated tax deduction/income totals by section per user per FY.
// Tax page MUST query this table for aggregate views.

export const taxSummaries = pgTable("tax_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fy: varchar("fy", { length: 10 }).notNull(),          // "2025-26"
  section: varchar("section", { length: 32 }).notNull(), // "80C", "80D", "salary", "rental_income"
  category: varchar("category", { length: 64 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),       // "credit" | "debit"
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  txCount: integer("tx_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Net Worth Snapshots ────────────────────────────────────
// Point-in-time balance snapshots per user. Dashboard "total balance" widget
// reads from this table, NOT from raw transactions.

export const netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  snapshotDate: date("snapshot_date").notNull(),
  totalBalance: decimal("total_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  bankBalances: text("bank_balances"), // JSON: [{ bankId, bankName, balance }]
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── User Goals ─────────────────────────────────────────────
// Financial goals per user, used by AI CA context builder.

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 14, scale: 2 }),
  currentAmount: decimal("current_amount", { precision: 14, scale: 2 }).default("0"),
  deadline: date("deadline"),
  category: varchar("category", { length: 64 }),
  priority: varchar("priority", { length: 16 }).default("medium"),
  status: varchar("status", { length: 16 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Types ──────────────────────────────────────────────────

export type MonthlySummary = typeof monthlySummaries.$inferSelect
export type NewMonthlySummary = typeof monthlySummaries.$inferInsert
export type TaxSummary = typeof taxSummaries.$inferSelect
export type NewTaxSummary = typeof taxSummaries.$inferInsert
export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect
export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert
