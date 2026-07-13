import { NextRequest, NextResponse } from "next/server"
import { safeLogError } from "@/server/lib/safe-log"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { bankAccounts } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const addBankSchema = z.object({
  bankName: z.string().min(1),
  accountNickname: z.string().optional(),
  accountLast4: z.string().max(4).optional(),
  accountType: z.enum(["savings", "current", "salary"]).default("savings"),
})

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await withUserScopedDb(session.user.id, async (db) => {
    return db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.userId, session.user.id), eq(bankAccounts.isActive, true)))
  })

  return NextResponse.json({ banks: accounts })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = addBankSchema.parse(body)

    const [bank] = await withUserScopedDb(session.user.id, async (db) => {
      return db
        .insert(bankAccounts)
        .values({ userId: session.user.id, ...data })
        .returning()
    })

    return NextResponse.json({ bank }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
    }
    safeLogError("[BANKS POST]", error)
    return NextResponse.json({ error: "Failed to add bank" }, { status: 500 })
  }
}
