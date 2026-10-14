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
import { DEFAULT_AMOUNT_KEYWORDS, DEFAULT_DIRECTION_KEYWORDS, GENERIC_PROFILE } from "./bank-profiles"
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

/**
 * A wrapped line at the top of a page attaches to the first row below it only
 * when that close; otherwise it continues the row from the previous page.
 */
const WRAP_ATTACH_DISTANCE = 12

/** How far down a page to look for the table header, in text rows. */
const HEADER_SCAN_ROWS = 80

/** Second header line must sit this close below the first to be merged with it. */
const HEADER_LINE_GAP = 16

/** Summary and footer lines inside the table area that are not transactions or narration. */
const SUMMARY_LINE = /^(?:closing balance|opening balance|total\b|totals\b|grand total|statement summary|page \d+(?: of \d+)?$|carried forward|brought forward|balance (?:c\/f|b\/f))/i

/** The first date in a cell: 01/02/2025, 01-02-25, 02 Jan 2025, 02-Jan-2025, 2025-01-02. */
const LEADING_DATE = /^(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}[\s\-][A-Za-z]{3}[\s\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})(?![\d])/

/** Text crossing this many column centres is a watermark or banner, not a cell. */
const BANNER_COLUMN_SPAN = 3

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
    // A blank page (an empty scan, or one OCR could not read) has nothing to
    // parse; any row pending from the previous page stays pending.
    if (rows.length === 0) continue

    // ── Detect or inherit columns ──
    let columns: DetectedColumn[] = persistedColumns
    let headerRowIndex = -1

    // Most statements repeat the table header on every page, often below a
    // repeated account block. Re-detect it on each page so the real header row
    // (not a guess among the first rows) bounds the table; fall back to the
    // carried-forward columns only on pages without a header.
    const detection = detectColumns(rows, profile)
    if (detection.columns.length > 0) {
      columns = detection.columns
      // A page whose header lost columns (OCR dropping a header line, say)
      // is still the same table: keep the fuller layout from earlier pages.
      if (isWeakerHeader(detection.columns, persistedColumns)) {
        columns = alignColumns(persistedColumns, detection.columns)
      }
      headerRowIndex = detection.headerRowIndex
      persistedColumns = columns
    } else if (persistedColumns.length > 0) {
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
    return repairPolarityFromBalance(fallbackRegexExtraction(pages, profile))
  }

  repairPolarityFromBalance(allTransactions)

  return allTransactions
}

// ─── Cross-page header comparison ───────────────────────────

const typesOf = (cols: DetectedColumn[]) => new Set(cols.filter((c) => c.type !== "other").map((c) => c.type))

/** The new header has a strict subset of the known column types. */
function isWeakerHeader(found: DetectedColumn[], known: DetectedColumn[]): boolean {
  if (known.length === 0) return false
  const a = typesOf(found)
  const b = typesOf(known)
  return a.size < b.size && [...a].every((t) => b.has(t))
}

/** Shifts the known layout by the median offset of the columns both headers share. */
function alignColumns(known: DetectedColumn[], found: DetectedColumn[]): DetectedColumn[] {
  const shifts = found
    .filter((f) => f.type !== "other")
    .map((f) => {
      const k = known.find((c) => c.type === f.type)
      return k && Number.isFinite(f.xStart) && Number.isFinite(k.xStart) ? f.xStart - k.xStart : null
    })
    .filter((d): d is number => d !== null)
    .sort((x, y) => x - y)
  const shift = shifts.length ? shifts[Math.floor(shifts.length / 2)]! : 0
  return known.map((c) => ({ ...c, xStart: c.xStart === 0 ? 0 : c.xStart + shift, xEnd: c.xEnd === Infinity ? Infinity : c.xEnd + shift }))
}

// ─── Polarity Repair ────────────────────────────────────────

/**
 * Where a row's debit/credit direction was guessed (no suffix, ambiguous
 * columns), the running balance decides it: if the row only reconciles with
 * the previous balance when its direction is flipped, flip it. Rows that do not
 * reconcile either way are left for the continuity check to report.
 */
function repairPolarityFromBalance(txns: ParsedTransaction[]): ParsedTransaction[] {
  for (let i = 1; i < txns.length; i++) {
    const prev = txns[i - 1]!.balance
    const tx = txns[i]!
    if (prev == null || tx.balance == null) continue
    const signed = tx.type === "credit" ? tx.amount : -tx.amount
    const fits = Math.abs(prev + signed - tx.balance) <= 0.01
    const flippedFits = Math.abs(prev - signed - tx.balance) <= 0.01
    if (!fits && flippedFits) {
      tx.type = tx.type === "credit" ? "debit" : "credit"
      tx.isRecurring = tx.isRecurring && tx.type === "debit"
    }
  }
  return txns
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
  // Profile labels first, then the generic ones: banks rename columns between
  // statement versions, and a missed label sends the parser down a much
  // weaker path.
  const withGeneric = (own: string[] | undefined, generic: string[] | undefined) => [...new Set([...(own ?? []), ...(generic ?? [])])]
  const g = GENERIC_PROFILE.columns
  const columnKeywords: Array<{ type: ColumnType; keywords: string[] }> = [
    { type: "date", keywords: withGeneric(profile.columns.date, g.date) },
    { type: "description", keywords: withGeneric(profile.columns.description, g.description) },
    { type: "debit", keywords: withGeneric(profile.columns.debit, g.debit) },
    { type: "credit", keywords: withGeneric(profile.columns.credit, g.credit) },
    { type: "balance", keywords: withGeneric(profile.columns.balance, g.balance) },
    { type: "amount", keywords: profile.columns.amount ?? DEFAULT_AMOUNT_KEYWORDS },
    { type: "direction", keywords: DEFAULT_DIRECTION_KEYWORDS },
    { type: "reference", keywords: withGeneric(profile.columns.reference, g.reference) },
    { type: "valueDate", keywords: withGeneric(profile.columns.valueDate, g.valueDate) },
  ]

  // The header is the first row that matches; account blocks, addresses and
  // summaries above it can run to dozens of lines, so scan well down the page.
  const scanLimit = Math.min(HEADER_SCAN_ROWS, rows.length)

  for (let rowIdx = 0; rowIdx < scanLimit; rowIdx++) {
    const row = rows[rowIdx]!

    // A header may span two lines ("Transaction" over "ID", "Available" over
    // "Balance"). Try the line merged with the one below it first; fall back
    // to the line alone.
    const next = rows[rowIdx + 1]
    const candidates: Array<{ items: PositionedTextItem[]; lastRow: number }> = []
    if (next && next.y - row.y <= HEADER_LINE_GAP && !looksLikeDataRow(next.items)) {
      candidates.push({ items: mergeHeaderLines(row.items, next.items), lastRow: rowIdx + 1 })
    }
    candidates.push({ items: row.items, lastRow: rowIdx })

    for (const candidate of candidates) {
      const detectedCols = matchHeaderColumns(candidate.items, columnKeywords)
      normaliseDetectedColumns(detectedCols)

      // Need at least date + one amount column + description to be a valid header
      const hasDate = detectedCols.some((c) => c.type === "date")
      const hasDesc = detectedCols.some((c) => c.type === "description")
      const hasAmount = detectedCols.some((c) => c.type === "debit" || c.type === "credit" || c.type === "amount")

      if (detectedCols.length >= MIN_HEADER_COLUMNS && hasDate && hasDesc && hasAmount) {
        const withOthers = [...detectedCols, ...unclaimedHeaderColumns(candidate.items, detectedCols)]
        return { columns: expandColumnBoundaries(withOthers, row), headerRowIndex: candidate.lastRow }
      }
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
 * Matches each column type's keywords against the header items. An item
 * claimed by one type is not offered to the next, so "Value Date" cannot be
 * both the date and the value-date column.
 */
function matchHeaderColumns(
  items: PositionedTextItem[],
  columnKeywords: Array<{ type: ColumnType; keywords: string[] }>
): DetectedColumn[] {
  const detected: DetectedColumn[] = []
  let available = items
  // Exact labels for every type first; partial matches only fill the gaps.
  // Otherwise a loose match ("Amount" as 60% of "Dr Amount") can take a
  // header that belongs, exactly, to another type.
  for (const exactOnly of [true, false]) for (const { type, keywords } of columnKeywords) {
    if (detected.some((c) => c.type === type)) continue
    const match = findColumnInRow(available, keywords, exactOnly)
    if (!match) continue
    detected.push({ type, xStart: match.xStart, xEnd: match.xEnd })
    // Only an item the match covers (nearly) whole is used up; a merged cell
    // such as "Deposit Amount (INR) Balance (INR)" still holds the next label.
    available = available.filter((item) => {
      const overlap = Math.min(item.x + item.width, match.xEnd) - Math.max(item.x, match.xStart)
      return overlap < item.width * 0.8
    })
  }
  return detected
}

/** Header labels no column type claimed become "other" columns, reserving their band. */
function unclaimedHeaderColumns(items: PositionedTextItem[], claimed: DetectedColumn[]): DetectedColumn[] {
  return items
    .filter((item) => item.str.trim().length > 0)
    .filter((item) => {
      const overlap = (c: DetectedColumn) => Math.min(item.x + item.width, c.xEnd) - Math.max(item.x, c.xStart)
      return !claimed.some((c) => overlap(c) > 0)
    })
    .map((item) => ({ type: "other" as const, xStart: item.x, xEnd: item.x + item.width }))
}

/**
 * Joins a two-line header: an item on the second line that overlaps one on
 * the first horizontally is appended to it ("Transaction" + "ID"); the rest
 * are kept as they are.
 */
function mergeHeaderLines(top: PositionedTextItem[], bottom: PositionedTextItem[]): PositionedTextItem[] {
  const merged = top.map((item) => ({ ...item }))
  for (const item of bottom) {
    const host = merged.find((m) => item.x < m.x + m.width + 2 && item.x + item.width > m.x - 2 && top.some((t) => t.x === m.x && t.y === m.y))
    if (host) {
      const end = Math.max(host.x + host.width, item.x + item.width)
      host.str = `${host.str.trim()} ${item.str.trim()}`
      host.x = Math.min(host.x, item.x)
      host.width = end - host.x
    } else {
      merged.push({ ...item })
    }
  }
  return merged.sort((a, b) => a.x - b.x)
}

/** A line that starts with a date or holds money is a transaction row, not a header line. */
function looksLikeDataRow(items: PositionedTextItem[]): boolean {
  return items.some((item) => /^\d{1,2}[\/\-. ](?:\d{1,2}|[A-Za-z]{3})[\/\-. ]\d{2,4}/.test(item.str.trim()) || looksLikeMoney(item.str))
}

/**
 * Resolves header layouts the keyword match alone gets wrong:
 * - Separate debit/credit columns win over a generic "Amount" match.
 * - When the only date column is labelled "Value Date", it is the date column.
 */
function normaliseDetectedColumns(cols: DetectedColumn[]): void {
  const has = (type: ColumnType) => cols.some((c) => c.type === type)
  if ((has("debit") || has("credit")) && has("amount")) {
    cols.splice(cols.findIndex((c) => c.type === "amount"), 1)
  }
  if (!has("date")) {
    const valueDate = cols.find((c) => c.type === "valueDate")
    if (valueDate) valueDate.type = "date"
  }
}

/**
 * Broader column detection: scan each item's text for partial keyword matches
 * and assign columns based on typical left-to-right ordering.
 */
function detectColumnsFromRowText(
  items: PositionedTextItem[],
  profile: BankProfile
): DetectedColumn[] {
  const columnOrder: ColumnType[] = ["date", "valueDate", "description", "debit", "credit", "amount", "direction", "balance", "reference"]
  const detected: DetectedColumn[] = []
  const assignedTypes = new Set<ColumnType>()

  for (const item of items) {
    const text = item.str.trim().toLowerCase()
    if (text.length < 2) continue

    // An exact label for any type beats a partial one for an earlier type, so
    // "Amount" is the amount column, not a fragment of "Dr Amount".
    const exactType = columnOrder.find((type) => !assignedTypes.has(type) && getKeywordsForType(profile, type).some((kw) => kw.toLowerCase() === text))
    for (const type of exactType ? [exactType] : columnOrder) {
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
    case "amount": return profile.columns.amount ?? DEFAULT_AMOUNT_KEYWORDS
    case "direction": return DEFAULT_DIRECTION_KEYWORDS
    case "other": return []
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
  keywords: string[],
  exactOnly = false
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

    if (exactOnly) continue

    // Try partial/contains match for headers like "Withdrawal Amt."
    for (const item of items) {
      const itemText = item.str.trim().toLowerCase()
      if (itemText.length > 2 && keywordLower.includes(itemText) && itemText.length >= keywordLower.length * 0.6) {
        return { xStart: item.x, xEnd: item.x + item.width }
      }
    }

    // Two adjacent headers rendered as one text item, e.g.
    // "Deposit Amount (INR) Balance (INR)". Multi-word keywords only, so a bare
    // "Date" never matches inside "Value Date". The x-range is estimated from
    // the keyword's character offset within the item.
    if (keywordLower.includes(" ")) {
      for (const item of items) {
        const itemText = item.str.trim().toLowerCase()
        const at = itemText.indexOf(keywordLower)
        if (at === -1 || itemText.length === keywordLower.length) continue
        const before = at === 0 || itemText[at - 1] === " "
        const after = at + keywordLower.length === itemText.length || itemText[at + keywordLower.length] === " "
        if (!before || !after) continue
        const charWidth = item.width / itemText.length
        return { xStart: item.x + at * charWidth, xEnd: item.x + (at + keywordLower.length) * charWidth }
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

  const headerRow = rows[approxRow]
  if (!headerRow) return persistedColumns
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

  // Pass 1: every dated row starts a transaction; other rows with description
  // text are wrapped narration lines.
  interface Draft { y: number; transaction: Partial<ParsedTransaction>; parts: Array<{ y: number; text: string }>; lastDate: Date }
  const drafts: Draft[] = []
  const wrapped: Array<{ y: number; text: string }> = []
  const nonDated: Array<{ y: number; items: PositionedTextItem[]; cells: Map<ColumnType, string> }> = []
  const descBand = columns.find((c) => c.type === "description")
  const descLeftEdges: number[] = []
  for (let i = startIndex; i < endIndex; i++) {
    const row = rows[i]!
    const rowText = row.items.map((item) => item.str.trim()).join(" ")
    if (SUMMARY_LINE.test(rowText)) continue
    const cells = assignItemsToColumns(row.items, columns)
    const dateStr = cells.get("date")?.trim() || ""
    const date = dateStr ? parseTransactionDate(dateStr, profile.dateFormats) : null
    const descText = cells.get("description")?.trim() || ""

    if (date) {
      drafts.push({ y: row.y, transaction: buildRowTransaction(cells, date, profile), parts: descText ? [{ y: row.y, text: descText }] : [], lastDate: date })
      // Narrations are left-aligned: remember where they start.
      const first = descBand && row.items.find((item) => {
        const center = item.x + item.width / 2
        return center >= descBand.xStart && (descBand.xEnd === Infinity || center < descBand.xEnd)
      })
      if (first) descLeftEdges.push(first.x)
    } else {
      nonDated.push({ y: row.y, items: row.items, cells })
    }
  }

  // A wrapped narration line is description text, or text that starts on the
  // narrations' left edge — a short wrapped line can have its centre over the
  // neighbouring column. A timestamp under the date or a stray value is not.
  for (const row of nonDated) {
    const aligned = row.items
      .filter((item) => descLeftEdges.some((x) => Math.abs(item.x - x) <= 3))
      .map((item) => item.str.trim())
      .join(" ")
    const text = aligned || row.cells.get("description")?.trim() || ""
    if (text && !looksLikeAmountOnly(text)) wrapped.push({ y: row.y, text })
  }

  // Pass 2: a wrapped line joins the transaction of the text line directly
  // above it (a dated row, or a line already attached) unless the next dated
  // row is closer. That keeps a three-line narration together, and still lets
  // narrations centred on their row put a line above it.
  const owners: Array<{ y: number; draft: Draft }> = drafts.map((d) => ({ y: d.y, draft: d }))
  for (const line of [...wrapped].sort((x, y) => x.y - y.y)) {
    const above = owners.filter((o) => o.y < line.y).reduce<{ y: number; draft: Draft } | null>((best, o) => (!best || o.y > best.y ? o : best), null)
    const next = drafts.find((d) => d.y > line.y)
    const distAbove = above ? line.y - above.y : Infinity
    const distNext = next ? next.y - line.y : Infinity

    if (!above) {
      // Top of the page: the first row's centred narration, or the previous
      // page's last row running on.
      if (incomingPending && distNext > WRAP_ATTACH_DISTANCE) incomingPending.description += " " + line.text
      else if (next) { next.parts.push(line); owners.push({ y: line.y, draft: next }) }
      else if (incomingPending) incomingPending.description += " " + line.text
      continue
    }
    const owner = next && distNext < distAbove ? next : above.draft
    owner.parts.push(line)
    owners.push({ y: line.y, draft: owner })
  }

  if (incomingPending) {
    const finalized = finalizeTransaction(incomingPending.transaction, incomingPending.description, profile)
    if (finalized) transactions.push(finalized)
  }

  const describe = (d: Draft) => d.parts.sort((x, y) => x.y - y.y).map((part) => part.text).join(" ")
  drafts.forEach((d, i) => {
    if (i === drafts.length - 1 && !isLastPage) return
    const finalized = finalizeTransaction(d.transaction, describe(d), profile)
    if (finalized) transactions.push(finalized)
  })

  // The last row of a page may continue on the next one.
  const last = drafts[drafts.length - 1]
  const pending: PendingBuffer | null = !isLastPage && last
    ? { transaction: last.transaction, description: describe(last), lastDate: last.lastDate }
    : null

  return { transactions, pending }
}

/** Builds the amount/direction/balance of one dated row from its cells. */
function buildRowTransaction(cells: Map<ColumnType, string>, date: Date, profile: BankProfile): Partial<ParsedTransaction> {
  const debitStr = cells.get("debit")?.trim() || ""
  const creditStr = cells.get("credit")?.trim() || ""
  const balanceStr = cells.get("balance")?.trim() || ""

  const amountStr = cells.get("amount")?.trim() || ""
  const debitAmt = parseAmount(debitStr, profile)
  const creditAmt = parseAmount(creditStr, profile)
  const singleAmt = debitAmt === 0 && creditAmt === 0 ? parseAmount(amountStr, profile) : 0
  const balance = parseBalance(balanceStr, profile)

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

  // Single amount column: the suffix or sign gives the direction. Without
  // either, it stays debit here and repairPolarityFromBalance settles it.
  if (singleAmt > 0) {
    txType = directionFromAmountText(amountStr) ?? "debit"
    txAmount = singleAmt
  }

  // A separate Cr/Dr column states the direction outright.
  const direction = directionFromCell(cells.get("direction") ?? "")
  if (direction) txType = direction

  // For banks with negative debits
  if (profile.amountFormat.usesNegative) {
    if (debitAmt > 0) {
      txType = "debit"
      txAmount = debitAmt
    }
    // Negative values would have been parsed as-is via parseAmount
  }

  return { date, amount: txAmount, type: txType, balance }
}

/**
 * Assign text items from a row to their respective columns based on x-position.
 */
function assignItemsToColumns(
  items: PositionedTextItem[],
  columns: DetectedColumn[]
): Map<ColumnType, string> {
  const cells = new Map<ColumnType, string>()

  const centres = columns.map((col) => (col.xEnd === Infinity ? col.xStart + 20 : (col.xStart + col.xEnd) / 2))

  for (const item of items) {
    const centerX = item.x + item.width / 2

    // A watermark or banner runs across the table; it belongs to no column.
    const spanned = centres.filter((c) => c >= item.x && c <= item.x + item.width).length
    if (spanned >= BANNER_COLUMN_SPAN) continue

    for (const col of columns) {
      if (centerX >= col.xStart && (col.xEnd === Infinity || centerX < col.xEnd)) {
        // An unlabelled reference/instrument number can sit inside an amount
        // column's bounds; only text that is shaped like money belongs there.
        if (AMOUNT_COLUMNS.has(col.type) && !looksLikeMoney(item.str)) break
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

const AMOUNT_COLUMNS = new Set<ColumnType>(["debit", "credit", "amount", "balance"])

/** Money as statements print it: grouped digits or decimals, optional currency, sign or suffix. */
const MONEY_PATTERN = /^(?:Rs\.?|INR|₹|\$)?\s*[(-]?\s*(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?\s*\)?-?\s*(?:Dr|Cr)?\.?$/i

/** A Cr/Dr column's cell: "CR", "Dr.", "C", "Debit", "WITHDRAWAL"… */
function directionFromCell(text: string): "credit" | "debit" | null {
  const t = text.trim().toLowerCase().replace(/\./g, "")
  if (/^(cr|c|credit|deposit)$/.test(t)) return "credit"
  if (/^(dr|d|debit|withdrawal|or|0r)$/.test(t)) return "debit" // "or"/"0r": OCR reading D as O
  return null
}

/**
 * True for "1,250.00", "349.00 Dr", "(500.00)", "-12.5"; false for reference
 * numbers like "599720855", which have neither grouping nor decimals.
 */
function looksLikeMoney(text: string): boolean {
  const t = text.trim()
  if (!MONEY_PATTERN.test(t)) return false
  return /[.,]/.test(t)
}

/** Direction carried by a single-amount cell: suffix first, then sign. */
function directionFromAmountText(text: string): "credit" | "debit" | null {
  if (/Cr\.?\s*$/i.test(text)) return "credit"
  if (/Dr\.?\s*$/i.test(text)) return "debit"
  if (/^\s*[(-]|-\s*$/.test(text)) return "debit"
  return null
}

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

  // Currency prefix: "Rs. 6,086.63", "INR 1,000.00"
  let cleaned = rawStr.trim().replace(/^(?:Rs\.?|INR)\s*/i, "")

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
 * A running balance keeps its sign: an overdrawn account prints "-508.30",
 * "(508.30)" or "508.30 Dr". Unlike a transaction amount, the sign matters
 * here, because the continuity check and polarity repair rely on it.
 */
function parseBalance(rawStr: string, profile: BankProfile): number | undefined {
  const value = parseAmount(rawStr, profile)
  if (!rawStr.trim() || (value === 0 && !/\d/.test(rawStr))) return undefined
  const negative = /^\s*(?:Rs\.?|INR|₹|\$)?\s*[(-]|-\s*$|Dr\.?\s*$/i.test(rawStr)
  return negative ? -value : value
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
  // A date cell often carries more than the date: a time ("01/01/2024 12:12:52
  // PM"), a value date beside it, or OCR noise. Use the first date in it.
  const cleaned = (str.trim().match(LEADING_DATE)?.[0] ?? str).trim()

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy4 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (dmy4) {
    const [, d, m, y] = dmy4
    // Indian statements are day-first; only a profile whose primary format is
    // month-first flips it (the generic profile lists MM/DD/YYYY last).
    const isMonthFirst = dateFormats[0]?.startsWith("MM") ?? false
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
      const { description, amount, type, balance } = extractAmountFromLine(restOfLine, profile)

      pendingTx = { date, amount, type, balance }
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
): { description: string; amount: number; type: "credit" | "debit"; balance?: number } {
  // Money-shaped tokens only, so reference numbers are never read as amounts.
  // A trailing Dr/Cr belongs to the amount it follows.
  const tokens = line.match(/[₹$]?[(-]?(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?\)?(?:\s*(?:Dr|Cr)\.?(?=\s|$))?/gi) ?? []
  const money = tokens.filter((t) => looksLikeMoney(t))

  if (money.length === 0) {
    return { description: line, amount: 0, type: /\bDr\.?\b/i.test(line) ? "debit" : "credit" }
  }

  // With two or more, the last is the running balance and the one before it
  // the transaction amount. A single value is the amount.
  const amountToken = money.length >= 2 ? money[money.length - 2]! : money[money.length - 1]!
  const balanceToken = money.length >= 2 ? money[money.length - 1]! : undefined

  let description = line
  for (const t of money.slice(-2)) description = description.replace(t, "")

  return {
    description: description.replace(/\s{2,}/g, " ").trim(),
    amount: parseAmount(amountToken, profile),
    // Unmarked amounts default to debit; repairPolarityFromBalance corrects it.
    type: directionFromAmountText(amountToken) ?? (/\bCr\.?\b/i.test(line) ? "credit" : "debit"),
    balance: balanceToken ? parseBalance(balanceToken, profile) : undefined,
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