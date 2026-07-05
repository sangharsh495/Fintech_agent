// ─── Layer 1: PDF Decryption ────────────────────────────────
// Uses qpdf (system binary) to decrypt password-protected PDFs.
// Falls back gracefully if qpdf is not installed or PDF is not encrypted.

import { execFile } from "child_process"
import { promisify } from "util"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { PasswordRequiredError } from "./pdf.types"

const execFileAsync = promisify(execFile)

interface DecryptResult {
  buffer: Buffer
  wasEncrypted: boolean
}

/**
 * Attempt to decrypt a PDF buffer using qpdf.
 *
 * - If the PDF is not encrypted, returns the original buffer unchanged.
 * - If the PDF is encrypted and a password is provided, decrypts it.
 * - If the PDF is encrypted and no password is given, throws PasswordRequiredError.
 * - If qpdf is not installed, tries to return the buffer as-is (works for unencrypted PDFs).
 */
export async function decryptPDF(
  buffer: Buffer,
  password?: string
): Promise<DecryptResult> {
  // First, check if the PDF is encrypted by looking for encryption markers
  const header = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1")
  const hasEncryptMarker = header.includes("/Encrypt") || isEncryptedPDF(buffer)

  if (!hasEncryptMarker) {
    return { buffer, wasEncrypted: false }
  }

  // PDF appears encrypted — we need qpdf + a password
  if (!password) {
    throw new PasswordRequiredError("Enter the PDF password")
  }

  // Check if qpdf is available
  const qpdfAvailable = await isQpdfAvailable()
  if (!qpdfAvailable) {
    console.warn("[PDF DECRYPT] qpdf not installed. Attempting to parse encrypted PDF directly (will likely fail).")
    return { buffer, wasEncrypted: true }
  }

  // Decrypt using qpdf
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
    return { buffer: decryptedBuffer, wasEncrypted: true }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)

    // qpdf returns specific exit codes:
    // exit 2 = password incorrect or other serious error
    if (errMsg.includes("invalid password") || errMsg.includes("password")) {
      throw new PasswordRequiredError("Incorrect password. Please try again.")
    }

    // For other qpdf errors, try to proceed with the original buffer
    console.error("[PDF DECRYPT] qpdf failed:", errMsg)
    return { buffer, wasEncrypted: true }
  } finally {
    // Clean up temp files
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check for encryption by scanning the PDF for /Encrypt dictionary.
 * Scans more of the file than just the header since the xref/trailer
 * can be anywhere.
 */
function isEncryptedPDF(buffer: Buffer): boolean {
  // Check the last 2KB of the file where the trailer usually lives
  const tailStart = Math.max(0, buffer.length - 2048)
  const tail = buffer.subarray(tailStart).toString("latin1")
  return tail.includes("/Encrypt")
}

/**
 * Check if qpdf is installed and available on PATH.
 */
async function isQpdfAvailable(): Promise<boolean> {
  try {
    await execFileAsync("qpdf", ["--version"])
    return true
  } catch {
    return false
  }
}
