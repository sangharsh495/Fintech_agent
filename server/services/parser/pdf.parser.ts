// pdf-parse is CJS, use require with createRequire
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
import { categorizeTransaction } from "./categorizer"
import { computeHash } from "./deduplicator"
import type { ParsedTransaction } from "./deduplicator"

export async function parsePDFStatement(fileBuffer: Buffer): Promise<ParsedTransaction[]> {
  const data = await pdfParse(fileBuffer)
  const text = data.text

  // Try specific bank formats first, then generic
  const parsers = [parseICICIFormat, parseSBIFormat, parseGenericFormat]
  for (const parser of parsers) {
    const result = parser(text)
    if (result.length > 2) return result
  }
  return parseGenericFormat(text)
}

function parseICICIFormat(text: string): ParsedTransaction[] {
  const rows: ParsedTransaction[] = []
  const regex = /(\d{2}[- \/]\d{2}[- \/]\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g

  let match
  while ((match = regex.exec(text)) !== null) {
    const [, dateStr, desc, debit, credit, balance] = match
    const date = parseDate(dateStr || "")
    if (!date) continue

    const debitAmt = parseFloat((debit || "0").replace(/,/g, "")) || 0
    const creditAmt = parseFloat((credit || "0").replace(/,/g, "")) || 0
    const bal = parseFloat((balance || "0").replace(/,/g, "")) || 0
    if (debitAmt === 0 && creditAmt === 0) continue

    const type: "credit" | "debit" = creditAmt > 0 ? "credit" : "debit"
    const amount = type === "credit" ? creditAmt : debitAmt
    const cat = categorizeTransaction(desc || "", amount, type)
    const hash = computeHash(date, amount, desc || "")

    rows.push({
      date, description: cat.merchant || desc || "", rawDescription: desc || "",
      amount, type, balance: bal, category: cat.category, subcategory: cat.subcategory,
      merchant: cat.merchant, isRecurring: cat.isRecurring,
      paymentMethod: detectPaymentMethod(desc || ""), hash,
    })
  }
  return rows
}

function parseSBIFormat(text: string): ParsedTransaction[] {
  return parseICICIFormat(text)
}

function parseGenericFormat(text: string): ParsedTransaction[] {
  const rows: ParsedTransaction[] = []
  const lines = text.split("\n")

  for (const line of lines) {
    const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/)
    if (!dateMatch) continue

    const date = parseDate(dateMatch[1] || "")
    if (!date) continue

    const amounts = [...line.matchAll(/[\d,]+\.\d{2}/g)].map((m) =>
      parseFloat(m[0].replace(/,/g, ""))
    )
    if (!amounts.length) continue

    const amount = amounts[0]!
    const desc = line
      .replace(dateMatch[0], "")
      .replace(/[\d,]+\.\d{2}/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (!desc || amount <= 0) continue

    const type: "credit" | "debit" = desc.toLowerCase().includes("cr") ? "credit" : "debit"
    const cat = categorizeTransaction(desc, amount, type)
    const hash = computeHash(date, amount, desc)

    rows.push({
      date, description: cat.merchant || desc, rawDescription: desc, amount, type,
      category: cat.category, subcategory: cat.subcategory, merchant: cat.merchant,
      isRecurring: cat.isRecurring, paymentMethod: detectPaymentMethod(desc), hash,
    })
  }
  return rows
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const m1 = str.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/)
  if (m1) return new Date(`${m1[3]}-${m1[2]}-${m1[1]}`)
  const m2 = str.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2})$/)
  if (m2) return new Date(`${parseInt(m2[3]!) + 2000}-${m2[2]}-${m2[1]}`)
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase()
  if (lower.includes("upi")) return "upi"
  if (lower.includes("neft")) return "neft"
  if (lower.includes("rtgs")) return "neft"
  if (lower.includes("imps")) return "imps"
  if (lower.includes("atm")) return "cash"
  if (lower.includes("auto debit") || lower.includes("nach")) return "auto_debit"
  if (lower.includes("cheque")) return "cheque"
  return "net_banking"
}
