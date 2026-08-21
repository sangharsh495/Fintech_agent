/**
 * server/services/tax/ais.parser.ts
 *
 * Extracts the Annual Information Statement (AIS) and Taxpayer Information
 * Summary (TIS) into a normalised shape.
 *
 * The income tax portal offers AIS as a JSON download and as a
 * password-protected PDF. The JSON path is authoritative and is preferred; the
 * PDF path is a label-anchored fallback for users who only saved the PDF.
 *
 * AIS JSON has no published stable schema — key names differ between the
 * portal's own export and third-party re-exports — so the reader walks the
 * document generically, matching on information-category descriptions rather
 * than on fixed key paths.
 */

import { extractPdfText } from "@/lib/pdf/extractText"
import { decryptPDF } from "@/server/services/parser/pdf.decrypt"
import { PasswordRequiredError } from "@/server/services/parser/pdf.types"
import { parseRupees } from "./form16.parser"
import type { AISData, AISEntry } from "./types"
import { safeLogError } from "@/server/lib/safe-log"

// ─── Category classification ────────────────────────────────

/**
 * AIS information descriptions mapped to the bucket that drives the return.
 * Matching is substring-based and case-insensitive; the first hit wins, so
 * more specific phrases are listed before broader ones.
 */
const CATEGORY_RULES: Array<{ match: RegExp; bucket: keyof AISData["totals"] }> = [
  { match: /salary/i, bucket: "salary" },
  { match: /interest\s+from\s+savings\s+bank/i, bucket: "interestSavings" },
  { match: /interest\s+from\s+(?:deposit|term deposit|fixed deposit|others?)/i, bucket: "interestDeposits" },
  { match: /\bdividend\b/i, bucket: "dividend" },
  { match: /rent\s+received|receipt\s+of\s+rent/i, bucket: "rent" },
  { match: /sale\s+of\s+securities|sale\s+of\s+(?:equity|units)/i, bucket: "securitiesSaleValue" },
  { match: /purchase\s+of\s+mutual\s+fund|mutual\s+fund\s+purchase/i, bucket: "mutualFundPurchases" },
]

function bucketFor(description: string): keyof AISData["totals"] {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(description)) return rule.bucket
  }
  return "other"
}

function emptyTotals(): AISData["totals"] {
  return {
    salary: 0,
    interestSavings: 0,
    interestDeposits: 0,
    dividend: 0,
    rent: 0,
    securitiesSaleValue: 0,
    mutualFundPurchases: 0,
    other: 0,
    totalTds: 0,
  }
}

function accumulate(totals: AISData["totals"], entries: AISEntry[]): AISData["totals"] {
  for (const entry of entries) {
    const bucket = bucketFor(entry.category)
    totals[bucket] += entry.amount
    totals.totalTds += entry.tdsDeducted
  }
  return totals
}

// ─── JSON path ──────────────────────────────────────────────

/** Field-name candidates, checked case-insensitively against each object. */
const AMOUNT_KEYS = ["amount", "value", "amountpaid", "amtcredited", "grossamount", "totalamount", "amountcredited"]
const TDS_KEYS = ["tds", "tdsamount", "taxdeducted", "amountoftaxdeducted", "tdstcs"]
const DESCRIPTION_KEYS = ["information description", "informationdescription", "description", "infodesc", "category", "informationcategory", "head"]
const SOURCE_KEYS = ["informationsource", "source", "deductorname", "name", "payername", "reportingentity"]
const SECTION_KEYS = ["section", "tdssection", "sectioncode"]

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  const lowered = new Map(Object.keys(record).map((k) => [k.toLowerCase().replace(/[^a-z]/g, ""), k]))
  for (const key of keys) {
    const actual = lowered.get(key.replace(/[^a-z]/g, ""))
    if (actual !== undefined) {
      const value = record[actual]
      if (value !== null && value !== undefined && value !== "") return value
    }
  }
  return undefined
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") return parseRupees(value) ?? 0
  return 0
}

/**
 * Walks an arbitrary AIS JSON tree and collects every object that looks like an
 * information row: something carrying both a description and an amount.
 */
function collectEntries(node: unknown, out: AISEntry[], depth = 0): void {
  if (depth > 12 || node === null || typeof node !== "object") return

  if (Array.isArray(node)) {
    for (const item of node) collectEntries(item, out, depth + 1)
    return
  }

  const record = node as Record<string, unknown>
  const description = pick(record, DESCRIPTION_KEYS)
  const amount = pick(record, AMOUNT_KEYS)

  if (typeof description === "string" && amount !== undefined) {
    const value = toNumber(amount)
    if (value !== 0) {
      out.push({
        category: description.trim(),
        source: typeof pick(record, SOURCE_KEYS) === "string" ? String(pick(record, SOURCE_KEYS)).trim() : undefined,
        amount: value,
        tdsDeducted: toNumber(pick(record, TDS_KEYS)),
        section: pick(record, SECTION_KEYS) !== undefined ? String(pick(record, SECTION_KEYS)) : undefined,
      })
    }
  }

  for (const value of Object.values(record)) {
    collectEntries(value, out, depth + 1)
  }
}

export function parseAISJson(json: unknown): AISData {
  const warnings: string[] = []
  const entries: AISEntry[] = []
  collectEntries(json, entries)

  if (entries.length === 0) {
    warnings.push("No information rows were recognised in this AIS JSON. Confirm you exported the AIS (not the consolidated ITR prefill) file.")
  }

  const root = (json ?? {}) as Record<string, unknown>
  const pan = typeof pick(root, ["pan", "pannumber", "panofassessee"]) === "string"
    ? String(pick(root, ["pan", "pannumber", "panofassessee"]))
    : undefined
  const financialYear = typeof pick(root, ["financialyear", "fy", "assessmentyear"]) === "string"
    ? String(pick(root, ["financialyear", "fy", "assessmentyear"]))
    : undefined

  const documentType: AISData["documentType"] =
    JSON.stringify(json).toLowerCase().includes("taxpayer information summary") ? "TIS" : "AIS"

  return {
    pan,
    financialYear,
    entries,
    totals: accumulate(emptyTotals(), entries),
    documentType,
    parseWarnings: warnings,
  }
}

// ─── PDF path ───────────────────────────────────────────────

/**
 * AIS PDF rows print as:
 *   "Salary  ACME PRIVATE LIMITED  192  12,50,000  1,20,000"
 * i.e. description, source, section, amount, TDS. We anchor on the known
 * information-category phrases and read the figures that follow on the line.
 */
const PDF_CATEGORY_ANCHORS = [
  "Salary",
  "Interest from savings bank",
  "Interest from deposit",
  "Interest from others",
  "Dividend",
  "Rent received",
  "Sale of securities and units of mutual fund",
  "Purchase of mutual fund",
  "Business receipts",
  "Receipts from life insurance policy",
]

/** Escapes regex metacharacters so a label can be matched literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function parseAISText(rawText: string): AISData {
  const text = rawText.replace(/[ \t]{2,}/g, " ")
  const warnings: string[] = []
  const entries: AISEntry[] = []

  for (const anchor of PDF_CATEGORY_ANCHORS) {
    const pattern = new RegExp(escapeRegExp(anchor) + "([^\\n]*)", "gi")
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
      const line = match[1] ?? ""
      const figures = (line.match(/(?:\d{1,3}(?:,\d{2,3})+|\d{4,})(?:\.\d{1,2})?/g) ?? [])
        .map((f) => parseRupees(f))
        .filter((n): n is number => n !== null && n > 0)

      if (figures.length === 0) continue

      // Section codes (192, 194A) are 3-4 digits and appear before the money
      // columns; the trailing figures are amount and, when present, TDS.
      const section = /\b(19[0-9][A-Z]{0,2})\b/.exec(line)?.[1]
      const money = figures.filter((n) => n > 999)
      if (money.length === 0) continue

      entries.push({
        category: anchor,
        section,
        amount: money[0]!,
        tdsDeducted: money.length > 1 ? money[money.length - 1]! : 0,
      })
    }
  }

  if (entries.length === 0) {
    warnings.push("No AIS rows could be read from this PDF. Download the AIS in JSON format from the e-filing portal for a reliable import.")
  } else {
    warnings.push("Figures were read from a PDF layout and should be checked against the portal before filing.")
  }

  const pan = /\b([A-Z]{5}\d{4}[A-Z])\b/.exec(text)?.[1]
  const financialYear = /F\.?Y\.?\s*(\d{4}\s*-\s*\d{2,4})/i.exec(text)?.[1]?.replace(/\s/g, "")
  const documentType: AISData["documentType"] = /taxpayer\s+information\s+summary/i.test(text) ? "TIS" : "AIS"

  return {
    pan,
    financialYear,
    entries,
    totals: accumulate(emptyTotals(), entries),
    documentType,
    parseWarnings: warnings,
  }
}

// ─── Entry point ────────────────────────────────────────────

export interface AISParseOptions {
  /** Password for the AIS PDF — the portal uses PAN (lowercase) + DDMMYYYY. */
  password?: string
}

/**
 * Parses an AIS/TIS upload. `fileName` only decides which reader to try first;
 * a JSON payload with a .pdf name is still handled correctly.
 */
export async function parseAIS(
  buffer: Buffer,
  fileName: string,
  options: AISParseOptions = {}
): Promise<AISData> {
  const looksJson = /\.json$/i.test(fileName) || buffer.subarray(0, 64).toString("utf8").trimStart().startsWith("{")

  if (looksJson) {
    try {
      return parseAISJson(JSON.parse(buffer.toString("utf8")))
    } catch (error) {
      safeLogError("[AIS] JSON parse failed", error)
      throw new Error("This file is not valid AIS JSON. Re-download it from the e-filing portal.")
    }
  }

  try {
    const decrypted = await decryptPDF(buffer, options.password)
    const { text } = await extractPdfText(decrypted.buffer)
    return parseAISText(text)
  } catch (error) {
    if (error instanceof PasswordRequiredError) {
      throw error
    }
    safeLogError("[AIS] PDF parse failed", error)
    throw new Error("Could not read this AIS PDF. If it is password-protected, the password is your PAN in lowercase followed by your date of birth as DDMMYYYY.")
  }
}
