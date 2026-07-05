import { NextResponse } from "next/server"
import { listSupportedBanks } from "@/server/services/parser/bank-profiles"

/**
 * GET /api/banks/supported
 *
 * Returns the list of banks with pre-built parsing profiles.
 * Used by the frontend to populate the bank selector dropdown
 * and show the appropriate password hint.
 *
 * No authentication required — this is public reference data.
 */
export async function GET() {
  const banks = listSupportedBanks()

  return NextResponse.json({
    banks,
    total: banks.length,
    note: "Select your bank for the best parsing accuracy. If your bank is not listed, choose 'Other' — the parser will attempt auto-detection.",
  })
}
