// ─── Layer 3: Position-Aware Table Extraction ───────────────
// Uses x/y coordinates from pdf.js-extract to correctly assign
// text items to table columns, solving the column-jumbling problem.

import type { BankProfile } from "./bank-profiles"
import type { PositionedPage, PositionedTextItem, ColumnType, DetectedColumn, TableRow } from "./pdf.types"
import { categorizeTransaction } from "./categorizer"
import { computeHash } from "./deduplicator"
import type { ParsedTransaction } from "./deduplicator"

// ─── Configuration ──────────────────────────────────────────

/** Vertical tolerance for grouping text items into the same row (in PDF points) */
const Y_TOLERANCE = 3

/** Minimum number of columns required to consider a row as a table header */
const MIN_HEADER_COLUMNS = 3

// ─── Main Export ────────────────────────────────────────────

/**
 * Extract transactions from positioned PDF pages using the bank profile.
 *
 * Algorithm:
 * 1. Group all text items into rows by y-coordinate
 * 2. Find the header row using column keywords from the profile
 * 3. Record column x-positions from the header
 * 4. Assign each subsequent row's items to columns based on x-position
 * 5. Parse each row into a ParsedTransaction
 */
export function extractTransactions(
  pages: PositionedPage[],
  profile: BankProfile
): ParsedTransaction[] {
  const allTransactions: ParsedTransaction[] = []

  for (const page of pages) {
    const rows = groupIntoRows(page.content)
    const { columns, headerRowIndex } = detectColumns(rows, profile)

    if (!columns.length || headerRowIndex === -1) {
      continue // No table found on this page
    }

    // Determine table boundaries
    const tableEndIndex = findTableEnd(rows, headerRowIndex, profile)

    // Parse transaction rows (everything between header and end)
    const transactions = parseTransactionRows(
      rows,
      headerRowIndex + 1,
      tableEndIndex,
      columns,
      profile
    )

    allTransactions.push(...transactions)
  }

  return allTransactions
}

// ─── Row Grouping ───────────────────────────────────────────

/**
 * Group text items into rows by y-coordinate.
 * Items within Y_TOLERANCE of each other are considered part of the same row.
 * Returns rows sorted top-to-bottom, with items within each row sorted left-to-right.
 */
function groupIntoRows(items: PositionedTextItem[]): Array<{ y: number; items: PositionedTextItem[] }> {
  if (!items.length) return []

  // Sort by y (top to bottom), then x (left to right)
  const sorted = [...items]
    .filter((item) => item.str.trim().length > 0)
    .sort((a, b) => a.y - b.y || a.x - b.x)

  const rows: Array<{ y: number; items: PositionedTextItem[] }> = []
  let currentRow: { y: number; items: PositionedTextItem[] } = {
    y: sorted[0]!.y,
    items: [sorted[0]!],
  }

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]!
    if (Math.abs(item.y - currentRow.y) <= Y_TOLERANCE) {
      // Same row
      currentRow.items.push(item)
    } else {
      // New row
      rows.push(currentRow)
      currentRow = { y: item.y, items: [item] }
    }
  }
  rows.push(currentRow)

  // Sort items within each row left-to-right
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x)
  }

  return rows
}

// ─── Column Detection ───────────────────────────────────────

/**
 * Find the table header row and detect column boundaries.
 *
 * Scans each row for text items matching the column keywords from the bank profile.
 * When enough columns match (>= MIN_HEADER_COLUMNS), that row is the header.
 * Column x-positions are recorded for use in assigning data cells.
 */
function detectColumns(
  rows: Array<{ y: number; items: PositionedTextItem[] }>,
  profile: BankProfile
): { columns: DetectedColumn[]; headerRowIndex: number } {
  const columnKeywords: Array<{ type: ColumnType; keywords: string[] }> = [
    { type: "date", keywords: profile.columns.date },
    { type: "description", keywords: profile.columns.description },
    { type: "debit", keywords: profile.columns.debit },
    { type: "credit", keywords: profile.columns.credit },
    { type: "balance", keywords: profile.columns.balance },
  ]

  if (profile.columns.reference?.length) {
    columnKeywords.push({ type: "reference", keywords: profile.columns.reference })
  }
  if (profile.columns.valueDate?.length) {
    columnKeywords.push({ type: "valueDate", keywords: profile.columns.valueDate })
  }

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]!
    const rowText = row.items.map((item) => item.str.trim()).join(" ")
    const detectedCols: DetectedColumn[] = []

    for (const { type, keywords } of columnKeywords) {
      const match = findColumnInRow(row.items, keywords)
      if (match) {
        detectedCols.push({
          type,
          xStart: match.xStart,
          xEnd: match.xEnd,
        })
      }
    }

    // Need at least date + one amount column + description to be a valid header
    const hasDate = detectedCols.some((c) => c.type === "date")
    const hasDesc = detectedCols.some((c) => c.type === "description")
    const hasAmount = detectedCols.some((c) => c.type === "debit" || c.type === "credit")

    if (detectedCols.length >= MIN_HEADER_COLUMNS && hasDate && hasDesc && hasAmount) {
      // Expand column boundaries to fill gaps
      const expandedCols = expandColumnBoundaries(detectedCols, rows[rowIdx]!)
      return { columns: expandedCols, headerRowIndex: rowIdx }
    }
  }

  return { columns: [], headerRowIndex: -1 }
}

/**
 * Search for a column keyword match in a row's items.
 * Handles multi-word keywords by concatenating adjacent items.
 */
function findColumnInRow(
  items: PositionedTextItem[],
  keywords: string[]
): { xStart: number; xEnd: number } | null {
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase().trim()

    // Try single-item match first
    for (const item of items) {
      if (item.str.trim().toLowerCase() === keywordLower) {
        return { xStart: item.x, xEnd: item.x + item.width }
      }
    }

    // Try concatenating adjacent items for multi-word keywords
    for (let i = 0; i < items.length; i++) {
      let concat = items[i]!.str.trim()
      let endX = items[i]!.x + items[i]!.width

      for (let j = i + 1; j < Math.min(i + 4, items.length); j++) {
        concat += " " + items[j]!.str.trim()
        endX = items[j]!.x + items[j]!.width

        if (concat.toLowerCase() === keywordLower) {
          return { xStart: items[i]!.x, xEnd: endX }
        }
      }
    }

    // Try partial/contains match for headers like "Withdrawal Amt."
    for (const item of items) {
      const itemText = item.str.trim().toLowerCase()
      if (itemText.length > 2 && keywordLower.includes(itemText) && itemText.length >= keywordLower.length * 0.6) {
        return { xStart: item.x, xEnd: item.x + item.width }
      }
    }
  }

  return null
}

/**
 * Expand column boundaries so they cover the full width between columns.
 * This ensures data cells that are slightly offset from headers are still captured.
 */
function expandColumnBoundaries(
  columns: DetectedColumn[],
  headerRow: { y: number; items: PositionedTextItem[] }
): DetectedColumn[] {
  // Sort by xStart
  const sorted = [...columns].sort((a, b) => a.xStart - b.xStart)

  const expanded = sorted.map((col, i) => {
    const prevEnd = i > 0 ? sorted[i - 1]!.xEnd : 0
    const nextStart = i < sorted.length - 1 ? sorted[i + 1]!.xStart : Infinity

    return {
      type: col.type,
      xStart: (col.xStart + prevEnd) / 2,  // Midpoint between prev column end and this start
      xEnd: i < sorted.length - 1
        ? (col.xEnd + nextStart) / 2        // Midpoint between this end and next start
        : Infinity,                         // Last column extends to right edge
    }
  })

  // Ensure first column starts at 0
  if (expanded.length > 0) {
    expanded[0]!.xStart = 0
  }

  return expanded
}

// ─── Table Boundaries ───────────────────────────────────────

/**
 * Find the row index where the transaction table ends.
 * Scans for end markers or returns the last row index.
 */
function findTableEnd(
  rows: Array<{ y: number; items: PositionedTextItem[] }>,
  headerRowIndex: number,
  profile: BankProfile
): number {
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const rowText = rows[i]!.items.map((item) => item.str.trim()).join(" ").toLowerCase()

    for (const marker of profile.tableEndMarkers) {
      if (rowText.includes(marker.toLowerCase())) {
        return i
      }
    }
  }

  return rows.length
}

// ─── Transaction Row Parsing ────────────────────────────────

/**
 * Parse rows between header and end into ParsedTransaction objects.
 * Handles multi-line descriptions (continuation rows without dates).
 */
function parseTransactionRows(
  rows: Array<{ y: number; items: PositionedTextItem[] }>,
  startIndex: number,
  endIndex: number,
  columns: DetectedColumn[],
  profile: BankProfile
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  let pendingDescription = ""
  let pendingTransaction: Partial<ParsedTransaction> | null = null

  for (let i = startIndex; i < endIndex; i++) {
    const row = rows[i]!
    const cells = assignItemsToColumns(row.items, columns)

    const dateStr = cells.get("date")?.trim() || ""
    const date = dateStr ? parseTransactionDate(dateStr, profile.dateFormats) : null

    if (date) {
      // Flush previous pending transaction
      if (pendingTransaction) {
        const finalized = finalizeTransaction(pendingTransaction, pendingDescription, profile)
        if (finalized) transactions.push(finalized)
      }

      // Start new transaction
      const descText = cells.get("description")?.trim() || ""
      const debitStr = cells.get("debit")?.trim() || ""
      const creditStr = cells.get("credit")?.trim() || ""
      const balanceStr = cells.get("balance")?.trim() || ""

      const debitAmt = parseAmount(debitStr, profile)
      const creditAmt = parseAmount(creditStr, profile)
      const balance = parseAmount(balanceStr, profile) || undefined

      pendingTransaction = {
        date,
        amount: creditAmt > 0 ? creditAmt : debitAmt,
        type: creditAmt > 0 ? "credit" : "debit",
        balance,
      }
      pendingDescription = descText
    } else if (pendingTransaction) {
      // Continuation row — append description text
      const descText = cells.get("description")?.trim() || ""
      const fallbackText = row.items.map((item) => item.str.trim()).filter(Boolean).join(" ")
      const extraText = descText || fallbackText

      if (extraText && !looksLikeAmountOnly(extraText)) {
        pendingDescription += " " + extraText
      }
    }
  }

  // Flush last pending transaction
  if (pendingTransaction) {
    const finalized = finalizeTransaction(pendingTransaction, pendingDescription, profile)
    if (finalized) transactions.push(finalized)
  }

  return transactions
}

/**
 * Assign text items from a row to their respective columns based on x-position.
 */
function assignItemsToColumns(
  items: PositionedTextItem[],
  columns: DetectedColumn[]
): Map<ColumnType, string> {
  const cells = new Map<ColumnType, string>()

  for (const item of items) {
    const centerX = item.x + item.width / 2

    // Find which column this item belongs to
    for (const col of columns) {
      if (centerX >= col.xStart && centerX < col.xEnd) {
        const existing = cells.get(col.type) || ""
        cells.set(col.type, existing ? existing + " " + item.str : item.str)
        break
      }
    }
  }

  return cells
}

/**
 * Finalize a pending transaction: categorize, hash, and validate.
 */
function finalizeTransaction(
  partial: Partial<ParsedTransaction>,
  rawDescription: string,
  profile: BankProfile
): ParsedTransaction | null {
  const { date, amount, type, balance } = partial

  if (!date || !amount || amount <= 0 || !type) return null

  const cleanedDesc = rawDescription.replace(/\s{2,}/g, " ").trim()
  if (!cleanedDesc) return null

  const cat = categorizeTransaction(cleanedDesc, amount, type)
  const hash = computeHash(date, amount, cleanedDesc)

  return {
    date,
    description: cat.merchant || cleanedDesc,
    rawDescription: cleanedDesc,
    amount,
    type,
    balance,
    category: cat.category,
    subcategory: cat.subcategory,
    merchant: cat.merchant,
    isRecurring: cat.isRecurring,
    paymentMethod: detectPaymentMethod(cleanedDesc),
    hash,
  }
}

// ─── Amount Parsing ─────────────────────────────────────────

/**
 * Parse an amount string using the bank profile's amount format settings.
 */
function parseAmount(str: string, profile: BankProfile): number {
  if (!str) return 0

  let cleaned = str.trim()

  // Handle Dr/Cr suffixes
  if (profile.amountFormat.usesDrCr) {
    cleaned = cleaned.replace(/\s*(Dr|Cr)\.?\s*$/i, "")
  }

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[₹$€£¥\s]/g, "")

  // Handle thousands separator
  if (profile.amountFormat.thousandsSep === ",") {
    cleaned = cleaned.replace(/,/g, "")
  } else if (profile.amountFormat.thousandsSep === ".") {
    // European style: 1.234,56 → 1234.56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".")
  }

  // Handle negative signs
  cleaned = cleaned.replace(/[()]/g, "") // Remove parentheses indicating negative

  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : Math.abs(value)
}

// ─── Date Parsing ───────────────────────────────────────────

/**
 * Parse a date string using the bank's preferred date formats.
 */
function parseTransactionDate(str: string, dateFormats: string[]): Date | null {
  if (!str) return null
  const cleaned = str.trim()

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy4 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (dmy4) {
    const [, d, m, y] = dmy4
    // Determine if DD/MM or MM/DD based on profile date formats
    const isMonthFirst = dateFormats.some((f) => f.startsWith("MM"))
    const month = isMonthFirst ? parseInt(d!) : parseInt(m!)
    const day = isMonthFirst ? parseInt(m!) : parseInt(d!)
    const date = new Date(parseInt(y!), month - 1, day)
    return isNaN(date.getTime()) ? null : date
  }

  // DD/MM/YY or DD-MM-YY
  const dmy2 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})$/)
  if (dmy2) {
    const [, d, m, y] = dmy2
    const year = parseInt(y!) + 2000
    const month = parseInt(m!)
    const day = parseInt(d!)
    const date = new Date(year, month - 1, day)
    return isNaN(date.getTime()) ? null : date
  }

  // DD MMM YYYY or DD-MMM-YYYY or DD MMM YY (e.g. "01 Mar 2025", "01-Mar-25")
  const dMonY = cleaned.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})$/)
  if (dMonY) {
    const [, d, mon, y] = dMonY
    const yearStr = y!.length === 2 ? `20${y}` : y
    const date = new Date(`${mon} ${d}, ${yearStr}`)
    return isNaN(date.getTime()) ? null : date
  }

  // Fallback
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

// ─── Utility Helpers ────────────────────────────────────────

/**
 * Check if a text string looks like it's only amounts (no description content).
 * Used to avoid appending stray amount strings to descriptions.
 */
function looksLikeAmountOnly(text: string): boolean {
  return /^[\d,.\s₹$€£¥()\-DrCr]+$/.test(text.trim())
}

/**
 * Detect payment method from transaction description.
 */
function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase()
  if (lower.includes("upi")) return "upi"
  if (lower.includes("neft")) return "neft"
  if (lower.includes("rtgs")) return "neft"
  if (lower.includes("imps")) return "imps"
  if (lower.includes("atm") || lower.includes("cash withdrawal")) return "cash"
  if (lower.includes("credit card") || lower.includes("cc ")) return "credit_card"
  if (lower.includes("debit card")) return "debit_card"
  if (lower.includes("auto debit") || lower.includes("nach") || lower.includes("ecs")) return "auto_debit"
  if (lower.includes("cheque") || lower.includes("chq") || lower.includes("chqclg")) return "cheque"
  return "net_banking"
}
