/**
 * app/api/aa/ingest/route.ts
 *
 * Endpoint to ingest RBI/ReBIT Account Aggregator (AA) Financial Information (FI) fetch payloads.
 * Validates JSON/XML payloads against the ReBIT specification, runs the balance continuity invariant,
 * performs SHA-256 deduplication, and returns the canonical transactions.
 */

import { NextResponse } from "next/server"
import { parseReBitPayload } from "@/server/services/aa/rebit-parser"
import { safeLogError } from "@/server/lib/safe-log"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get("content-length")) || 0
    const MAX_AA_PAYLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

    if (contentLength > MAX_AA_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Account Aggregator payload must not exceed 10 MB." },
        { status: 413 }
      )
    }

    const contentType = req.headers.get("content-type") || ""
    let payload: any

    if (contentType.includes("application/json")) {
      payload = await req.json()
    } else if (contentType.includes("multipart/form-data")) {
      const formData: any = await req.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 })
      }
      if (file.size > MAX_AA_PAYLOAD_BYTES) {
        return NextResponse.json({ error: "Uploaded file exceeds 10 MB limit" }, { status: 413 })
      }
      const text = await file.text()
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text // string fallback (e.g. XML)
      }
    } else {
      payload = await req.text()
    }

    if (!payload) {
      return NextResponse.json({ error: "Empty Account Aggregator payload" }, { status: 400 })
    }

    const result = parseReBitPayload(payload)

    return NextResponse.json({
      success: true,
      source: result.source,
      consentId: result.consentId,
      bank: result.bank,
      accountNumberMasked: result.accountNumberMasked,
      currentBalance: result.currentBalance,
      currency: result.currency,
      rawTransactionsCount: result.rawTransactionsCount,
      uniqueTransactionsCount: result.uniqueTransactionsCount,
      duplicateCount: result.duplicateCount,
      continuity: result.continuity,
      transactions: result.transactions,
    })
  } catch (err: any) {
    safeLogError("[AA INGEST ERROR]", err)
    return NextResponse.json({ error: err.message || "Failed to process Account Aggregator payload" }, { status: 500 })
  }
}
