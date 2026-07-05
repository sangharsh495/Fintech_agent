import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { transactions, bankAccounts } from "@/server/db/schema"
import { eq, and, desc, gte, sum } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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

    const [incomeResult, expenseResult] = await Promise.all([
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(eq(transactions.userId, userId), eq(transactions.type, "credit"), gte(transactions.date, startOfMonth))
      ),
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(eq(transactions.userId, userId), eq(transactions.type, "debit"), gte(transactions.date, startOfMonth))
      ),
    ])

    const monthlyIncome = parseFloat(incomeResult[0]?.total || "0")
    const monthlyExpense = parseFloat(expenseResult[0]?.total || "0")
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0

    const recent = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(10)

    const perBankBalances = await Promise.all(
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

    const totalBalance = perBankBalances.reduce((s, b) => s + b.balance, 0)

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
      hasData: true, totalBalance, monthlyIncome, monthlyExpense, netWorth: totalBalance,
      savingsRate, recentTransactions: recent, perBankBalances, alerts,
    })
  } catch (error) {
    console.error("[DASHBOARD]", error)
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 })
  }
}
