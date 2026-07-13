import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { monthlySummaries } from "@/server/db/schema"
import { eq, and, gte, sum, sql, desc } from "drizzle-orm"
import { safeLogError } from "@/server/lib/safe-log"

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  // Calculate 6 months ago in YYYY-MM format
  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}`

  return withUserScopedDb(userId, async (db) => {
    try {
      // ── ALL READS FROM AGGREGATED monthly_summaries TABLE ──

      // Monthly trends (time-bucketed from monthly_summaries, NOT raw scans)
      const monthlyTrends = await db
        .select({
          month: monthlySummaries.month,
          type: monthlySummaries.type,
          total: sum(monthlySummaries.totalAmount),
          txnCount: sum(monthlySummaries.txCount),
        })
        .from(monthlySummaries)
        .where(
          and(
            eq(monthlySummaries.userId, userId),
            gte(monthlySummaries.month, sixMonthsAgoStr)
          )
        )
        .groupBy(monthlySummaries.month, monthlySummaries.type)
        .orderBy(monthlySummaries.month)

      // Pivot monthly trends into income/expense pairs
      const monthMap = new Map<string, { income: number; expenses: number; txnCount: number }>()
      for (const row of monthlyTrends) {
        const existing = monthMap.get(row.month) || { income: 0, expenses: 0, txnCount: 0 }
        if (row.type === "credit") {
          existing.income = Number(row.total || 0)
        } else {
          existing.expenses = Number(row.total || 0)
        }
        existing.txnCount += Number(row.txnCount || 0)
        monthMap.set(row.month, existing)
      }

      const monthly = Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          income: data.income,
          expenses: data.expenses,
          savings: data.income - data.expenses,
          txnCount: data.txnCount,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Category breakdown (from monthly_summaries, NOT raw scans)
      const byCategory = await db
        .select({
          category: monthlySummaries.category,
          total: sum(monthlySummaries.totalAmount),
          count: sum(monthlySummaries.txCount),
        })
        .from(monthlySummaries)
        .where(
          and(
            eq(monthlySummaries.userId, userId),
            eq(monthlySummaries.type, "debit"),
            gte(monthlySummaries.month, sixMonthsAgoStr)
          )
        )
        .groupBy(monthlySummaries.category)
        .orderBy(desc(sum(monthlySummaries.totalAmount)))

      // Totals
      const totalIncome = monthly.reduce((s, m) => s + m.income, 0)
      const totalExpense = monthly.reduce((s, m) => s + m.expenses, 0)

      // ── ANOMALY DETECTION: current month vs rolling N-month average ──
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const currentMonthData = monthly.find((m) => m.month === currentMonth)
      const previousMonths = monthly.filter((m) => m.month !== currentMonth)
      const avgMonthlyExpense = previousMonths.length > 0
        ? previousMonths.reduce((s, m) => s + m.expenses, 0) / previousMonths.length
        : 0

      const anomalies: Array<{ type: string; message: string; severity: string }> = []
      if (currentMonthData && avgMonthlyExpense > 0) {
        const deviationPercent = ((currentMonthData.expenses - avgMonthlyExpense) / avgMonthlyExpense) * 100
        if (deviationPercent > 50) {
          anomalies.push({
            type: "spending_spike",
            message: `This month's spending is ${Math.round(deviationPercent)}% higher than your ${previousMonths.length}-month average.`,
            severity: deviationPercent > 100 ? "high" : "medium",
          })
        } else if (deviationPercent < -30) {
          anomalies.push({
            type: "spending_drop",
            message: `This month's spending is ${Math.abs(Math.round(deviationPercent))}% lower than usual.`,
            severity: "low",
          })
        }
      }

      return NextResponse.json({
        hasData: monthly.length > 0,
        monthly,
        categoryBreakdown: byCategory.map((c) => ({
          category: c.category,
          total: Number(c.total || 0),
          count: Number(c.count || 0),
          percentage: totalExpense > 0 ? Math.round((Number(c.total || 0) / totalExpense) * 100) : 0,
        })),
        totals: {
          income: totalIncome, expenses: totalExpense,
          savings: totalIncome - totalExpense,
          savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
        },
        anomalies,
      })
    } catch (error) {
      safeLogError("[ANALYTICS]", error)
      return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
    }
  })
}
