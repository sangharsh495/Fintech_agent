import Papa from "papaparse"
import { categorizeTransaction } from "./categorizer"
import { computeHash } from "./deduplicator"
import type { ParsedTransaction } from "./deduplicator"

export async function parseCSVStatement(fileBuffer: Buffer): Promise<ParsedTransaction[]> {
  const csvText = fileBuffer.toString("utf-8")
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: false })
  const rows = result.data as Record<string, string>[]
  if (!rows.length) return []

  const headers = Object.keys(rows[0]!)
  const findCol = (candidates: string[]) =>
    headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c.toLowerCase())))

  const dateCol = findCol(["date", "txn date", "transaction date", "value date", "posting date"])
  const descCol = findCol(["description", "narration", "particulars", "details", "remarks", "transaction particulars"])
  const debitCol = findCol(["debit", "withdrawal", "dr", "amount dr"])
  const creditCol = findCol(["credit", "deposit", "cr", "amount cr"])
  const amountCol = findCol(["amount", "transaction amount"])
  const balanceCol = findCol(["balance", "running balance", "available balance"])
  const typeCol = findCol(["type", "transaction type", "dr/cr"])

  const transactions: ParsedTransaction[] = []

  for (const row of rows) {
    try {
      const rawDate = dateCol ? row[dateCol]?.trim() : null
      const rawDesc = descCol ? row[descCol]?.trim() : null
      if (!rawDate || !rawDesc) continue

      const date = parseDate(rawDate)
      if (!date) continue

      let amount = 0
      let type: "credit" | "debit" = "debit"

      if (debitCol && creditCol) {
        const debit = parseAmount(row[debitCol] || "0")
        const credit = parseAmount(row[creditCol] || "0")
        if (credit > 0) { amount = credit; type = "credit" }
        else if (debit > 0) { amount = debit; type = "debit" }
        else continue
      } else if (amountCol && typeCol) {
        amount = parseAmount(row[amountCol] || "0")
        const t = (row[typeCol] || "").toLowerCase()
        type = t.includes("cr") || t.includes("credit") ? "credit" : "debit"
      } else if (amountCol) {
        const raw = parseAmount(row[amountCol] || "0")
        amount = Math.abs(raw)
        type = raw >= 0 ? "credit" : "debit"
      }

      if (amount <= 0) continue

      const balance = balanceCol ? parseAmount(row[balanceCol] || "0") || undefined : undefined
      const cat = categorizeTransaction(rawDesc, amount, type)
      const hash = computeHash(date, amount, rawDesc)

      transactions.push({
        date, description: cat.merchant || rawDesc, rawDescription: rawDesc, amount, type,
        balance, category: cat.category, subcategory: cat.subcategory, merchant: cat.merchant,
        isRecurring: cat.isRecurring, paymentMethod: detectPaymentMethod(rawDesc), hash,
      })
    } catch { /* skip bad rows */ }
  }

  return transactions
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const m1 = str.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/)
  if (m1) return new Date(`${m1[3]}-${m1[2]}-${m1[1]}`)
  const m2 = str.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/)
  if (m2) return new Date(str)
  const m3 = str.match(/^(\d{1,2})[-\/\s](\w{3})[-\/\s](\d{4})$/)
  if (m3) return new Date(`${m3[2]} ${m3[1]}, ${m3[3]}`)
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function parseAmount(str: string): number {
  if (!str) return 0
  return parseFloat(str.replace(/[₹,$\s,]/g, "").replace(/Dr$|Cr$/i, "")) || 0
}

function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase()
  if (lower.includes("upi")) return "upi"
  if (lower.includes("neft")) return "neft"
  if (lower.includes("rtgs")) return "neft"
  if (lower.includes("imps")) return "imps"
  if (lower.includes("atm")) return "cash"
  if (lower.includes("credit card") || lower.includes("cc ")) return "credit_card"
  if (lower.includes("debit card")) return "debit_card"
  if (lower.includes("auto debit") || lower.includes("nach")) return "auto_debit"
  if (lower.includes("cheque") || lower.includes("chq")) return "cheque"
  return "net_banking"
}
