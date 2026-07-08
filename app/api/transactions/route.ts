import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { transactions } from "@/server/db/schema"
import { eq, and, desc, gte, lte, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const bankId = searchParams.get("bankId")
  const category = searchParams.get("category")
  const type = searchParams.get("type") as "credit" | "debit" | null
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const offset = (page - 1) * limit

  try {
    const conditions = [eq(transactions.userId, userId)]
    if (bankId && bankId !== "all") conditions.push(eq(transactions.bankAccountId, bankId))
    if (type) conditions.push(eq(transactions.type, type))
    if (from) conditions.push(gte(transactions.date, new Date(from)))
    if (to) conditions.push(lte(transactions.date, new Date(to)))
    if (category) conditions.push(eq(transactions.category, category))

    const [data, totalResult] = await Promise.all([
      db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.date)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(transactions).where(and(...conditions)),
    ])

    const total = Number(totalResult[0]?.count || 0)
    return NextResponse.json({ transactions: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error("[TRANSACTIONS]", error)
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 })
  }
}
