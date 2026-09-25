/**
 * app/api/aa/mock-consent/route.ts
 *
 * Simulates a successful RBI Account Aggregator (AA) Consent & FI-Fetch cycle.
 * Generates an authentic ReBIT-compliant Financial Information payload
 * with continuous ledger transactions for testing the neuro-symbolic pipeline.
 */

import { NextResponse } from "next/server"
import { parseReBitPayload, type ReBitFIFetchPayload } from "@/server/services/aa/rebit-parser"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const bankName = String(body.bankName || "HDFC Bank").replace(/<[^>]*>?/gm, "").slice(0, 50)
    const accountLast4 = String(body.accountLast4 || "4921").replace(/[^0-9]/g, "").slice(0, 4)
    const periodMonths = Math.min(Math.max(1, parseInt(body.months, 10) || 3), 12)

    // Generate an authentic ReBIT transaction sequence with exact fund conservation
    const transactions: any[] = []
    let balance = 125430.50
    const now = new Date()

    const narrations = [
      { narr: "SALARY CREDIT - ACME CORP TECH", amount: 145000, type: "CREDIT", mode: "NEFT" },
      { narr: "SWIGGY BANGALORE IN", amount: 485.50, type: "DEBIT", mode: "UPI" },
      { narr: "AMAZON RETAIL INDIA PVT", amount: 2499.00, type: "DEBIT", mode: "UPI" },
      { narr: "HDFC LIFE INSURANCE SEC 80D", amount: 18500.00, type: "DEBIT", mode: "NEFT" },
      { narr: "MAX BUPA HEALTH INSURANCE", amount: 12000.00, type: "DEBIT", mode: "NETBANKING" },
      { narr: "SBI MUTUAL FUND ELSS 80C", amount: 25000.00, type: "DEBIT", mode: "UPI" },
      { narr: "NPS TIER 1 CONTRIBUTION 80CCD", amount: 15000.00, type: "DEBIT", mode: "UPI" },
      { narr: "HOME LOAN EMI HDFC SEC 24B", amount: 38400.00, type: "DEBIT", mode: "NACH" },
      { narr: "ZEPTO INSTANT GROCERY", amount: 642.00, type: "DEBIT", mode: "UPI" },
      { narr: "UBER INDIA SYSTEMS", amount: 380.00, type: "DEBIT", mode: "UPI" },
      { narr: "TATA POWER ELECTRICITY", amount: 2150.00, type: "DEBIT", mode: "BILLPAY" },
      { narr: "NETFLIX ENTERTAINMENT", amount: 649.00, type: "DEBIT", mode: "CARD" },
    ]

    let txnIndex = 1
    for (let m = periodMonths - 1; m >= 0; m--) {
      for (const item of narrations) {
        const txnDate = new Date(now.getFullYear(), now.getMonth() - m, Math.min(28, txnIndex % 28 + 1))
        
        if (item.type === "CREDIT") {
          balance += item.amount
        } else {
          balance -= item.amount
        }
        balance = Math.round(balance * 100) / 100

        transactions.push({
          txnId: `REBIT-TXN-${Date.now()}-${txnIndex}`,
          type: item.type,
          mode: item.mode,
          amount: item.amount,
          currentBalance: balance,
          transactionTimestamp: txnDate.toISOString(),
          valueDate: txnDate.toISOString().split("T")[0],
          narration: item.narr,
          reference: `REF${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        })
        txnIndex++
      }
    }

    const payload: ReBitFIFetchPayload = {
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      consentId: `CONSENT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      account: {
        profile: {
          holders: [{ name: "Verified Account Holder", pan: "ABCDE1234F" }],
          accountNumberMasked: `XXXX-XXXX-${accountLast4}`,
          accountType: "SAVINGS",
          bank: bankName,
          currency: "INR",
          ifscCode: "HDFC0000123",
        },
        summary: {
          currentBalance: balance,
          currency: "INR",
          asOfDate: new Date().toISOString(),
        },
        transactions: {
          startDate: new Date(now.getFullYear(), now.getMonth() - periodMonths, 1).toISOString(),
          endDate: now.toISOString(),
          transaction: transactions,
        },
      },
    }

    // Ingest through the formal ReBIT verifier
    const verifiedResult = parseReBitPayload(payload)

    return NextResponse.json({
      success: true,
      message: `Account Aggregator Consent linked successfully via ReBIT AA Protocol. Ingested ${verifiedResult.uniqueTransactionsCount} transactions.`,
      result: verifiedResult,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to simulate AA consent" }, { status: 500 })
  }
}
