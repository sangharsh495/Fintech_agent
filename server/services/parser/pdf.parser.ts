// ─── PDF Statement Parser — Orchestrator (Groq Rotating LLM version) ────────────────────
// Uses pdf-parse to extract plain text and Groq multi-key rotation to extract transaction JSON.

import { decryptPDF } from "./pdf.decrypt"
import { extractPdfText } from "@/lib/pdf/extractText"
import { parseStatement } from "@/lib/parser/parseStatement"
import { callGroq } from "@/lib/groq/client"
import { categorizeTransaction } from "./categorizer"
import { computeHash } from "./deduplicator"
import type { ParsedStatementResult, ParsedTransaction } from "./pdf.types"

// Helper to detect payment method from description
function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase()
  if (lower.includes("upi")) return "upi"
  if (lower.includes("neft")) return "neft"
  if (lower.includes("imps")) return "imps"
  if (lower.includes("rtgs")) return "rtgs"
  if (lower.includes("atm") || lower.includes("cash")) return "cash"
  if (lower.includes("card") || lower.includes("pos")) return "card"
  return "other"
}

// Helper to parse dates robustly
function parseDateRobust(dateStr: string): Date {
  let d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d

  const parts = dateStr.split(/[-\/.]/)
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10)
    const p1 = parseInt(parts[1], 10) - 1 // 0-indexed month
    const p2 = parseInt(parts[2], 10)

    if (parts[2].length === 4) {
      d = new Date(p2, p1, p0) // DD/MM/YYYY
    } else if (parts[0].length === 4) {
      d = new Date(p0, p1, p2) // YYYY/MM/DD
    }
    if (!isNaN(d.getTime())) return d
  }
  return new Date()
}

// Extract metadata from statement header snippet using Groq
async function extractMetadataWithGroq(text: string): Promise<any> {
  const prompt = `You are a bank statement parser. Extract the metadata from the bank statement text below.
Return ONLY a JSON object with this exact shape:
{
  "bankName": string|null,
  "accountNumber": string|null,
  "accountHolderName": string|null,
  "ifscCode": string|null,
  "branch": string|null,
  "statementPeriodFrom": string|null, // ISO Date format YYYY-MM-DD
  "statementPeriodTo": string|null    // ISO Date format YYYY-MM-DD
}

Statement text snippet:
"""
${text.slice(0, 3000)}
"""`

  try {
    const resStr = await callGroq(prompt)
    const cleaned = resStr.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error("[METADATA EXTRACTION ERROR]", err)
    return null
  }
}

/**
 * Parse a PDF bank statement into structured transactions + metadata using Groq key-rotating pipeline.
 */
export async function parsePDFStatement(
  fileBuffer: Buffer,
  options?: any
): Promise<ParsedStatementResult> {
  // 1. Decrypt PDF first if needed
  const { buffer: cleanBuffer, wasEncrypted } = await decryptPDF(
    fileBuffer,
    options?.password
  )

  // 2. Extract plain text and page count using pdf-parse
  const { text, numPages } = await extractPdfText(cleanBuffer)

  // 3. Extract metadata from the header text snippet
  const metaObj = await extractMetadataWithGroq(text)

  const bankName = metaObj?.bankName || "Unknown Bank"
  const accountNumber = metaObj?.accountNumber || undefined
  const accountLast4 = accountNumber ? accountNumber.slice(-4) : undefined
  const accountHolderName = metaObj?.accountHolderName || undefined
  const ifscCode = metaObj?.ifscCode || undefined
  const branch = metaObj?.branch || undefined

  let statementPeriod: { from: Date; to: Date } | undefined = undefined
  if (metaObj?.statementPeriodFrom && metaObj?.statementPeriodTo) {
    statementPeriod = {
      from: new Date(metaObj.statementPeriodFrom),
      to: new Date(metaObj.statementPeriodTo),
    }
  }

  // 4. Run the Groq rotating transaction extraction pipeline
  const extractResult = await parseStatement(cleanBuffer)

  // 5. Map the Zod transactions to the expected ParsedTransaction structure
  const mappedTransactions: ParsedTransaction[] = extractResult.transactions.map((row) => {
    const debitAmount = row.debit || 0
    const creditAmount = row.credit || 0
    const amount = debitAmount > 0 ? debitAmount : creditAmount
    const type = debitAmount > 0 ? "debit" : "credit"
    
    const dateObj = parseDateRobust(row.date)
    const cat = categorizeTransaction(row.description, amount, type)

    return {
      date: dateObj,
      description: row.description,
      rawDescription: row.description,
      amount,
      type,
      balance: row.balance,
      category: cat.category,
      subcategory: cat.subcategory || "",
      merchant: cat.merchant || "",
      isRecurring: cat.isRecurring,
      paymentMethod: detectPaymentMethod(row.description),
      hash: computeHash(dateObj, amount, row.description),
    }
  })

  return {
    transactions: mappedTransactions,
    metadata: {
      bankName,
      bankProfileId: "generic", // Generic profile is used since Groq extracts everything dynamically
      accountNumber,
      accountLast4,
      accountHolderName,
      ifscCode,
      branch,
      statementPeriod,
    },
    bankProfile: "generic",
    pageCount: numPages,
    wasEncrypted,
  }
}
