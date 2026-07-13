import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { transactions, bankAccounts, monthlySummaries, netWorthSnapshots } from "@/server/db/schema"
import { eq, and, desc, gte, sum, sql } from "drizzle-orm"
import { safeLogError } from "@/server/lib/safe-log"

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  try {
    const banks = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)))

    if (!banks.length) {
      return NextResponse.json({
        hasData: false, totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0,
        savingsRate: 0, recentTransactions: [], perBankBalances: [], alerts: [],
      })
    }

    // ── READ FROM AGGREGATED TABLES (not raw transactions) ──

    // Monthly income/expense from monthly_summaries
    const monthlyAggregates = await db
      .select({
        type: monthlySummaries.type,
        total: sum(monthlySummaries.totalAmount),
      })
      .from(monthlySummaries)
      .where(and(eq(monthlySummaries.userId, userId), eq(monthlySummaries.month, currentMonth)))
      .groupBy(monthlySummaries.type)

    const monthlyIncome = parseFloat(
      monthlyAggregates.find((a) => a.type === "credit")?.total || "0"
    )
    const monthlyExpense = parseFloat(
      monthlyAggregates.find((a) => a.type === "debit")?.total || "0"
    )
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0

    // Net worth from snapshots (latest snapshot)
    const [latestSnapshot] = await db
      .select()
      .from(netWorthSnapshots)
      .where(eq(netWorthSnapshots.userId, userId))
      .orderBy(desc(netWorthSnapshots.snapshotDate))
      .limit(1)

    const totalBalance = parseFloat(latestSnapshot?.totalBalance || "0")
    let perBankBalances: Array<{
      bankId: string
      bankName: string
      accountNickname: string | null
      accountLast4: string | null
      accountType: string
      balance: number
    }> = []

    if (latestSnapshot?.bankBalances) {
      try {
        const parsed = JSON.parse(latestSnapshot.bankBalances)
        perBankBalances = (parsed as Array<{ bankId: string; bankName: string; balance: number }>).map((b) => {
          const bankInfo = banks.find((bank) => bank.id === b.bankId)
          return {
            bankId: b.bankId,
            bankName: b.bankName || bankInfo?.bankName || "Unknown",
            accountNickname: bankInfo?.accountNickname || null,
            accountLast4: bankInfo?.accountLast4 || null,
            accountType: bankInfo?.accountType || "savings",
            balance: b.balance,
          }
        })
      } catch {
        // Fallback if snapshot JSON is malformed
      }
    }

    // If no snapshot exists yet, compute from raw data (explicit, audited path)
    if (!latestSnapshot) {
      perBankBalances = await Promise.all(
        banks.map(async (bank) => {
          const [latest] = await db
            .select({ balance: transactions.balanceAfter })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.bankAccountId, bank.id)))
            .orderBy(desc(transactions.date))
            .limit(1)
          return {
            bankId: bank.id, bankName: bank.bankName, accountNickname: bank.accountNickname,
            accountLast4: bank.accountLast4, accountType: bank.accountType,
            balance: parseFloat(latest?.balance || "0"),
          }
        })
      )
    }

    const computedBalance = perBankBalances.reduce((s, b) => s + b.balance, 0)

    // ── RECENT TRANSACTIONS (explicit, audited raw-data path) ──
    // This is the ONLY raw transaction access in the dashboard route.
    const recent = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(10)

    // Anomaly alerts (explicit, audited path)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const anomalies = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.isAnomaly, true), gte(transactions.date, startOfMonth)))
      .limit(5)

    const alerts = anomalies.map((a) => ({
      type: "anomaly",
      message: `Unusual transaction: ₹${parseFloat(a.amount).toLocaleString("en-IN")} at ${a.merchant || a.description}`,
      date: a.date,
    }))

    return NextResponse.json({
      hasData: true, totalBalance: totalBalance || computedBalance,
      monthlyIncome, monthlyExpense, netWorth: totalBalance || computedBalance,
      savingsRate, recentTransactions: recent, perBankBalances, alerts,
    })
  } catch (error) {
    safeLogError("[DASHBOARD]", error)
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 })
  }
}
