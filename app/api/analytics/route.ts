import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { transactions } from "@/server/db/schema"
import { eq, and, desc, gte, sum, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = req.nextUrl
  const bankId = searchParams.get("bankId")

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  try {
    const conditions = [eq(transactions.userId, userId), gte(transactions.date, sixMonthsAgo)]
    if (bankId && bankId !== "all") conditions.push(eq(transactions.bankAccountId, bankId))

    const [monthly, byCategory, totals] = await Promise.all([
      db.select({
        month: sql<string>`to_char(date, 'YYYY-MM')`,
        income: sql<number>`sum(case when type = 'credit' then amount::numeric else 0 end)`,
        expenses: sql<number>`sum(case when type = 'debit' then amount::numeric else 0 end)`,
        txnCount: sql<number>`count(*)`,
      }).from(transactions).where(and(...conditions))
        .groupBy(sql`to_char(date, 'YYYY-MM')`)
        .orderBy(sql`to_char(date, 'YYYY-MM')`),

      db.select({
        category: transactions.category,
        total: sum(transactions.amount),
        count: sql<number>`count(*)`,
      }).from(transactions).where(and(...conditions, eq(transactions.type, "debit")))
        .groupBy(transactions.category)
        .orderBy(desc(sum(transactions.amount))),

      db.select({
        totalIncome: sql<number>`sum(case when type = 'credit' then amount::numeric else 0 end)`,
        totalExpense: sql<number>`sum(case when type = 'debit' then amount::numeric else 0 end)`,
      }).from(transactions).where(and(...conditions)),
    ])

    const totalIncome = Number(totals[0]?.totalIncome || 0)
    const totalExpense = Number(totals[0]?.totalExpense || 0)

    return NextResponse.json({
      hasData: monthly.length > 0,
      monthly: monthly.map((m) => ({
        month: m.month,
        income: Number(m.income || 0),
        expenses: Number(m.expenses || 0),
        savings: Number(m.income || 0) - Number(m.expenses || 0),
        txnCount: Number(m.txnCount),
      })),
      categoryBreakdown: byCategory.map((c) => ({
        category: c.category,
        total: Number(c.total || 0),
        count: Number(c.count),
        percentage: totalExpense > 0 ? Math.round((Number(c.total || 0) / totalExpense) * 100) : 0,
      })),
      totals: {
        income: totalIncome, expenses: totalExpense,
        savings: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      },
    })
  } catch (error) {
    console.error("[ANALYTICS]", error)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
