import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { transactions, userProfiles } from "@/server/db/schema"
import { eq, and, gte, lte, sum } from "drizzle-orm"

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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const fy = req.nextUrl.searchParams.get("fy") || "2025-26"
  const [startYear] = fy.split("-")
  const fyStart = new Date(`${startYear}-04-01`)
  const fyEnd = new Date(`${parseInt(startYear!) + 1}-03-31`)

  try {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
    const taxRegime = profile?.taxRegime || "new"

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
    const standardOld = 50000
    const standardNew = 75000

    const oldTax = calcTax(Math.max(0, grossIncome - deduction80C - standardOld), OLD_REGIME)
    const newTax = calcTax(Math.max(0, grossIncome - standardNew), NEW_REGIME)
    const taxPayable = taxRegime === "old" ? oldTax : newTax
    const effectiveRate = grossIncome > 0 ? Math.round((taxPayable / grossIncome) * 1000) / 10 : 0
    const betterRegime = oldTax < newTax ? "old" : "new"

    const opportunities: string[] = []
    const remaining80C = Math.max(0, 150000 - deduction80C)
    if (remaining80C > 0) {
      opportunities.push(`Invest ₹${remaining80C.toLocaleString("en-IN")} more in 80C instruments (ELSS/PPF/LIC) to save up to ₹${Math.round(remaining80C * 0.3).toLocaleString("en-IN")} in tax.`)
    }
    if (grossIncome > 1000000) {
      opportunities.push("Consider NPS (₹50,000 under 80CCD(1B)) for additional tax deduction beyond 80C limit.")
    }

    return NextResponse.json({
      fy, grossIncome, taxRegime,
      deductions: { "80C": deduction80C, standard: taxRegime === "old" ? standardOld : standardNew, total: deduction80C + (taxRegime === "old" ? standardOld : standardNew) },
      taxableIncome: Math.max(0, grossIncome - deduction80C - (taxRegime === "old" ? standardOld : standardNew)),
      taxPayable: Math.round(taxPayable), effectiveRate,
      oldRegimeTax: Math.round(oldTax), newRegimeTax: Math.round(newTax),
      betterRegime, savingsVsOtherRegime: Math.abs(Math.round(oldTax - newTax)),
      opportunities,
    })
  } catch (error) {
    console.error("[TAX]", error)
    return NextResponse.json({ error: "Failed to calculate tax" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { regime } = await req.json()
    if (!["old", "new"].includes(regime)) return NextResponse.json({ error: "Invalid regime" }, { status: 400 })

    await db.update(userProfiles).set({ taxRegime: regime }).where(eq(userProfiles.userId, session.user.id))
    return NextResponse.json({ success: true, regime })
  } catch (error) {
    console.error("[TAX REGIME]", error)
    return NextResponse.json({ error: "Failed to update regime" }, { status: 500 })
  }
}
