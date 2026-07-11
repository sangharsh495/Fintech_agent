// ─── PDF Statement Parser — Orchestrator ────────────────────
// Thin orchestrator that wires the three layers together:
//   Layer 1: Decryption (pdf.decrypt)
//   Layer 2: Header/Metadata extraction (pdf.header)
//   Layer 3: Position-aware table extraction (pdf.table)
//
// All bank-specific behavior is driven by bank profiles.
// This file contains zero bank-specific logic.

import { getBankProfile, detectBank, GENERIC_PROFILE } from "./bank-profiles"
import { decryptPDF } from "./pdf.decrypt"
import { extractMetadata } from "./pdf.header"
import { extractTransactions } from "./pdf.table"
import type { PDFParseOptions, ParsedStatementResult, PositionedPage, PositionedTextItem } from "./pdf.types"
// Removed dependency on pdf.js-extract to avoid worker issues; we now use pdfjs-dist directly.

// Import canvas polyfill FIRST to provide DOMMatrix, Path2D, etc. for pdfjs-dist
import "./canvas-polyfill"

interface PDFExtractItem {
  str: string
  x: number
  y: number
  w: number
  h: number
  fontName?: string
}

interface PDFExtractPage {
  pageInfo: { width: number; height: number; num: number }
  content: PDFExtractItem[]
}

interface PDFExtractResult {
  pages: PDFExtractPage[]
  pdfInfo?: Record<string, unknown>
}

interface PDFExtractInstance {
  extractBuffer(buffer: Buffer, options?: Record<string, unknown>): Promise<PDFExtractResult>
}

/**
 * Parse a PDF bank statement into structured transactions + metadata.
 *
 * @param fileBuffer - The raw PDF file buffer
 * @param options    - Optional password and/or explicit bank ID
 * @returns Enriched result with transactions, metadata, bank profile used, and encryption status
 *
 * @example
 * // Basic usage (auto-detect bank, unencrypted)
 * const result = await parsePDFStatement(buffer)
 *
 * @example
 * // With password and explicit bank
 * const result = await parsePDFStatement(buffer, { password: "01011990", bankId: "hdfc" })
 */
export async function parsePDFStatement(
  fileBuffer: Buffer,
  options?: PDFParseOptions
): Promise<ParsedStatementResult> {
  // ── Layer 1: Decryption ──
  const { buffer: cleanBuffer, wasEncrypted } = await decryptPDF(
    fileBuffer,
    options?.password
  )

  // ── Extract positioned text from all pages ──
  const pages = await extractPages(cleanBuffer)

  // ── Determine bank profile ──
  const fullText = pages
    .map((p) => p.content.map((item) => item.str).join(" "))
    .join("\n")

  let profile = GENERIC_PROFILE

  if (options?.bankId) {
    // Explicit bank ID provided — use it
    profile = getBankProfile(options.bankId) ?? GENERIC_PROFILE
  } else {
    // Auto-detect bank from text content
    const detected = detectBank(fullText)
    if (detected) {
      profile = detected
    }
  }

  // ── Layer 2: Header/Metadata extraction ──
  const metadata = extractMetadata(pages, profile)
  metadata.bankProfileId = profile.id

  // If metadata auto-detected a different bank than the profile, upgrade the profile
  if (
    profile.id === "generic" &&
    metadata.bankProfileId &&
    metadata.bankProfileId !== "generic"
  ) {
    const upgraded = getBankProfile(metadata.bankProfileId)
    if (upgraded) {
      profile = upgraded
    }
  }

  // ── Layer 3: Transaction table extraction ──
  const transactions = extractTransactions(pages, profile)

  return {
    transactions,
    metadata,
    bankProfile: profile.id,
    pageCount: pages.length,
    wasEncrypted,
  }
}

// ─── pdf.js-extract Wrapper ─────────────────────────────────

/**
 * Extract positioned pages from a PDF buffer using pdfjs-dist.
 * This implementation avoids the worker used by pdf.js-extract, eliminating the need for the optional `dommatrix` polyfill.
 */
async function extractPages(buffer: Buffer): Promise<PositionedPage[]> {
  // Canvas polyfill (DOMMatrix, Path2D, etc.) is loaded at module import via ./canvas-polyfill

  // Dynamic import to keep bundle size low
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: PositionedPage[] = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    const positionedItems: PositionedTextItem[] = items.map((it) => ({
      str: it.str,
      x: it.transform[4],
      y: viewport.height - it.transform[5], // invert Y to match original coordinate system
      width: it.width,
      height: it.height,
    }));
    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      content: positionedItems,
    });
  }
  await pdfDoc.destroy();
  return pages;
}
