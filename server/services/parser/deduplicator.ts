import crypto from "crypto"
import { db } from "@/server/db"
import { transactions } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"

export interface ParsedTransaction {
  date: Date
  description: string
  rawDescription: string
  amount: number
  type: "credit" | "debit"
  balance?: number
  category: string
  subcategory?: string
  merchant?: string
  isRecurring: boolean
  paymentMethod?: string
  hash: string
  tags?: any
}

export function computeHash(date: Date, amount: number, rawDescription: string): string {
  const str = `${date.toISOString().split("T")[0]}|${amount.toFixed(2)}|${rawDescription.toLowerCase().trim()}`
  return crypto.createHash("sha256").update(str).digest("hex")
}

export interface DeduplicationResult {
  newTransactions: ParsedTransaction[]
  duplicates: ParsedTransaction[]
  newCount: number
  duplicateCount: number
  gapWarning?: string
}

export async function deduplicateTransactions(
  userId: string,
  bankAccountId: string,
  incoming: ParsedTransaction[]
): Promise<DeduplicationResult> {
  const existing = await db
    .select({ hash: transactions.hash })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.bankAccountId, bankAccountId)))

  const existingHashes = new Set(existing.map((r) => r.hash).filter(Boolean) as string[])

  const newTransactions: ParsedTransaction[] = []
  const duplicates: ParsedTransaction[] = []

  for (const txn of incoming) {
    if (txn.hash && existingHashes.has(txn.hash)) {
      duplicates.push(txn)
    } else {
      newTransactions.push(txn)
    }
  }

  // Check for data gaps
  let gapWarning: string | undefined
  if (newTransactions.length > 0) {
    const latestExisting = await db
      .select({ date: transactions.date })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.bankAccountId, bankAccountId)))
      .orderBy(transactions.date)
      .limit(1)

    if (latestExisting.length > 0 && latestExisting[0]?.date) {
      const latestDate = latestExisting[0].date
      const earliestNew = newTransactions.reduce(
        (min, t) => (t.date < min ? t.date : min),
        newTransactions[0]!.date
      )
      const dayGap = Math.floor(
        (earliestNew.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (dayGap > 5) {
        const gapStart = latestDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
        const gapEnd = earliestNew.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
        gapWarning = `Gap detected: ${gapStart} to ${gapEnd} has no transaction data. Consider uploading statements for that period.`
      }
    }
  }

  return {
    newTransactions,
    duplicates,
    newCount: newTransactions.length,
    duplicateCount: duplicates.length,
    gapWarning,
  }
}
