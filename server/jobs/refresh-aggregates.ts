/**
 * server/jobs/refresh-aggregates.ts
 *
 * Cron-triggered job that refreshes all aggregation tables from raw transactions.
 * Runs nightly via Render cron or triggered on new statement upload.
 *
 * Refreshes:
 * 1. monthly_summaries — per-user, per-month, per-category totals
 * 2. tax_summaries — per-user, per-FY, per-section deduction/income totals
 * 3. net_worth_snapshots — per-user daily balance snapshot
 *
 * Uses admin connection (no RLS) since this aggregates across all users.
 * This is the ONLY legitimate use of admin queries for user data.
 */

import { adminQuery } from "@/server/db/rls-connection"
import { safeLogInfo, safeLogError } from "@/server/lib/safe-log"

// ─── Tax Section Mapping ────────────────────────────────────
// Maps transaction categories to Indian IT Act sections for tax_summaries

const TAX_SECTION_MAP: Record<string, string> = {
  salary: "income",
  freelance: "income",
  rental_income: "income",
  investment_return: "income",
  gift_received: "income",
  refund: "income",
  insurance: "80C",
  education: "80C",
  charity: "80G",
  healthcare: "80D",
  emi_loan: "24b",
}

// ─── 1. Refresh Monthly Summaries ───────────────────────────

async function refreshMonthlySummaries(): Promise<number> {
  const result = await adminQuery(`
    INSERT INTO monthly_summaries (user_id, month, category, type, total_amount, tx_count, avg_amount, min_amount, max_amount, updated_at)
    SELECT
      user_id::uuid,
      to_char(date, 'YYYY-MM') AS month,
      category,
      type,
      SUM(amount::numeric),
      COUNT(*),
      AVG(amount::numeric),
      MIN(amount::numeric),
      MAX(amount::numeric),
      NOW()
    FROM transactions
    GROUP BY user_id, to_char(date, 'YYYY-MM'), category, type
    ON CONFLICT (user_id, month, category, type)
    DO UPDATE SET
      total_amount = EXCLUDED.total_amount,
      tx_count = EXCLUDED.tx_count,
      avg_amount = EXCLUDED.avg_amount,
      min_amount = EXCLUDED.min_amount,
      max_amount = EXCLUDED.max_amount,
      updated_at = NOW()
  `)
  return result.rowCount || 0
}

// ─── 2. Refresh Tax Summaries ───────────────────────────────

async function refreshTaxSummaries(): Promise<number> {
  // Build CASE expression for section mapping
  const whenClauses = Object.entries(TAX_SECTION_MAP)
    .map(([cat, section]) => `WHEN category = '${cat}' THEN '${section}'`)
    .join("\n      ")

  const result = await adminQuery(`
    INSERT INTO tax_summaries (user_id, fy, section, category, type, total_amount, tx_count, updated_at)
    SELECT
      user_id::uuid,
      CASE
        WHEN EXTRACT(MONTH FROM date) >= 4 THEN
          EXTRACT(YEAR FROM date)::text || '-' || (EXTRACT(YEAR FROM date) + 1)::text
        ELSE
          (EXTRACT(YEAR FROM date) - 1)::text || '-' || EXTRACT(YEAR FROM date)::text
      END AS fy,
      CASE
        ${whenClauses}
        ELSE 'other'
      END AS section,
      category,
      type,
      SUM(amount::numeric),
      COUNT(*),
      NOW()
    FROM transactions
    GROUP BY user_id, fy, section, category, type
    ON CONFLICT (user_id, fy, section, category, type)
    DO UPDATE SET
      total_amount = EXCLUDED.total_amount,
      tx_count = EXCLUDED.tx_count,
      updated_at = NOW()
  `)
  return result.rowCount || 0
}

// ─── 3. Refresh Net Worth Snapshots ─────────────────────────

async function refreshNetWorthSnapshots(): Promise<number> {
  const result = await adminQuery(`
    INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_balance, bank_balances)
    SELECT
      t.user_id::uuid,
      CURRENT_DATE,
      SUM(latest_balance.balance),
      json_agg(json_build_object(
        'bankId', ba.id,
        'bankName', ba.bank_name,
        'balance', latest_balance.balance
      ))::text
    FROM bank_accounts ba
    JOIN LATERAL (
      SELECT balance_after::numeric AS balance
      FROM transactions
      WHERE bank_account_id = ba.id AND user_id = ba.user_id::text
      ORDER BY date DESC
      LIMIT 1
    ) latest_balance ON true
    JOIN transactions t ON t.bank_account_id = ba.id
    WHERE ba.is_active = true
    GROUP BY t.user_id
    ON CONFLICT (user_id, snapshot_date)
    DO UPDATE SET
      total_balance = EXCLUDED.total_balance,
      bank_balances = EXCLUDED.bank_balances
  `)
  return result.rowCount || 0
}

// ─── Main: Run All Refreshes ────────────────────────────────

export async function refreshAllAggregates(): Promise<{
  monthlySummaries: number
  taxSummaries: number
  netWorthSnapshots: number
  durationMs: number
}> {
  const start = Date.now()

  safeLogInfo("[AGGREGATION JOB] Starting aggregate refresh...")

  try {
    const [monthlySummaries, taxSummaries, netWorthSnapshots] = await Promise.all([
      refreshMonthlySummaries(),
      refreshTaxSummaries(),
      refreshNetWorthSnapshots(),
    ])

    const durationMs = Date.now() - start

    safeLogInfo("[AGGREGATION JOB] Refresh complete", {
      monthlySummaries,
      taxSummaries,
      netWorthSnapshots,
      durationMs,
    })

    return { monthlySummaries, taxSummaries, netWorthSnapshots, durationMs }
  } catch (error) {
    safeLogError("[AGGREGATION JOB] Refresh failed", error)
    throw error
  }
}

// ─── Per-User Refresh (triggered after upload) ──────────────

export async function refreshUserAggregates(userId: string): Promise<void> {
  safeLogInfo("[AGGREGATION JOB] Refreshing aggregates for user", { userId })

  // For per-user refresh, we use admin query but filter by userId
  // This is safe because it's called from authenticated endpoints only
  await adminQuery(`
    INSERT INTO monthly_summaries (user_id, month, category, type, total_amount, tx_count, avg_amount, min_amount, max_amount, updated_at)
    SELECT
      user_id::uuid, to_char(date, 'YYYY-MM'), category, type,
      SUM(amount::numeric), COUNT(*), AVG(amount::numeric), MIN(amount::numeric), MAX(amount::numeric), NOW()
    FROM transactions
    WHERE user_id = $1
    GROUP BY user_id, to_char(date, 'YYYY-MM'), category, type
    ON CONFLICT (user_id, month, category, type)
    DO UPDATE SET
      total_amount = EXCLUDED.total_amount, tx_count = EXCLUDED.tx_count,
      avg_amount = EXCLUDED.avg_amount, min_amount = EXCLUDED.min_amount,
      max_amount = EXCLUDED.max_amount, updated_at = NOW()
  `, [userId])

  safeLogInfo("[AGGREGATION JOB] User aggregates refreshed", { userId })
}
