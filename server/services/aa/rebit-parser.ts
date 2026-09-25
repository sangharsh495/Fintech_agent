/**
 * server/services/aa/rebit-parser.ts
 *
 * Reserve Bank of India (RBI) / ReBIT Standard Account Aggregator (AA) Parser.
 * Handles Financial Information (FI) fetch payloads conforming to the ReBIT
 * Deposit Account Schema (v2.0).
 *
 * Implements:
 * 1. ReBIT JSON and XML structured ingestion
 * 2. Formal Balance Continuity Invariant: |B_i - (B_{i-1} + C_i - D_i)| <= 0.01
 * 3. SHA-256 Transaction Deduplication
 * 4. Automatic merchant & category enrichment
 */

import crypto from "crypto"
import { categorizeTransaction } from "../parser/categorizer.ts"
import type { ParsedTransaction } from "../parser/deduplicator.ts"

export interface ReBitTransaction {
  txnId: string
  type: "DEBIT" | "CREDIT"
  mode?: "UPI" | "IMPS" | "NEFT" | "RTGS" | "CARD" | "ATM" | "OTHERS"
  amount: number
  currentBalance: number
  transactionTimestamp: string
  valueDate?: string
  narration: string
  reference?: string
}

export interface ReBitAccountProfile {
  holders?: Array<{ name: string; email?: string; mobile?: string; pan?: string }>
  accountNumberMasked?: string
  accountType?: "SAVINGS" | "CURRENT" | "DEPOSIT"
  bank?: string
  ifscCode?: string
  currency?: string
}

export interface ReBitFIFetchPayload {
  version?: string
  timestamp?: string
  consentId?: string
  account?: {
    profile?: ReBitAccountProfile
    summary?: {
      currentBalance: number
      currency: string
      asOfDate: string
    }
    transactions?: {
      startDate?: string
      endDate?: string
      transaction?: ReBitTransaction[]
    }
  }
}

export interface AAContinuityError {
  index: number
  expectedBalance: number
  actualBalance: number
  discrepancy: number
  transaction: ReBitTransaction
}

export interface AAParseResult {
  source: "REBIT_ACCOUNT_AGGREGATOR"
  consentId: string
  bank: string
  accountNumberMasked: string
  accountType: string
  currency: string
  currentBalance: number
  transactions: ParsedTransaction[]
  rawTransactionsCount: number
  uniqueTransactionsCount: number
  duplicateCount: number
  continuity: {
    valid: boolean
    verifiedCount: number
    violationsCount: number
    errors: AAContinuityError[]
    message: string
  }
}

const EPSILON = 0.01

/**
 * Computes deterministic SHA-256 deduplication hash for an AA transaction
 */
export function computeAATransactionHash(
  dateStr: string,
  amount: number,
  narration: string,
  bank: string,
  txnId?: string
): string {
  const normalized = narration.toLowerCase().replace(/[^a-z0-9]/g, "")
  const canonical = `${dateStr}|${amount.toFixed(2)}|${normalized}|${bank.toLowerCase()}|${txnId || ""}`
  return crypto.createHash("sha256").update(canonical).digest("hex")
}

/**
 * Ingest and verify a ReBIT Account Aggregator payload (JSON object or string)
 */
export function parseReBitPayload(input: string | Record<string, any>): AAParseResult {
  let data: any
  if (typeof input === "string") {
    try {
      data = JSON.parse(input)
    } catch {
      // If XML format was provided, parse basic XML nodes
      data = parseReBitXmlFallback(input)
    }
  } else {
    data = input
  }

  const consentId = data.consentId || data.account?.consentId || `CONSENT-MOCK-${Date.now()}`
  const profile = data.account?.profile || {}
  const bank = profile.bank || "Scheduled Commercial Bank"
  const accountNumberMasked = profile.accountNumberMasked || "XXXX-XXXX"
  const accountType = profile.accountType || "SAVINGS"
  const currency = profile.currency || data.account?.summary?.currency || "INR"
  const currentBalance = data.account?.summary?.currentBalance ?? 0

  const rawTxns: ReBitTransaction[] = Array.isArray(data.account?.transactions?.transaction)
    ? data.account.transactions.transaction
    : Array.isArray(data.transactions)
    ? data.transactions
    : []

  // 1. Chronological sort (ReBIT timestamps are ISO 8601)
  const sortedTxns = [...rawTxns].sort(
    (a, b) => new Date(a.transactionTimestamp).getTime() - new Date(b.transactionTimestamp).getTime()
  )

  // 2. Validate Formal Balance Continuity Invariant: |B_i - (B_{i-1} + C_i - D_i)| <= 0.01
  const continuityErrors: AAContinuityError[] = []
  for (let i = 1; i < sortedTxns.length; i++) {
    const prev = sortedTxns[i - 1]
    const curr = sortedTxns[i]

    if (prev.currentBalance != null && curr.currentBalance != null) {
      const credit = curr.type === "CREDIT" ? curr.amount : 0
      const debit = curr.type === "DEBIT" ? curr.amount : 0
      const delta = credit - debit
      const expected = Math.round((prev.currentBalance + delta) * 100) / 100
      const actual = Math.round(curr.currentBalance * 100) / 100
      const discrepancy = Math.abs(expected - actual)

      if (discrepancy > EPSILON) {
        continuityErrors.push({
          index: i,
          expectedBalance: expected,
          actualBalance: actual,
          discrepancy,
          transaction: curr,
        })
      }
    }
  }

  // 3. Cryptographic Deduplication (SHA-256)
  const seenHashes = new Set<string>()
  const uniqueParsedTxns: ParsedTransaction[] = []
  let duplicateCount = 0

  for (const t of sortedTxns) {
    const isCredit = t.type === "CREDIT"
    const amount = Number(t.amount) || 0
    const dateObj = new Date(t.transactionTimestamp)
    const dateIso = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    const hash = computeAATransactionHash(dateIso, amount, t.narration || "", bank, t.txnId)

    if (seenHashes.has(hash)) {
      duplicateCount++
      continue
    }
    seenHashes.add(hash)

    const catResult = categorizeTransaction(t.narration || "", amount, isCredit ? "credit" : "debit")

    uniqueParsedTxns.push({
      date: dateObj,
      description: t.narration || "Account Aggregator Transfer",
      rawDescription: t.narration || "",
      amount,
      type: isCredit ? "credit" : "debit",
      balance: t.currentBalance,
      category: catResult.category,
      subcategory: catResult.subcategory,
      merchant: catResult.merchant,
      isRecurring: catResult.isRecurring,
      paymentMethod: t.mode ? t.mode.toLowerCase() : "upi",
      hash,
    })
  }

  const isContinuityValid = continuityErrors.length === 0

  return {
    source: "REBIT_ACCOUNT_AGGREGATOR",
    consentId,
    bank,
    accountNumberMasked,
    accountType,
    currency,
    currentBalance,
    transactions: uniqueParsedTxns,
    rawTransactionsCount: sortedTxns.length,
    uniqueTransactionsCount: uniqueParsedTxns.length,
    duplicateCount,
    continuity: {
      valid: isContinuityValid,
      verifiedCount: Math.max(0, sortedTxns.length - 1),
      violationsCount: continuityErrors.length,
      errors: continuityErrors,
      message: isContinuityValid
        ? `Balance Continuity Invariant verified across ${sortedTxns.length} transactions (|B_i - (B_{i-1} + C_i - D_i)| <= 0.01).`
        : `Flagged ${continuityErrors.length} balance discrepancies in Account Aggregator feed.`,
    },
  }
}

/**
 * Basic XML parser fallback for ReBIT XML payloads
 */
function parseReBitXmlFallback(xmlStr: string): any {
  const transactions: ReBitTransaction[] = []
  const txnRegex = /<Transaction[\s\S]*?<\/Transaction>/gi
  const matches = xmlStr.match(txnRegex) || []

  for (const m of matches) {
    const txnId = m.match(/txnId=["']([^"']+)["']/i)?.[1] || `TXN-${Math.random().toString(36).substring(2, 9)}`
    const type = (m.match(/type=["']([^"']+)["']/i)?.[1] || "DEBIT").toUpperCase() as "DEBIT" | "CREDIT"
    const mode = (m.match(/mode=["']([^"']+)["']/i)?.[1] || "UPI").toUpperCase() as any
    const amountMatch = m.match(/amount=["']([^"']+)["']/i) || m.match(/<amount>([\d.]+)<\/amount>/i)
    const balanceMatch = m.match(/currentBalance=["']([^"']+)["']/i) || m.match(/<currentBalance>([\d.]+)<\/currentBalance>/i)
    const timestampMatch = m.match(/transactionTimestamp=["']([^"']+)["']/i) || m.match(/<transactionTimestamp>([^<]+)<\/transactionTimestamp>/i)
    const narrationMatch = m.match(/narration=["']([^"']+)["']/i) || m.match(/<narration>([^<]+)<\/narration>/i)

    transactions.push({
      txnId,
      type,
      mode,
      amount: parseFloat(amountMatch?.[1] || "0"),
      currentBalance: parseFloat(balanceMatch?.[1] || "0"),
      transactionTimestamp: timestampMatch?.[1] || new Date().toISOString(),
      narration: narrationMatch?.[1] || "AA Transaction",
    })
  }

  const bank = xmlStr.match(/bank=["']([^"']+)["']/i)?.[1] || "Scheduled Commercial Bank"
  const accountNumberMasked = xmlStr.match(/accountNumberMasked=["']([^"']+)["']/i)?.[1] || "XXXX-XXXX"

  return {
    consentId: `CONSENT-XML-${Date.now()}`,
    account: {
      profile: { bank, accountNumberMasked, accountType: "SAVINGS", currency: "INR" },
      summary: { currentBalance: transactions[transactions.length - 1]?.currentBalance || 0, currency: "INR", asOfDate: new Date().toISOString() },
      transactions: { transaction: transactions },
    },
  }
}
