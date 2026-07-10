import { db } from "@/server/db"
import { transactions, bankAccounts, userProfiles } from "@/server/db/schema"
import { eq, and, desc, gte, lte, sum, sql } from "drizzle-orm"

// Slabs for tax calculation (identical to tax route)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
]

const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 0.05 },
  { min: 600000, max: 900000, rate: 0.10 },
  { min: 900000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
]

function calcTax(income: number, slabs: typeof OLD_REGIME_SLABS): number {
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

  const currentYear = new Date().getFullYear()
  const fyStart = new Date(`${currentYear}-04-01`)
  const fyEnd = new Date(`${currentYear + 1}-03-31`)

  try {
    // 1. Fetch profile and bank details with strict user isolation filters
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
    const banks = await db.select().from(bankAccounts).where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)))

    // 2. Fetch income and insurance deductions for current financial year
    const [incomeResult, insuranceResult] = await Promise.all([
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "credit"),
          eq(transactions.category, "salary"),
          gte(transactions.date, fyStart),
          lte(transactions.date, fyEnd)
        )
      ),
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "debit"),
          eq(transactions.category, "insurance"),
          gte(transactions.date, fyStart),
          lte(transactions.date, fyEnd)
        )
      ),
    ])

    // Calculate Tax Liability & Opportunities
    const grossIncome = parseFloat(incomeResult[0]?.total || "0")
    const deduction80C = Math.min(parseFloat(insuranceResult[0]?.total || "0"), 150000)
    const taxRegime = profile?.taxRegime || "new"
    const standardOld = 50000
    const standardNew = 75000

    const oldTax = calcTax(Math.max(0, grossIncome - deduction80C - standardOld), OLD_REGIME_SLABS)
    const newTax = calcTax(Math.max(0, grossIncome - standardNew), NEW_REGIME_SLABS)
    const taxPayable = taxRegime === "old" ? oldTax : newTax
    const effectiveRate = grossIncome > 0 ? (taxPayable / grossIncome) * 100 : 0
    const betterRegime = oldTax < newTax ? "old" : "new"

    const taxOpportunities: string[] = []
    const remaining80C = Math.max(0, 150000 - deduction80C)
    if (remaining80C > 0) {
      taxOpportunities.push(`Invest ₹${remaining80C.toLocaleString("en-IN")} more in 80C (ELSS/PPF/LIC) to save up to ₹${Math.round(remaining80C * 0.3).toLocaleString("en-IN")} in tax.`)
    }
    if (grossIncome > 1000000) {
      taxOpportunities.push("Consider NPS (₹50,000 under 80CCD(1B)) for extra deduction.")
    }

    // 3. Fetch monthly trends and category breakdowns
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

    // KYC Status checks
    const hasPan = !!profile?.panNumber
    const hasAadhaar = !!profile?.aadhaarLast4
    const kycStatus = (hasPan && hasAadhaar) ? "VERIFIED" : "PENDING"

    return `
USER PROFILE & ACCOUNT DETAILS:
- Name/ID: ${userId}
- Occupation: ${profile?.occupation || "not specified"}
- Income bracket: ${profile?.incomeBracket || "not specified"}
- City & State: ${profile?.city || "unknown"}, ${profile?.state || "unknown"}
- KYC Status: ${kycStatus} (PAN: ${hasPan ? "provided" : "missing"}, Aadhaar Last 4: ${hasAadhaar ? "provided" : "missing"})
- Linked Accounts: ${banks.length} bank(s) active (${bankNames || "none linked"})
- AI consent: ${profile?.consentAIAssistant ? "approved" : "revoked"}
- ML analytics consent: ${profile?.consentMLAnalytics ? "approved" : "revoked"}

TAX LIABILITY SUMMARY (FY 2025-26):
- Tax Regime Preference: ${taxRegime.toUpperCase()} regime
- Better Alternative: ${betterRegime.toUpperCase()} regime (Potential savings vs other: ₹${Math.abs(Math.round(oldTax - newTax)).toLocaleString("en-IN")})
- Gross FY Salary Income: ₹${Math.round(grossIncome).toLocaleString("en-IN")}
- Standard Deduction Applied: ₹${(taxRegime === "old" ? standardOld : standardNew).toLocaleString("en-IN")}
- 80C Deductions Utilized: ₹${Math.round(deduction80C).toLocaleString("en-IN")}
- Current Estimated Tax Payable: ₹${Math.round(taxPayable).toLocaleString("en-IN")}
- Effective Tax Rate: ${effectiveRate.toFixed(1)}%

TAX SAVING OPPORTUNITIES:
${taxOpportunities.length > 0 ? taxOpportunities.map(o => `- ${o}`).join("\n") : "- Fully optimized! No current opportunities found."}

LAST 3 MONTHS SPENDING METRICS:
- Average monthly income: ₹${Math.round(avgIncome).toLocaleString("en-IN")}
- Average monthly expenses: ₹${Math.round(avgExpense).toLocaleString("en-IN")}
- Average monthly savings: ₹${Math.round(avgIncome - avgExpense).toLocaleString("en-IN")} (${savingsRate}% savings rate)

TOP SPENDING CATEGORIES:
${topCategories || "No data available"}

MONTHLY TRENDS:
${monthlyTrends || "No data available"}

IMPORTANT: Only discuss this user's own financial data. Never reference other users. Keep recommendations private.
`.trim()
  } catch (err) {
    console.error("[AI Context Builders Failed]", err)
    return "User financial data unavailable. Please ask them to upload bank statements first."
  }
}
