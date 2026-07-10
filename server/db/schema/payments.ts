import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core"
import { users } from "./users"

// ─── Payments ───────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique(),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }).unique(),
  status: varchar("status", { length: 64 }).notNull(),
  processedAt: timestamp("processed_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Subscriptions ──────────────────────────────────────────

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type UserSubscription = typeof userSubscriptions.$inferSelect
export type NewUserSubscription = typeof userSubscriptions.$inferInsert
