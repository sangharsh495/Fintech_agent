// ─── Layer 2: Header / Metadata Extraction ──────────────────
// Scans the first page(s) of the PDF for bank identification and
// account metadata (holder name, account number, period, IFSC, branch).
// All label lookups are driven by the BankProfile.

import type { BankProfile } from "./bank-profiles"
import { detectBank, GENERIC_PROFILE } from "./bank-profiles"
import type { StatementMetadata, PositionedPage } from "./pdf.types"

/**
 * Extract statement metadata from the PDF text content using the bank profile.
 *
 * If the profile is the generic fallback, auto-detects the bank first and
 * switches to the specific profile for more accurate label matching.
 */
export function extractMetadata(
  pages: PositionedPage[],
  profile: BankProfile
): StatementMetadata {
  // Build plain text from first 2 pages (metadata is always near the top)
  const textPages = pages.slice(0, 2)
  const fullText = textPages
    .map((page) => page.content.map((item) => item.str).join(" "))
    .join("\n")

  // If using generic profile, try to auto-detect bank for better header matching
  let effectiveProfile = profile
  if (profile.id === "generic") {
    const detected = detectBank(fullText)
    if (detected) {
      effectiveProfile = detected
    }
  }

  const metadata: StatementMetadata = {
    currency: "INR",
  }

  // ── Bank Name ──
  if (effectiveProfile.id !== "generic") {
    metadata.bankName = effectiveProfile.displayName
    metadata.bankProfileId = effectiveProfile.id
  } else {
    // Try to find any bank name in text
    const bankName = extractBankNameFallback(fullText)
    if (bankName) metadata.bankName = bankName
  }

  // ── Account Number ──
  const accountNumber = findLabelValue(fullText, effectiveProfile.headerLabels.accountNumber)
  if (accountNumber) {
    metadata.accountNumber = accountNumber
    // Extract last 4 digits
    const digits = accountNumber.replace(/\D/g, "")
    if (digits.length >= 4) {
      metadata.accountLast4 = digits.slice(-4)
    }
  }

  // ── Account Holder Name ──
  const holderName = findLabelValue(fullText, effectiveProfile.headerLabels.holderName)
  if (holderName) {
    metadata.accountHolderName = cleanName(holderName)
  }

  // ── IFSC Code ──
  const ifsc = findLabelValue(fullText, effectiveProfile.headerLabels.ifsc)
  if (ifsc) {
    // Validate IFSC format: 4 letters + 0 + 6 alphanumeric
    const ifscMatch = ifsc.match(/[A-Z]{4}0[A-Z0-9]{6}/i)
    if (ifscMatch) {
      metadata.ifscCode = ifscMatch[0].toUpperCase()
    }
  }

  // ── Branch ──
  const branch = findLabelValue(fullText, effectiveProfile.headerLabels.branch)
  if (branch) {
    metadata.branch = cleanName(branch)
  }

  // ── Statement Period ──
  const period = extractStatementPeriod(fullText, effectiveProfile)
  if (period) {
    metadata.statementPeriod = period
  }

  return metadata
}

// ─── Internal Helpers ───────────────────────────────────────

/**
 * Search for a label-value pair in text.
 * Tries each label variant and captures the text after it until a newline,
 * another label, or excessive whitespace.
 */
function findLabelValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    // Build regex: label followed by optional colon/dash, then capture the value
    const escaped = escapeRegex(label)
    const pattern = new RegExp(
      `${escaped}[\\s]*[:—\\-]?[\\s]*([^\\n]{2,80})`,
      "i"
    )
    const match = text.match(pattern)
    if (match?.[1]) {
      const value = match[1].trim()
      // Filter out empty or obviously wrong captures
      if (value.length > 1 && !looksLikeAnotherLabel(value, labels)) {
        return value
      }
    }
  }
  return null
}

/**
 * Check if captured value looks like it accidentally grabbed the next label.
 */
function looksLikeAnotherLabel(value: string, currentLabels: string[]): boolean {
  const lower = value.toLowerCase()
  // Check against all generic header labels
  const allLabels = [
    ...GENERIC_PROFILE.headerLabels.accountNumber,
    ...GENERIC_PROFILE.headerLabels.holderName,
    ...GENERIC_PROFILE.headerLabels.statementPeriod,
    ...GENERIC_PROFILE.headerLabels.ifsc,
    ...GENERIC_PROFILE.headerLabels.branch,
  ]
  return allLabels.some((l) => lower.startsWith(l.toLowerCase()))
}

/**
 * Extract statement period dates from text.
 * Handles formats like:
 *   "Statement Period: 01/03/2025 to 31/03/2025"
 *   "Statement From 01 Mar 2025 To 31 Mar 2025"
 *   "From: 01-03-2025  To: 31-03-2025"
 */
function extractStatementPeriod(
  text: string,
  profile: BankProfile
): { from: Date; to: Date } | null {
  // Strategy 1: Look for "from ... to ..." pattern near period labels
  for (const label of profile.headerLabels.statementPeriod) {
    const escaped = escapeRegex(label)
    // Match: label + optional separator + date + "to" + date
    const pattern = new RegExp(
      `${escaped}[\\s:—\\-]*` +
      `(\\d{1,2}[\\s/\\-][A-Za-z0-9]{2,3}[\\s/\\-]\\d{2,4})` +
      `[\\s]*(?:to|–|-)\\s*` +
      `(\\d{1,2}[\\s/\\-][A-Za-z0-9]{2,3}[\\s/\\-]\\d{2,4})`,
      "i"
    )
    const match = text.match(pattern)
    if (match?.[1] && match?.[2]) {
      const from = parseDateFlexible(match[1])
      const to = parseDateFlexible(match[2])
      if (from && to) return { from, to }
    }
  }

  // Strategy 2: Look for standalone "From: <date>" and "To: <date>" labels
  const fromDate = findLabelValue(text, ["From"])
  const toDate = findLabelValue(text, ["To"])
  if (fromDate && toDate) {
    const from = parseDateFlexible(fromDate)
    const to = parseDateFlexible(toDate)
    if (from && to) return { from, to }
  }

  return null
}

/**
 * Parse a date string flexibly, trying multiple common Indian bank formats.
 */
function parseDateFlexible(str: string): Date | null {
  if (!str) return null
  const cleaned = str.trim()

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy4 = cleaned.match(/^(\d{2})[/\-](\d{2})[/\-](\d{4})$/)
  if (dmy4) return new Date(`${dmy4[3]}-${dmy4[2]}-${dmy4[1]}`)

  // DD/MM/YY or DD-MM-YY
  const dmy2 = cleaned.match(/^(\d{2})[/\-](\d{2})[/\-](\d{2})$/)
  if (dmy2) return new Date(`${parseInt(dmy2[3]!) + 2000}-${dmy2[2]}-${dmy2[1]}`)

  // DD MMM YYYY or DD-MMM-YYYY (e.g. "01 Mar 2025", "01-Mar-2025")
  const dMonY = cleaned.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{4})$/)
  if (dMonY) return new Date(`${dMonY[2]} ${dMonY[1]}, ${dMonY[3]}`)

  // Fallback: let JS try
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Fallback bank name detection when no profile matched.
 * Scans for common Indian bank name patterns in the text.
 */
function extractBankNameFallback(text: string): string | null {
  const bankPatterns = [
    { pattern: /HDFC\s*Bank/i, name: "HDFC Bank" },
    { pattern: /ICICI\s*Bank/i, name: "ICICI Bank" },
    { pattern: /State\s*Bank\s*of\s*India/i, name: "State Bank of India" },
    { pattern: /Axis\s*Bank/i, name: "Axis Bank" },
    { pattern: /Kotak\s*Mahindra/i, name: "Kotak Mahindra Bank" },
    { pattern: /Punjab\s*National\s*Bank/i, name: "Punjab National Bank" },
    { pattern: /Bank\s*of\s*Baroda/i, name: "Bank of Baroda" },
    { pattern: /IndusInd\s*Bank/i, name: "IndusInd Bank" },
    { pattern: /Yes\s*Bank/i, name: "Yes Bank" },
    { pattern: /Union\s*Bank/i, name: "Union Bank of India" },
    { pattern: /Canara\s*Bank/i, name: "Canara Bank" },
    { pattern: /Bank\s*of\s*India/i, name: "Bank of India" },
    { pattern: /Indian\s*Bank/i, name: "Indian Bank" },
    { pattern: /IDBI\s*Bank/i, name: "IDBI Bank" },
    { pattern: /Federal\s*Bank/i, name: "Federal Bank" },
    { pattern: /South\s*Indian\s*Bank/i, name: "South Indian Bank" },
    { pattern: /Bandhan\s*Bank/i, name: "Bandhan Bank" },
    { pattern: /RBL\s*Bank/i, name: "RBL Bank" },
    { pattern: /IDFC\s*First\s*Bank/i, name: "IDFC First Bank" },
  ]

  for (const { pattern, name } of bankPatterns) {
    if (pattern.test(text)) return name
  }

  return null
}

/**
 * Clean up a name string — remove extra whitespace, trailing colons, etc.
 */
function cleanName(name: string): string {
  return name
    .replace(/[:—\-]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 128) // Truncate to reasonable length
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
