import { db } from "@/server/db"
import { transactions, bankAccounts, userProfiles } from "@/server/db/schema"
import { eq, and, desc, gte, lte, sum, sql } from "drizzle-orm"

const OLD_REGIME = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
]

const NEW_REGIME = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 0.05 },
  { min: 600000, max: 900000, rate: 0.10 },
  { min: 900000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
]

function calcTax(income: number, slabs: typeof OLD_REGIME): number {
  let tax = 0
  for (const slab of slabs) {
    if (income <= slab.min) break
    tax += (Math.min(income, slab.max) - slab.min) * slab.rate
  }
  return tax * 1.04 // 4% cess
}

export async function buildUserContext(userId: string): Promise<string> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Current financial year (rough approximation for context)
  const currentYear = new Date().getFullYear()
  const fyStart = new Date(`${currentYear}-04-01`)
  const fyEnd = new Date(`${currentYear + 1}-03-31`)

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

    const [incomeResult, insuranceResult] = await Promise.all([
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(eq(transactions.userId, userId), eq(transactions.type, "credit"), eq(transactions.category, "salary"), gte(transactions.date, fyStart), lte(transactions.date, fyEnd))
      ),
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(eq(transactions.userId, userId), eq(transactions.type, "debit"), eq(transactions.category, "insurance"), gte(transactions.date, fyStart), lte(transactions.date, fyEnd))
      ),
    ])

    const grossIncome = parseFloat(incomeResult[0]?.total || "0")
    const deduction80C = Math.min(parseFloat(insuranceResult[0]?.total || "0"), 150000)
    const standardNew = 75000
    const taxPayable = calcTax(Math.max(0, grossIncome - standardNew), NEW_REGIME)

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
- Preferences: ${profile?.preferences || "default"}

TAX ESTIMATION (Current FY):
- Detected Salary (Gross): ₹${Math.round(grossIncome).toLocaleString("en-IN")}
- Detected 80C Deductions (Insurance/ELSS): ₹${Math.round(deduction80C).toLocaleString("en-IN")}
- Estimated Tax Payable (New Regime): ₹${Math.round(taxPayable).toLocaleString("en-IN")}

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
