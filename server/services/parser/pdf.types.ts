import type { ParsedTransaction } from "./deduplicator"
export type { ParsedTransaction }

// ─── Statement Metadata ────────────────────────────────────

/** Metadata extracted from the statement header/cover page */
export interface StatementMetadata {
  bankName?: string
  bankProfileId?: string       // Matched profile ID ("hdfc", "icici", etc.)
  accountNumber?: string       // Full or masked account number as printed
  accountLast4?: string        // Last 4 digits extracted
  accountHolderName?: string
  ifscCode?: string
  branch?: string
  statementPeriod?: {
    from: Date
    to: Date
  }
  currency?: string            // "INR" (default)
}

// ─── Parse Options ─────────────────────────────────────────

/** Options passed to parsePDFStatement */
export interface PDFParseOptions {
  /** PDF password (for encrypted statements) */
  password?: string
  /** Explicit bank profile ID — skips auto-detection if provided */
  bankId?: string
  /** Original file name, used for the password hint when the PDF is encrypted */
  fileName?: string
  /** Likely bank (e.g. from the account uploaded into), for the password hint only — never overrides detection */
  hintBankId?: string
}

// ─── Parse Result ──────────────────────────────────────────

/** The enriched return type from parsePDFStatement */
export interface ParsedStatementResult {
  transactions: ParsedTransaction[]
  metadata: StatementMetadata
  /** Which bank profile was used: "hdfc" | "icici" | "generic" etc. */
  bankProfile: string
  pageCount: number
  wasEncrypted: boolean
  /** Rows (by index) whose balance does not follow from the previous row. */
  continuityErrors: Array<{ index: number; expected: number; actual: number }>
  /** Text chunks the extractor could not read; their rows are missing. */
  failedChunks: number
  /** Which tier produced the transactions. */
  engine: "deterministic" | "llm"
  /** The statement was a scan and its text came from OCR. */
  ocr: boolean
}

// ─── Positioned Text Item ──────────────────────────────────

/** A single text item with position data from pdf.js-extract */
export interface PositionedTextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
}

/** A page of positioned text items */
export interface PositionedPage {
  pageNumber: number
  content: PositionedTextItem[]
  width: number
  height: number
}

// ─── Column Assignment ─────────────────────────────────────

/** Column types we detect in the transaction table */
/**
 * "amount" is a single signed/suffixed amount column (e.g. "349.00 Dr"), used instead of debit + credit.
 * "direction" is a separate Cr/Dr column. "other" reserves the band of a header the parser does not
 * use (serial number, branch code, posting time) so its values never leak into neighbouring columns.
 */
export type ColumnType = "date" | "description" | "debit" | "credit" | "amount" | "direction" | "balance" | "reference" | "valueDate" | "other"

/** A detected column boundary */
export interface DetectedColumn {
  type: ColumnType
  /** Left edge x-coordinate of the column */
  xStart: number
  /** Right edge x-coordinate of the column */
  xEnd: number
}

/** A single row of the table with items assigned to columns */
export interface TableRow {
  y: number
  cells: Map<ColumnType, string>
}

// ─── Errors ────────────────────────────────────────────────

export interface PDFDecryptResult {
  /** Decrypted buffer (or original if not encrypted) */
  buffer: Buffer
  /** Whether the original PDF was encrypted */
  wasEncrypted: boolean
  /** Method used for decryption */
  decryptMethod: "qpdf" | "pdfjs-dist" | "none"
}

export class PasswordRequiredError extends Error {
  public passwordHint: string
  /** The detected bank profile id, if auto-detected before password request */
  public detectedBankId?: string
  /** Detected bank display name for user-friendly messages */
  public detectedBankName?: string

  constructor(hint: string = "Enter the PDF password", bankId?: string, bankName?: string) {
    const bankContext = bankName
      ? `\n\nDetected bank: ${bankName}. ${hint}`
      : `\n\n${hint}`
    super(`This PDF is password-protected. A password is required to decrypt it.${bankContext}`)
    this.name = "PasswordRequiredError"
    this.passwordHint = hint
    this.detectedBankId = bankId
    this.detectedBankName = bankName
  }
}

export class PDFParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PDFParseError"
  }
}
