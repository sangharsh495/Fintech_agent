import { db } from "@/server/db"
import { transactions, bankAccounts, userProfiles } from "@/server/db/schema"
import { eq, and, desc, gte, sum, sql } from "drizzle-orm"

export async function buildUserContext(userId: string): Promise<string> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  try {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
    const banks = await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId))

    const monthly = await db.select({
      month: sql<string>`to_char(date, 'YYYY-MM')`,
      income: sql<number>`sum(case when type = 'credit' then amount::numeric else 0 end)`,
      expenses: sql<number>`sum(case when type = 'debit' then amount::numeric else 0 end)`,
    }).from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, threeMonthsAgo)))
      .groupBy(sql`to_char(date, 'YYYY-MM')`).orderBy(sql`to_char(date, 'YYYY-MM')`)

    const categories = await db.select({
      category: transactions.category,
      total: sum(transactions.amount),
    }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "debit"), gte(transactions.date, threeMonthsAgo)))
      .groupBy(transactions.category).orderBy(desc(sum(transactions.amount))).limit(5)

    const bankNames = banks.map((b) => `${b.bankName} (${b.accountNickname || b.accountType})`).join(", ")
    const avgIncome = monthly.length ? monthly.reduce((s, m) => s + Number(m.income || 0), 0) / monthly.length : 0
    const avgExpense = monthly.length ? monthly.reduce((s, m) => s + Number(m.expenses || 0), 0) / monthly.length : 0
    const savingsRate = avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100) : 0

    const topCategories = categories.map((c) =>
      `${c.category}: ₹${Math.round(Number(c.total || 0)).toLocaleString("en-IN")}`
    ).join(", ")

    const monthlyTrends = monthly.map((m) =>
      `${m.month}: Income ₹${Math.round(Number(m.income || 0)).toLocaleString("en-IN")}, Expenses ₹${Math.round(Number(m.expenses || 0)).toLocaleString("en-IN")}`
    ).join("\n")

    return `
USER FINANCIAL PROFILE (Private — this user only):
- Bank accounts: ${banks.length} (${bankNames || "none linked"})
- Tax regime: ${profile?.taxRegime || "new"} regime
- Income bracket: ${profile?.incomeBracket || "not specified"}
- Occupation: ${profile?.occupation || "not specified"}

LAST 3 MONTHS FINANCIAL DATA:
- Average monthly income: ₹${Math.round(avgIncome).toLocaleString("en-IN")}
- Average monthly expenses: ₹${Math.round(avgExpense).toLocaleString("en-IN")}
- Average savings: ₹${Math.round(avgIncome - avgExpense).toLocaleString("en-IN")} (${savingsRate}% savings rate)

TOP SPENDING CATEGORIES (last 3 months):
${topCategories || "No data available"}

MONTHLY TRENDS:
${monthlyTrends || "No data available"}

IMPORTANT: Only discuss this user's own financial data. Never reference other users.
`.trim()
  } catch {
    return "User financial data unavailable. Please ask them to upload bank statements first."
  }
}
