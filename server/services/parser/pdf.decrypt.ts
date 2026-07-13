// ─── Layer 1: PDF Decryption ────────────────────────────────
// Uses qpdf (system binary) as primary decryptor.
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
import { safeLogError } from "@/server/lib/safe-log";

const execFileAsync = promisify(execFile)

// ─── Public API ─────────────────────────────────────────────

/**
 * Attempt to decrypt a PDF buffer.
 */
export async function decryptPDF(
  fileBuffer: Buffer,
  password?: string
): Promise<PDFDecryptResult> {
  const isEncrypted = isEncryptedPDF(fileBuffer)
  if (!isEncrypted) {
    return { buffer: fileBuffer, wasEncrypted: false, decryptMethod: "none" }
  }

  // Scan text to detect bank before decryption to give hints
  const headerText = fileBuffer.subarray(0, 4096).toString("latin1")
  const detectedProfile = detectBank(headerText)

  if (!password) {
    const hint = detectedProfile?.passwordHint || "Enter the PDF password"
    throw new PasswordRequiredError(
      hint,
      detectedProfile?.id,
      detectedProfile?.displayName
    )
  }

  // ── Attempt qpdf (required for encrypted files) ──
  const qpdfAvailable = await isQpdfAvailable()
  if (qpdfAvailable) {
    return tryQpdfDecrypt(fileBuffer, password)
  }

  throw new Error(
    "This PDF is password-protected and qpdf is not installed on the server. " +
    "Please install qpdf to decrypt it, or upload an unencrypted PDF."
  )
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

    safeLogError("[PDF DECRYPT] qpdf failed:", errMsg)
    throw new PasswordRequiredError(
      "Could not decrypt PDF. Please ensure the password is correct.",
      undefined,
      undefined
    )
  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

// ─── Detection Utilities ────────────────────────────────────

function isEncryptedPDF(buffer: Buffer): boolean {
  const tailStart = Math.max(0, buffer.length - 2048)
  const tail = buffer.subarray(tailStart).toString("latin1")
  return tail.includes("/Encrypt")
}

async function isQpdfAvailable(): Promise<boolean> {
  try {
    await execFileAsync("qpdf", ["--version"], { timeout: 5000 })
    return true
  } catch {
    return false
  }
}