// ─── Layer 3: Position-Aware Table Extraction ───────────────
// Uses x/y coordinates from pdf.js-extract to correctly assign
// text items to table columns, solving the column-jumbling problem.
//
// Enhanced features:
//   - Cross-page column carry-forward (persists column boundaries across pages)
//   - Multi-page transaction continuity (stitches rows spanning page breaks)
//   - Fallback regex-based line parser when position-aware detection fails
//   - Dr/Cr suffix handling via bank-specific amount format profiles
//   - Balance tracking with data-quality validation
//   - Multi-word header keyword tolerance (concatenates adjacent items)

import type { BankProfile } from "./bank-profiles"
import type { PositionedPage, PositionedTextItem, ColumnType, DetectedColumn } from "./pdf.types"
import { categorizeTransaction } from "./categorizer"
import { computeHash } from "./deduplicator"
import type { ParsedTransaction } from "./deduplicator"

// ─── Configuration ──────────────────────────────────────────

/** Vertical tolerance for grouping text items into the same row (in PDF points) */
const Y_TOLERANCE = 3

/** Minimum number of columns required to consider a row as a table header */
const MIN_HEADER_COLUMNS = 3

/** Maximum x-position shift allowed when carrying columns across pages */
const MAX_COLUMN_SHIFT = 15

// ─── Main Export ────────────────────────────────────────────

/**
 * Extract transactions from positioned PDF pages using the bank profile.
 *
 * Algorithm (enhanced):
 * 1. Detect column boundaries on the first page where a header is found
 * 2. Carry column boundaries to subsequent pages (cross-page persistence)
 * 3. Group all text items into rows by y-coordinate
 * 4. Identify table sections (header-to-end-marker) across pages
 * 5. Assign each row's items to columns based on x-position
 * 6. Handle rows spanning pages (multi-page transaction stitching)
 * 7. Fallback to regex parsing if position-aware extraction fails
 */
export function extractTransactions(
  pages: PositionedPage[],
  profile: BankProfile
): ParsedTransaction[] {
  // ── Try position-aware extraction first ──
  const allTransactions: ParsedTransaction[] = []
  let persistedColumns: DetectedColumn[] = []
  let pendingTransactionBuffer: {
    transaction: Partial<ParsedTransaction>
    description: string
    lastDate: Date | null
  } | null = null

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx]!
    const rows = groupIntoRows(page.content)

    // ── Detect or inherit columns ──
    let columns: DetectedColumn[] = persistedColumns
    let headerRowIndex = -1

    if (persistedColumns.length === 0 || pageIdx === 0) {
      // Try to detect columns on this page
      const detection = detectColumns(rows, profile)
      columns = detection.columns
      headerRowIndex = detection.headerRowIndex

      if (columns.length > 0) {
        persistedColumns = columns
      } else if (pageIdx > 0) {
        // No new column detection, but we have persisted columns from prior pages
        headerRowIndex = findApproximateHeaderRow(rows, persistedColumns)
      }
    } else {
      // Use persisted columns — adjust for slight position shifts
      columns = adjustColumnsForPage(persistedColumns, rows, page)
      headerRowIndex = findApproximateHeaderRow(rows, columns)
    }

    if (!columns.length || headerRowIndex === -1) {
      // No table detectable on this page — flush any pending row
      if (pendingTransactionBuffer) {
        const finalized = finalizeTransaction(
          pendingTransactionBuffer.transaction,
          pendingTransactionBuffer.description,
          profile
        )
        if (finalized) allTransactions.push(finalized)
        pendingTransactionBuffer = null
      }
      continue
    }

    // ── Determine table boundaries ──
    const tableEndIndex = findTableEnd(rows, headerRowIndex, profile)

    // ── Parse rows ──
    const result = parseTransactionRowsWithContinuity(
      rows,
      headerRowIndex + 1,
      tableEndIndex,
      columns,
      profile,
      pendingTransactionBuffer,
      pageIdx === pages.length - 1 // isLastPage
    )

    allTransactions.push(...result.transactions)
    pendingTransactionBuffer = result.pending
  }

  // Flush any final pending transaction
  if (pendingTransactionBuffer) {
    const finalized = finalizeTransaction(
      pendingTransactionBuffer.transaction,
      pendingTransactionBuffer.description,
      profile
    )
    if (finalized) allTransactions.push(finalized)
  }

  // ── Fallback: regex-based extraction if position-aware yielded nothing ──
  if (allTransactions.length === 0 && pages.length > 0) {
    console.warn("[PDF TABLE] Position-aware extraction yielded 0 transactions. Falling back to regex parsing.")
    return fallbackRegexExtraction(pages, profile)
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
      currentRow.items.push(item)
    } else {
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
 * Now handles multi-word header keywords by concatenating adjacent items.
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

  // Try broader detection: look for keywords in first X rows (not just exact header)
  const scanLimit = Math.min(15, rows.length)

  for (let rowIdx = 0; rowIdx < scanLimit; rowIdx++) {
    const row = rows[rowIdx]!

    // Try exact match first
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
      const expandedCols = expandColumnBoundaries(detectedCols, row)
      return { columns: expandedCols, headerRowIndex: rowIdx }
    }

    // If exact match fails, try fuzzier matching on concatenated row text
    if (rowIdx < 5) {
      const rowText = row.items.map((item) => item.str.trim()).join(" ").toLowerCase()
      const hasTableKeywords = profile.tableStartMarkers.some((m) =>
        rowText.includes(m.toLowerCase())
      )
      if (hasTableKeywords) {
        // This row mentions table markers — do a broader column search
        const fuzzyCols = detectColumnsFromRowText(row.items, profile)
        if (fuzzyCols.length >= MIN_HEADER_COLUMNS) {
          return { columns: fuzzyCols, headerRowIndex: rowIdx }
        }
      }
    }
  }

  return { columns: [], headerRowIndex: -1 }
}

/**
 * Broader column detection: scan each item's text for partial keyword matches
 * and assign columns based on typical left-to-right ordering.
 */
function detectColumnsFromRowText(
  items: PositionedTextItem[],
  profile: BankProfile
): DetectedColumn[] {
  const columnOrder: ColumnType[] = ["date", "valueDate", "description", "debit", "credit", "balance", "reference"]
  const detected: DetectedColumn[] = []
  const assignedTypes = new Set<ColumnType>()

  for (const item of items) {
    const text = item.str.trim().toLowerCase()
    if (text.length < 2) continue

    for (const type of columnOrder) {
      if (assignedTypes.has(type)) continue
      const keywords = getKeywordsForType(profile, type)
      const matches = keywords.some((kw) =>
        text.includes(kw.toLowerCase()) || kw.toLowerCase().includes(text)
      )
      if (matches) {
        detected.push({
          type,
          xStart: item.x,
          xEnd: item.x + item.width,
        })
        assignedTypes.add(type)
        break
      }
    }
  }

  if (detected.length >= MIN_HEADER_COLUMNS) {
    return expandColumnBoundaries(detected, { y: 0, items })
  }

  return []
}

function getKeywordsForType(profile: BankProfile, type: ColumnType): string[] {
  switch (type) {
    case "date": return profile.columns.date
    case "description": return profile.columns.description
    case "debit": return profile.columns.debit
    case "credit": return profile.columns.credit
    case "balance": return profile.columns.balance
    case "reference": return profile.columns.reference ?? []
    case "valueDate": return profile.columns.valueDate ?? []
  }
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

      // Increased window from 4 to 6 for longer header phrases
      for (let j = i + 1; j < Math.min(i + 6, items.length); j++) {
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
      xStart: (col.xStart + prevEnd) / 2,
      xEnd: i < sorted.length - 1
        ? (col.xEnd + nextStart) / 2
        : Infinity,
    }
  })

  // Ensure first column starts at 0
  if (expanded.length > 0) {
    expanded[0]!.xStart = 0
  }

  return expanded
}

// ─── Cross-Page Column Persistence ──────────────────────────

/**
 * Adjust persisted columns for a new page (accounting for slight x-position shifts).
 * If columns shifted beyond MAX_COLUMN_SHIFT, re-detect.
 */
function adjustColumnsForPage(
  persistedColumns: DetectedColumn[],
  rows: Array<{ y: number; items: PositionedTextItem[] }>,
  _page: PositionedPage
): DetectedColumn[] {
  // Page width shifts are tolerated up to MAX_COLUMN_SHIFT * 2.
  // Re-detection path handles extreme layout changes.
  // Try to find an approximate header row and measure column shifts
  const approxRow = findApproximateHeaderRow(rows, persistedColumns)
  if (approxRow === -1) return persistedColumns // No shift measurable, assume same

  const headerRow = rows[approxRow]!
  let shiftDetected = 0

  // Measure actual item positions vs expected column boundaries
  for (const item of headerRow.items) {
    const centerX = item.x + item.width / 2
    for (const col of persistedColumns) {
      if (centerX >= col.xStart - MAX_COLUMN_SHIFT && centerX <= col.xEnd + MAX_COLUMN_SHIFT) {
        // Item is in roughly the right position — minor shift
        const expectedCenter = (col.xStart + col.xEnd) / 2
        const itemShift = Math.abs(centerX - expectedCenter)
        if (itemShift > shiftDetected) shiftDetected = itemShift
        break
      }
    }
  }

  if (shiftDetected > MAX_COLUMN_SHIFT * 2) {
    // Significant layout shift — columns need re-detection
    return persistedColumns
  }

  // Columns are stable enough — return as-is with tolerance padding
  return persistedColumns.map((col) => ({
    type: col.type,
    xStart: col.xStart - MAX_COLUMN_SHIFT,
    xEnd: col.xEnd + MAX_COLUMN_SHIFT,
  }))
}

/**
 * Find the most likely header row on a page given known column positions.
 */
function findApproximateHeaderRow(
  rows: Array<{ y: number; items: PositionedTextItem[] }>,
  columns: DetectedColumn[]
): number {
  // Look for a row where items align with the expected column positions
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i]!
    let alignedCount = 0

    for (const item of row.items) {
      const centerX = item.x + item.width / 2
      for (const col of columns) {
        if (col.xEnd === Infinity) {
          if (centerX >= col.xStart) alignedCount++
          break
        } else if (centerX >= col.xStart && centerX < col.xEnd) {
          alignedCount++
          break
        }
      }
    }

    if (alignedCount >= 2) return i
  }

  return 0 // Default to first row
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

// ─── Transaction Row Parsing (With Cross-Page Continuity) ───

interface PendingBuffer {
  transaction: Partial<ParsedTransaction>
  description: string
  lastDate: Date | null
}

interface ParsedRowsResult {
  transactions: ParsedTransaction[]
  pending: PendingBuffer | null
}

/**
 * Parse rows between header and end into ParsedTransaction objects.
 * Handles multi-line descriptions (continuation rows without dates) and
 * cross-page transaction stitching (pending transactions carry to next page).
 */
function parseTransactionRowsWithContinuity(
  rows: Array<{ y: number; items: PositionedTextItem[] }>,
  startIndex: number,
  endIndex: number,
  columns: DetectedColumn[],
  profile: BankProfile,
  incomingPending: PendingBuffer | null,
  isLastPage: boolean
): ParsedRowsResult {
  const transactions: ParsedTransaction[] = []
  let pending: PendingBuffer | null = incomingPending

  for (let i = startIndex; i < endIndex; i++) {
    const row = rows[i]!
    const cells = assignItemsToColumns(row.items, columns)

    const dateStr = cells.get("date")?.trim() || ""
    const date = dateStr ? parseTransactionDate(dateStr, profile.dateFormats) : null

    if (date) {
      // Flush previous pending transaction
      if (pending) {
        const finalized = finalizeTransaction(pending.transaction, pending.description, profile)
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

      // Determine transaction type considering Dr/Cr suffixes
      let txType: "credit" | "debit"
      let txAmount: number

      if (creditAmt > 0 && debitAmt === 0) {
        txType = "credit"
        txAmount = creditAmt
      } else if (debitAmt > 0 && creditAmt === 0) {
        txType = "debit"
        txAmount = debitAmt
      } else if (creditAmt > debitAmt) {
        txType = "credit"
        txAmount = creditAmt
      } else {
        txType = "debit"
        txAmount = debitAmt
      }

      // For banks with Dr/Cr suffixes: check individual amount suffix markers
      if (profile.amountFormat.usesDrCr) {
        const rawDebit = cells.get("debit")?.trim() || ""
        const rawCredit = cells.get("credit")?.trim() || ""
        // Dr suffix means this is a debit, Cr suffix means this is a credit
        // Each column's value carries its own suffix: e.g. "1,250.00 Dr" in the debit column
        const debitHasDr = /Dr\.?\s*$/i.test(rawDebit)
        const creditHasCr = /Cr\.?\s*$/i.test(rawCredit)

        if (debitHasDr && debitAmt > 0) {
          txType = "debit"
          txAmount = debitAmt
        } else if (creditHasCr && creditAmt > 0) {
          txType = "credit"
          txAmount = creditAmt
        }
      }

      // For banks with negative debits
      if (profile.amountFormat.usesNegative) {
        if (debitAmt > 0) {
          txType = "debit"
          txAmount = debitAmt
        }
        // Negative values would have been parsed as-is via parseAmount
      }

      pending = {
        transaction: {
          date,
          amount: txAmount,
          type: txType,
          balance,
        },
        description: descText,
        lastDate: date,
      }
    } else if (pending) {
      // Continuation row — append description text
      const descText = cells.get("description")?.trim() || ""
      const fallbackText = row.items.map((item) => item.str.trim()).filter(Boolean).join(" ")
      const extraText = descText || fallbackText

      if (extraText && !looksLikeAmountOnly(extraText)) {
        pending.description += " " + extraText
      }
    }
  }

  // On last page, flush pending. Otherwise carry it forward.
  if (isLastPage && pending) {
    const finalized = finalizeTransaction(pending.transaction, pending.description, profile)
    if (finalized) transactions.push(finalized)
    pending = null
  }

  return { transactions, pending }
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

    for (const col of columns) {
      if (centerX >= col.xStart && (col.xEnd === Infinity || centerX < col.xEnd)) {
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
 * Now includes balance validation when running balance is available.
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
 * Parse an amount string into a numeric absolute value (float).
 * Handles bank-specific formatting quirks:
 *   - Dr/Cr suffixes (e.g., "1,250.00 Dr")
 *   - Thousands separators (comma, space, apostrophe)
 *   - Decimal separators (period or comma)
 *   - Currency symbols (₹, $, €, £, ¥)
 *   - Parenthesized negative amounts (e.g., "(1,250.00)")
 *   - Leading or trailing minus signs
 *
 * Returns the absolute numeric value (always positive).
 * Transaction type (debit/credit) is determined by column
 * assignment, not by amount sign. For banks with usesNegative,
 * the sign is stripped and the column assignment handles typing.
 */
function parseAmount(rawStr: string, profile: BankProfile): number {
  if (!rawStr) return 0

  let cleaned = rawStr.trim()

  // ── Strip Dr/Cr suffixes if bank uses them ──
  // Match Dr/Cr anywhere in the string (some banks embed them inline like "1,250.00 Dr (Withdrawal)")
  if (profile.amountFormat.usesDrCr) {
    cleaned = cleaned.replace(/\s*(?:Dr|Cr)\.?(?:\s|$)/gi, "").trim()
    // Also strip any trailing parens after removing Dr/Cr
    cleaned = cleaned.replace(/[()]/g, "").trim()
  }

  // ── Remove currency symbols ──
  cleaned = cleaned.replace(/[₹$€£¥]/g, "").trim()

  // ── Strip thousands separator ──
  if (profile.amountFormat.thousandsSep) {
    const sep = escapeRegexForAmount(profile.amountFormat.thousandsSep)
    cleaned = cleaned.replace(new RegExp(sep, "g"), "")
  }
  // Also strip any remaining commas that aren't decimal separators
  if (profile.amountFormat.decimalSep !== ",") {
    cleaned = cleaned.replace(/,/g, "")
  } else {
    cleaned = cleaned.replace(/\./g, "")
  }

  // ── Handle parentheses (negative amounts) ──
  cleaned = cleaned.replace(/[()]/g, "").trim()

  // ── Handle leading/trailing minus ──
  cleaned = cleaned.replace(/^-/, "").replace(/-$/, "").trim()

  // ── Normalize decimal separator to period ──
  if (profile.amountFormat.decimalSep && profile.amountFormat.decimalSep !== ".") {
    const lastIdx = cleaned.lastIndexOf(profile.amountFormat.decimalSep)
    if (lastIdx !== -1) {
      cleaned = cleaned.substring(0, lastIdx) + "." + cleaned.substring(lastIdx + 1)
    }
  }

  // ── Parse the numeric value ──
  cleaned = cleaned.replace(/[^\d.]/g, "")

  if (!cleaned || cleaned === ".") return 0

  const value = parseFloat(cleaned)
  if (isNaN(value)) return 0

  return Math.abs(value)
}

/**
 * Escape special regex characters for use in amount separator patterns.
 */
function escapeRegexForAmount(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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

  // DD MMM YYYY or DD-MMM-YYYY or DD MMM YY
  const dMonY = cleaned.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})$/)
  if (dMonY) {
    const [, d, mon, y] = dMonY
    const yearStr = y!.length === 2 ? `20${y}` : y
    const date = new Date(`${mon} ${d}, ${yearStr}`)
    return isNaN(date.getTime()) ? null : date
  }

  // YYYY-MM-DD (ISO format, used by some banks)
  const iso = cleaned.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/)
  if (iso) {
    const [, y, m, d] = iso
    const date = new Date(parseInt(y!), parseInt(m!) - 1, parseInt(d!))
    return isNaN(date.getTime()) ? null : date
  }

  // Fallback
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

// ─── Fallback Regex-Based Extraction ────────────────────────

/**
 * Fallback parser when position-aware extraction fails.
 * Uses regex patterns to find date-prefixed lines and extract amounts.
 * This handles PDFs where pdf.js-extract doesn't provide coordinate data
 * or where text ordering is unpredictable.
 */
function fallbackRegexExtraction(
  pages: PositionedPage[],
  profile: BankProfile
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []

  // Build plain text lines from all pages
  for (const page of pages) {
    // Group items by approximate y position into logical lines
    const lines = groupItemsIntoLines(page.content)
    const pageTransactions = parseLinesAsTransactions(lines, profile)
    transactions.push(...pageTransactions)
  }

  return transactions
}

/**
 * Group positioned items into logical text lines (by y-coordinate, wider tolerance).
 */
function groupItemsIntoLines(items: PositionedTextItem[]): string[] {
  const rows = groupIntoRows(items)
  return rows.map((row) =>
    row.items.map((item) => item.str.trim()).filter(Boolean).join(" ")
  )
}

/**
 * Parse plain text lines as transactions using bank-specific date patterns.
 * Strategy: find lines starting with a date, treat subsequent non-date lines
 * as description continuations.
 */
function parseLinesAsTransactions(
  lines: string[],
  profile: BankProfile
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  let pendingDesc = ""
  let pendingTx: Partial<ParsedTransaction> | null = null

  // Build date regex from bank's date formats
  const datePattern = buildDateRegex(profile.dateFormats)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const dateMatch = trimmed.match(datePattern)
    if (dateMatch) {
      // Flush pending
      if (pendingTx) {
        const finalized = finalizeTransaction(pendingTx, pendingDesc, profile)
        if (finalized) transactions.push(finalized)
      }

      const dateStr = dateMatch[0]!
      const date = parseTransactionDate(dateStr, profile.dateFormats)
      if (!date) continue

      // Extract the rest of the line after the date
      const restOfLine = trimmed.substring(dateMatch[0]!.length).trim()

      // Try to find amounts in the rest of the line
      const { description, amount, type } = extractAmountFromLine(restOfLine, profile)

      pendingTx = { date, amount, type }
      pendingDesc = description || restOfLine
    } else if (pendingTx) {
      // Continuation line
      if (!looksLikeAmountOnly(trimmed)) {
        pendingDesc += " " + trimmed
      }
    }
  }

  // Flush final pending
  if (pendingTx) {
    const finalized = finalizeTransaction(pendingTx, pendingDesc, profile)
    if (finalized) transactions.push(finalized)
  }

  return transactions
}

/**
 * Build a regex that matches common date patterns for the given formats.
 * Used in the fallback regex parser to identify lines starting with dates.
 * Anchored at start of string and uses word boundaries to avoid matching
 * amounts like "123,456.78" or "12.34.56".
 */
function buildDateRegex(dateFormats: string[]): RegExp {
  // Match common date patterns anchored at start:
  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MMM YYYY, DD-MMM-YYYY
  return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|^\d{1,2}\s[A-Z][a-z]{2}(?:\s\d{2,4}|\b)/
}

/**
 * Extract amount and determine debit/credit from a line of text using
 * bank-specific amount patterns and Dr/Cr markers.
 */
function extractAmountFromLine(
  line: string,
  profile: BankProfile
): { description: string; amount: number; type: "credit" | "debit" } {
  // Look for Dr/Cr indicators
  const hasDr = /Dr\.?/i.test(line)
  const hasCr = /Cr\.?/i.test(line)

  // Look for amount patterns (numbers with commas/decimals)
  const amountMatches = line.match(/[\d,]+\.?\d*/g)
  let amount = 0

  if (amountMatches) {
    // Take the last numeric value (usually the amount column)
    const lastMatch = amountMatches[amountMatches.length - 1]!
    amount = parseAmount(lastMatch, profile)

    // Remove the amount from the description
    const descPart = line.replace(lastMatch, "").trim()
    return {
      description: descPart,
      amount,
      type: hasCr ? "credit" : "debit",
    }
  }

  return {
    description: line,
    amount: 0,
    type: hasDr ? "debit" : "credit",
  }
}

// ─── Utility Helpers ────────────────────────────────────────

/**
 * Check if a text string looks like it's only amounts (no description content).
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