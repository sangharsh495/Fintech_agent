// ─── Layer 1: PDF Decryption ────────────────────────────────
// Uses qpdf (system binary) as primary decryptor.
// Falls back to pdfjs-dist (pdf.js) for password-protected PDFs when qpdf is unavailable.
// Provides bank-specific password hints when a bank profile is detected.

import { execFile } from "child_process"
import { promisify } from "util"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { PasswordRequiredError } from "./pdf.types"
import type { PDFDecryptResult } from "./pdf.types"
import { detectBank } from "./bank-profiles"
import type { BankProfile } from "./bank-profiles"

// Import canvas polyfill FIRST to provide DOMMatrix, Path2D, etc. for pdfjs-dist
import "./canvas-polyfill"

const execFileAsync = promisify(execFile)

// ─── Public API ─────────────────────────────────────────────

/**
 * Attempt to decrypt a PDF buffer.
 *
 * Strategy:
 * 1. Check if PDF is encrypted (fast header/trailer scan)
 * 2. If not encrypted, return original buffer (method = "none")
 * 3. If encrypted and password is provided:
 *    a. Try qpdf first (most reliable)
 *    b. Fall back to pdfjs-dist if qpdf is unavailable
 * 4. If encrypted and no password, throw PasswordRequiredError with
 *    bank-specific hint if the bank can be auto-detected from the
 *    encrypted PDF metadata.
 */
export async function decryptPDF(
  buffer: Buffer,
  password?: string
): Promise<PDFDecryptResult> {
  // ── Fast check: is this PDF encrypted? ──
  const header = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1")
  const hasEncryptMarker = header.includes("/Encrypt") || isEncryptedPDF(buffer)

  if (!hasEncryptMarker) {
    return { buffer, wasEncrypted: false, decryptMethod: "none" }
  }

  // ── Try to detect bank from encrypted PDF for better error messages ──
  let detectedProfile: BankProfile | null = null
  try {
    // Even encrypted PDFs often have readable metadata in the header
    detectedProfile = detectBank(header)
  } catch {
    // Ignore detection errors — bank hint is optional
  }

  // ── PDF is encrypted — need password ──
  if (!password) {
    const hint = detectedProfile?.passwordHint ?? "Enter the PDF password"
    throw new PasswordRequiredError(
      hint,
      detectedProfile?.id,
      detectedProfile?.displayName
    )
  }

  // ── Attempt qpdf first (most reliable) ──
  const qpdfAvailable = await isQpdfAvailable()
  if (qpdfAvailable) {
    return tryQpdfDecrypt(buffer, password)
  }

  // ── Fallback: pdfjs-dist ──
  console.warn("[PDF DECRYPT] qpdf not installed. Falling back to pdfjs-dist for decryption.")
  return tryPdfjsDecrypt(buffer, password)
}

// ─── qpdf Decryption ────────────────────────────────────────

async function tryQpdfDecrypt(
  buffer: Buffer,
  password: string
): Promise<PDFDecryptResult> {
  const tmpDir = path.join(os.tmpdir(), `finflow-pdf-${randomUUID()}`)
  const inputPath = path.join(tmpDir, "input.pdf")
  const outputPath = path.join(tmpDir, "output.pdf")

  try {
    await fs.mkdir(tmpDir, { recursive: true })
    await fs.writeFile(inputPath, buffer)

    await execFileAsync("qpdf", [
      "--decrypt",
      `--password=${password}`,
      inputPath,
      outputPath,
    ])

    const decryptedBuffer = await fs.readFile(outputPath)
    return { buffer: decryptedBuffer, wasEncrypted: true, decryptMethod: "qpdf" }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)

    if (errMsg.includes("invalid password") || errMsg.includes("password")) {
      throw new PasswordRequiredError(
        "Incorrect password. Please try again.",
        undefined,
        undefined
      )
    }

    console.error("[PDF DECRYPT] qpdf failed:", errMsg)
    // Try pdfjs-dist as fallback
    console.warn("[PDF DECRYPT] qpdf failed. Falling back to pdfjs-dist...")
    return tryPdfjsDecrypt(buffer, password)
  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

// ─── pdfjs-dist Decryption ─────────────────────────────────

/**
 * Attempt to decrypt using pdfjs-dist (pdf.js library).
 * pdf.js has built-in support for opening encrypted PDFs with user passwords.
 *
 * We load pdfjs-dist dynamically to avoid bundling it in all environments
 * where qpdf is always available.
 */
async function tryPdfjsDecrypt(
  buffer: Buffer,
  password: string
): Promise<PDFDecryptResult> {
  try {
    // Canvas polyfill (DOMMatrix, Path2D, etc.) is loaded at module import via ./canvas-polyfill

    // Dynamic import — pdfjs-dist is a heavy dependency,
    // only loaded when qpdf is unavailable
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

    // Configure pdf.js to use the buffer as source
    const loadingTask = pdfjsLib.getDocument({
      data: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ) as ArrayBuffer,
      password,
      // Disable range requests — we're loading from buffer
      disableRange: true,
      disableStream: true,
    })

    const pdfDoc = await loadingTask.promise

    // If we got here, password worked! Now we need to extract the
    // decrypted content. pdf.js doesn't output a decrypted PDF buffer
    // directly, so we collect all text content as a new buffer.
    // We use getTextContent() on each page for the text content,
    // but for a full decrypted PDF buffer, we'd need qpdf or similar.

    // Actually, pdf.js can't produce a decrypted PDF buffer —
    // it only extracts content. So we won't use this path for
    // full buffer decryption. Report the limitation.

    await pdfDoc.destroy()

    // pdfjs-dist cannot produce a decrypted PDF buffer — it only extracts
    // text content. Returning the encrypted buffer would result in the parser
    // extracting 0 transactions silently. Instead, throw a clear error telling
    // the user to install qpdf or upload an unencrypted PDF.
    throw new PDFParseError(
      "This PDF is password-protected and qpdf is not installed on the server. " +
      "Please ask your administrator to install qpdf, or upload an unencrypted PDF. " +
      "For macOS: `brew install qpdf`. For Ubuntu: `apt-get install qpdf`."
    )
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)

    // pdf.js error messages for wrong password
    if (
      errMsg.includes("Incorrect Password") ||
      errMsg.includes("No password given") ||
      errMsg.includes("can't be opened") ||
      errMsg.includes("encrypted") ||
      errMsg.includes("password")
    ) {
      throw new PasswordRequiredError(
        "Incorrect password. Please try again.",
        undefined,
        undefined
      )
    }

    // pdfjs-dist might not be installed
    if (errMsg.includes("Cannot find module") || errMsg.includes("Module not found")) {
      console.error(
        "[PDF DECRYPT] pdfjs-dist not installed. " +
        "Install qpdf for production use: brew install qpdf / apt-get install qpdf"
      )
      // Last resort: return the encrypted buffer and hope the parser
      // can extract some text from the header
      console.warn("[PDF DECRYPT] Returning encrypted buffer as-is. Parsing may fail.")
      return { buffer, wasEncrypted: true, decryptMethod: "pdfjs-dist" }
    }

    console.error("[PDF DECRYPT] pdfjs-dist decryption failed:", errMsg)
    throw new PasswordRequiredError(
      "Could not decrypt PDF. Please ensure the password is correct.",
      undefined,
      undefined
    )
  }
}

// ─── Detection Utilities ────────────────────────────────────

/**
 * Check for encryption by scanning the PDF for /Encrypt dictionary.
 * Scans the trailer section (last 2KB) where the encryption dict
 * is usually located.
 */
function isEncryptedPDF(buffer: Buffer): boolean {
  const tailStart = Math.max(0, buffer.length - 2048)
  const tail = buffer.subarray(tailStart).toString("latin1")
  return tail.includes("/Encrypt")
}

/**
 * Check if qpdf is installed and available on PATH.
 */
async function isQpdfAvailable(): Promise<boolean> {
  try {
    await execFileAsync("qpdf", ["--version"], { timeout: 5000 })
    return true
  } catch {
    return false
  }
}