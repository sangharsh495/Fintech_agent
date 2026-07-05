import * as XLSX from "xlsx"
import { categorizeTransaction } from "./categorizer"
import { computeHash } from "./deduplicator"
import type { ParsedTransaction } from "./deduplicator"

export async function parseExcelStatement(fileBuffer: Buffer): Promise<ParsedTransaction[]> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true })
  const sheetName = workbook.SheetNames[0]!
  const sheet = workbook.Sheets[sheetName]!
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  if (!rows.length) return []

  const headers = Object.keys(rows[0]!)
  const findCol = (candidates: string[]) =>
    headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c.toLowerCase())))

  const dateCol = findCol(["date", "txn date", "transaction date", "value date"])
  const descCol = findCol(["description", "narration", "particulars", "details", "remarks"])
  const debitCol = findCol(["debit", "withdrawal", "dr"])
  const creditCol = findCol(["credit", "deposit", "cr"])
  const amountCol = findCol(["amount"])
  const balanceCol = findCol(["balance"])
  const typeCol = findCol(["type", "dr/cr"])

  const transactions: ParsedTransaction[] = []

  for (const row of rows) {
    try {
      const rawDate = dateCol ? row[dateCol] : null
      const rawDesc = descCol ? String(row[descCol] || "").trim() : null
      if (!rawDate || !rawDesc) continue

      let date: Date
      if (rawDate instanceof Date) { date = rawDate }
      else {
        const parsed = new Date(String(rawDate))
        if (isNaN(parsed.getTime())) continue
        date = parsed
      }

      let amount = 0
      let type: "credit" | "debit" = "debit"

      const parseAmt = (v: unknown) => parseFloat(String(v || "0").replace(/[₹,\s]/g, "")) || 0

      if (debitCol && creditCol) {
        const debit = parseAmt(row[debitCol])
        const credit = parseAmt(row[creditCol])
        if (credit > 0) { amount = credit; type = "credit" }
        else if (debit > 0) { amount = debit; type = "debit" }
        else continue
      } else if (amountCol && typeCol) {
        amount = parseAmt(row[amountCol])
        type = String(row[typeCol] || "").toLowerCase().includes("cr") ? "credit" : "debit"
      }

      if (amount <= 0) continue

      const balance = balanceCol ? parseAmt(row[balanceCol]) || undefined : undefined
      const cat = categorizeTransaction(rawDesc, amount, type)
      const hash = computeHash(date, amount, rawDesc)

      transactions.push({
        date, description: cat.merchant || rawDesc, rawDescription: rawDesc, amount, type,
        balance, category: cat.category, subcategory: cat.subcategory, merchant: cat.merchant,
        isRecurring: cat.isRecurring, paymentMethod: detectPaymentMethod(rawDesc), hash,
      })
    } catch { /* skip */ }
  }

  return transactions
}

function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase()
  if (lower.includes("upi")) return "upi"
  if (lower.includes("neft")) return "neft"
  if (lower.includes("rtgs")) return "neft"
  if (lower.includes("imps")) return "imps"
  if (lower.includes("atm")) return "cash"
  if (lower.includes("auto debit") || lower.includes("nach")) return "auto_debit"
  if (lower.includes("cheque") || lower.includes("chq")) return "cheque"
  return "net_banking"
}
