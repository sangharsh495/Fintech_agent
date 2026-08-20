/**
 * server/services/tax/cas.parser.ts
 *
 * Parses a CAMS / KFintech Consolidated Account Statement (CAS) PDF into mutual
 * fund holdings, and derives the Section 80C contribution from ELSS purchases.
 *
 * CAS layout (both registrars share the CAMS-derived template):
 *
 *   Folio No: 12345678 / 90        PAN: ABCDE1234F   KYC: OK
 *   HDFC0000123-HDFC ELSS Tax Saver Fund - Growth (Advisor: DIRECT) ... INF179K01BC2
 *   Date        Transaction              Amount     Units      NAV      Unit Balance
 *   05-Apr-2025 Purchase                10,000.00  213.456   46.847      213.456
 *   ...
 *   Closing Unit Balance: 213.456   NAV on 31-Mar-2026: INR 52.310
 *   Market Value on 31-Mar-2026: INR 11,165.79
 *
 * The parser is deliberately transaction-aware rather than summary-only: the
 * 80C claim depends on ELSS *purchases dated inside the financial year*, which
 * a closing-balance summary cannot tell you.
 */

import { extractPdfText } from "@/lib/pdf/extractText"
import { decryptPDF } from "@/server/services/parser/pdf.decrypt"
import { parseRupees } from "./form16.parser"
import type { CASData, CASHolding } from "./types"
import { safeLogError } from "@/server/lib/safe-log"

// ─── Scheme classification ──────────────────────────────────

/**
 * Only ELSS carries a statutory lock-in and an 80C benefit, so it is detected
 * from the scheme name — every ELSS scheme is required to carry "ELSS", "Tax
 * Saver", "Tax Saving" or "Long Term Equity" in its SEBI-registered name.
 */
function isELSSScheme(schemeName: string): boolean {
  return /\bELSS\b|tax\s*saver|tax\s*saving|long\s*term\s*equity/i.test(schemeName)
}

function classify(schemeName: string): CASHolding["category"] {
  if (isELSSScheme(schemeName)) return "ELSS"
  if (/\b(?:liquid|debt|gilt|bond|income|credit risk|overnight|money market|corporate bond|banking\s*(?:and|&)\s*psu)\b/i.test(schemeName)) return "DEBT"
  if (/\b(?:hybrid|balanced|asset allocation|arbitrage|equity savings|multi asset)\b/i.test(schemeName)) return "HYBRID"
  if (/\b(?:equity|large\s*cap|mid\s*cap|small\s*cap|flexi\s*cap|multi\s*cap|index|nifty|sensex|focused|value|contra|dividend yield)\b/i.test(schemeName)) return "EQUITY"
  return "OTHER"
}

// ─── Line-level helpers ─────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** CAS prints dates as DD-MMM-YYYY. */
function parseCasDate(raw: string): Date | null {
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(raw.trim())
  if (!match) return null
  const month = MONTHS[match[2]!.toLowerCase()]
  if (month === undefined) return null
  const date = new Date(Number(match[3]), month, Number(match[1]))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Indian FY containing a date: 1 April YYYY – 31 March YYYY+1. */
function fyOf(date: Date): string {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
  return `${start}-${start + 1}`
}

/**
 * A purchase-side transaction. Redemptions, switches out, and reversals must
 * NOT count towards 80C, and "Purchase - Rejected" rows must be excluded too.
 */
function isPurchaseRow(description: string): boolean {
  if (/reject|reversal|cancel/i.test(description)) return false
  return /purchase|switch\s*in|systematic\s*investment|\bSIP\b|instal?ment/i.test(description)
}

interface SchemeBlock {
  amc: string
  schemeName: string
  folioNumber: string
  isin?: string
  lines: string[]
}

/**
 * Splits the statement into per-scheme blocks.
 *
 * Folio headers and scheme headers alternate: a folio can hold several schemes,
 * so the current folio is carried forward until the next "Folio No" line.
 */
function splitIntoSchemeBlocks(lines: string[]): SchemeBlock[] {
  const blocks: SchemeBlock[] = []
  let currentFolio = ""
  let current: SchemeBlock | null = null

  const folioPattern = /Folio\s*No\.?\s*:?\s*([\d/\s-]+?)(?:\s{2,}|\s*PAN|\s*KYC|$)/i
  // "HDFC0000123-HDFC ELSS Tax Saver Fund - Growth" — registrar scheme code,
  // hyphen, then the scheme name. ISIN, when present, trails the line.
  const schemePattern = /^([A-Z0-9]{4,}[0-9]{3,})\s*-\s*(.+?)(?:\s*\(Advisor.*?\))?\s*(?:\b(INF[A-Z0-9]{9})\b)?\s*$/

  for (const line of lines) {
    const folioMatch = folioPattern.exec(line)
    if (folioMatch) {
      currentFolio = folioMatch[1]!.replace(/\s+/g, "").replace(/\/$/, "")
      continue
    }

    const schemeMatch = schemePattern.exec(line.trim())
    if (schemeMatch) {
      const rawName = schemeMatch[2]!.trim()
      // The AMC name is the leading words of the scheme name up to "Fund".
      const amc = /^([A-Za-z&.\s]+?)\s+(?:Mutual\s+Fund|MF|Fund|ELSS|Tax)/i.exec(rawName)?.[1]?.trim()
        ?? rawName.split(/\s+/).slice(0, 2).join(" ")

      current = {
        amc,
        schemeName: rawName,
        folioNumber: currentFolio,
        isin: schemeMatch[3],
        lines: [],
      }
      blocks.push(current)
      continue
    }

    if (current) current.lines.push(line)
  }

  return blocks
}

/**
 * Parses a plain decimal number.
 *
 * Distinct from parseRupees, which caps at two decimal places because it is a
 * money parser. Mutual fund units and NAVs are quoted to three or four decimals
 * ("1377.2160", "333.2670"), and feeding those through the money parser
 * silently yields null — which showed up as every holding reporting zero units.
 */
function parseDecimal(raw: string | undefined | null): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[,\s]/g, "").trim()
  if (!/^-?\d+(\.\d{1,6})?$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** Pulls closing units, closing NAV and market value out of a scheme block. */
function readClosingFigures(blockLines: string[]): {
  units: number
  nav: number
  marketValue: number
} {
  const text = blockLines.join("\n")

  const units =
    parseDecimal(/closing\s+unit\s+balance\s*:?\s*([\d,]+\.?\d*)/i.exec(text)?.[1]) ?? 0
  const nav =
    parseDecimal(/NAV\s+on\s+[\d]{1,2}-[A-Za-z]{3}-\d{4}\s*:?\s*(?:INR)?\s*([\d,]+\.?\d*)/i.exec(text)?.[1]) ?? 0
  const marketValue =
    parseDecimal(/market\s+value\s+on\s+[\d]{1,2}-[A-Za-z]{3}-\d{4}\s*:?\s*(?:INR)?\s*([\d,]+\.?\d*)/i.exec(text)?.[1]) ?? 0

  return { units, nav, marketValue: marketValue || units * nav }
}

/**
 * Sums transaction amounts inside a scheme block.
 *
 * Returns net invested cost (purchases minus redemption cost basis is not
 * derivable from CAS alone, so this is purchase-side cost, which is what the
 * "invested value" column on the statement represents) and purchases falling
 * inside the requested financial year.
 */
function readTransactions(
  blockLines: string[],
  financialYear: string | undefined
): { invested: number; purchasesInFY: number } {
  let invested = 0
  let purchasesInFY = 0

  for (const line of blockLines) {
    const dateMatch = /^(\d{1,2}-[A-Za-z]{3}-\d{4})\s+(.*)$/.exec(line.trim())
    if (!dateMatch) continue

    const date = parseCasDate(dateMatch[1]!)
    if (!date) continue

    const rest = dateMatch[2]!
    // Amount is the first money-looking column after the description.
    const figures = (rest.match(/\(?-?[\d,]+\.\d{2}\)?/g) ?? [])
      .map((f) => parseRupees(f))
      .filter((n): n is number => n !== null)

    if (figures.length === 0) continue
    const amount = figures[0]!

    if (isPurchaseRow(rest) && amount > 0) {
      invested += amount
      if (!financialYear || fyOf(date) === financialYear) {
        purchasesInFY += amount
      }
    } else if (/redemption|switch\s*out/i.test(rest)) {
      invested -= Math.abs(amount)
    }
  }

  return { invested: Math.max(0, invested), purchasesInFY }
}

// ─── Main parser ────────────────────────────────────────────

export interface CASParseOptions {
  /** CAS PDF password, set by the user when requesting the statement. */
  password?: string
  /**
   * Financial year, long form ("2025-2026"), that scopes the 80C total.
   * Omitted means "count every ELSS purchase in the statement".
   */
  financialYear?: string
}

export async function parseCAS(buffer: Buffer, options: CASParseOptions = {}): Promise<CASData> {
  let text: string

  try {
    const decrypted = await decryptPDF(buffer, options.password)
    const extracted = await extractPdfText(decrypted.buffer)
    text = extracted.text
  } catch (error) {
    safeLogError("[CAS] Text extraction failed", error)
    throw new Error("Could not read this CAS PDF. CAS statements are always password-protected — supply the password you set when requesting it.")
  }

  return parseCASText(text, options.financialYear)
}

/** Exported for tests and for re-parsing already-extracted text. */
export function parseCASText(rawText: string, financialYear?: string): CASData {
  const warnings: string[] = []
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean)

  const blocks = splitIntoSchemeBlocks(lines)

  const holdings: CASHolding[] = []
  let elss80C = 0

  for (const block of blocks) {
    const { units, nav, marketValue } = readClosingFigures(block.lines)
    const { invested, purchasesInFY } = readTransactions(block.lines, financialYear)

    // A fully redeemed folio still prints in the statement with zero units; it
    // is not a holding, but its ELSS purchases in the year still count for 80C.
    const isELSS = isELSSScheme(block.schemeName)
    if (isELSS) elss80C += purchasesInFY

    if (units <= 0 && invested <= 0) continue

    holdings.push({
      amc: block.amc,
      schemeName: block.schemeName,
      folioNumber: block.folioNumber,
      isin: block.isin,
      units,
      currentNav: nav,
      investedValue: invested,
      currentValue: marketValue,
      category: classify(block.schemeName),
      isELSS,
    })
  }

  if (holdings.length === 0) {
    warnings.push("No mutual fund folios were recognised in this statement. Confirm you uploaded a CAMS/KFintech Consolidated Account Statement (detailed transaction version, not the summary).")
  }

  const investorPan = /\bPAN\s*:?\s*([A-Z]{5}\d{4}[A-Z])\b/i.exec(rawText)?.[1]
  const investorEmail = /\b([\w.+-]+@[\w-]+\.[\w.]{2,})\b/.exec(rawText)?.[1]
  const periodMatch = /(\d{1,2}-[A-Za-z]{3}-\d{4})\s*(?:to|-)\s*(\d{1,2}-[A-Za-z]{3}-\d{4})/.exec(rawText)

  const totals = holdings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.investedValue,
      current: acc.current + h.currentValue,
      elss80CContribution: acc.elss80CContribution,
    }),
    { invested: 0, current: 0, elss80CContribution: elss80C }
  )

  if (elss80C > 150000) {
    warnings.push(`ELSS purchases of Rs. ${Math.round(elss80C).toLocaleString("en-IN")} exceed the Rs. 1,50,000 Section 80C ceiling; only the ceiling is deductible.`)
  }

  return {
    investorPan,
    investorEmail,
    statementPeriod: periodMatch ? { from: periodMatch[1]!, to: periodMatch[2]! } : undefined,
    holdings,
    totals,
    parseWarnings: warnings,
  }
}

/**
 * Portfolio XIRR is not derivable from closing balances alone — it needs the
 * dated cash flows. This computes it from the transaction rows using
 * Newton-Raphson with a bisection fallback, matching what INDmoney/Zerodha show.
 */
export function computeXIRR(
  cashFlows: Array<{ date: Date; amount: number }>,
  guess = 0.1
): number | null {
  if (cashFlows.length < 2) return null

  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const t0 = sorted[0]!.date.getTime()
  const years = sorted.map((cf) => (cf.date.getTime() - t0) / (365.25 * 24 * 3600 * 1000))
  const amounts = sorted.map((cf) => cf.amount)

  // XIRR is undefined without both an outflow and an inflow.
  if (!amounts.some((a) => a > 0) || !amounts.some((a) => a < 0)) return null

  const npv = (rate: number) =>
    amounts.reduce((sum, amount, i) => sum + amount / Math.pow(1 + rate, years[i]!), 0)

  let rate = guess
  for (let i = 0; i < 100; i++) {
    const value = npv(rate)
    if (Math.abs(value) < 1e-6) return rate

    const derivative = amounts.reduce(
      (sum, amount, i2) => sum - (years[i2]! * amount) / Math.pow(1 + rate, years[i2]! + 1),
      0
    )
    if (Math.abs(derivative) < 1e-12) break

    const next = rate - value / derivative
    if (!Number.isFinite(next) || next <= -0.9999) break
    if (Math.abs(next - rate) < 1e-9) return next
    rate = next
  }

  // Newton diverged (common with irregular SIP flows) — bisect instead.
  let low = -0.9999
  let high = 10
  if (npv(low) * npv(high) > 0) return null

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2
    const value = npv(mid)
    if (Math.abs(value) < 1e-6) return mid
    if (npv(low) * value < 0) high = mid
    else low = mid
  }

  return (low + high) / 2
}
