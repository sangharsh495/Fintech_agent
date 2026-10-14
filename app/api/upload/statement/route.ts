import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { chronological, sequencedTimestamp } from "@/server/lib/transaction-order"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { uploadRateLimiter } from "@/server/lib/rate-limit"
import { statementUploads, transactions, bankAccounts } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { parseCSVStatement } from "@/server/services/parser/csv.parser"
import { parseExcelStatement } from "@/server/services/parser/excel.parser"
import { parsePDFStatement } from "@/server/services/parser/pdf.parser"
import { deduplicateTransactions } from "@/server/services/parser/deduplicator"
import type { ParsedTransaction } from "@/server/services/parser/deduplicator"
import { PasswordRequiredError, PDFParseError } from "@/server/services/parser/pdf.types"
import { detectBank } from "@/server/services/parser/bank-profiles"
import type { ParsedStatementResult } from "@/server/services/parser/pdf.types"
import crypto from "crypto"
import { safeLogError, safeLogInfo } from "@/server/lib/safe-log"
import { refreshUserAggregates } from "@/server/jobs/refresh-aggregates"

export const dynamic = "force-dynamic"

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
/** Room for the multipart envelope and the small text fields beside the file. */
const FORM_OVERHEAD_BYTES = 64 * 1024
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const rateLimit = await uploadRateLimiter.check(userId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
      { status: 429 }
    )
  }

  let storedNewRows = false

  const response = await withUserScopedDb(userId, async (db) => {
    try {
      // Reject oversized bodies before reading them: the request proxy buffers
      // at most 10 MB, so a larger body arrives truncated and fails to parse
      // instead of reaching the file-size check below.
      if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + FORM_OVERHEAD_BYTES) {
        return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413 })
      }
      const formData: any = await req.formData()
      const file = formData.get("file") as File | null
      const bankAccountId = formData.get("bankAccountId") as string | null
      const statementMonth = formData.get("statementMonth") as string | null
      const password = formData.get("password") as string | null
      const bankId = formData.get("bankId") as string | null

      if (!file || !bankAccountId) {
        return NextResponse.json({ error: "File and bank account are required" }, { status: 400 })
      }

      // Verify bank belongs to user
      const [bank] = await db.select().from(bankAccounts).where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.userId, userId))).limit(1);
      if (!bank) return NextResponse.json({ error: "Bank account not found" }, { status: 404 })

      // Validate file type
      const fileName = file.name.toLowerCase()
      const fileType = fileName.endsWith(".pdf") ? "pdf"
        : fileName.endsWith(".xlsx") || fileName.endsWith(".xls") ? "xlsx"
          : fileName.endsWith(".csv") ? "csv"
            : null

      if (!fileType) return NextResponse.json({ error: "Unsupported file type. Use PDF, Excel, or CSV." }, { status: 400 })
      if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413 })

      // ── PHASE 2: File-level SHA-256 hash for dedup ──────────
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileHash = crypto.createHash("sha256").update(buffer).digest("hex")

      // Check if this exact file was already uploaded by this user
      const [existingUpload] = await db
        .select()
        .from(statementUploads)
        .where(
          and(
            eq(statementUploads.userId, userId),
            eq(statementUploads.fileHash, fileHash)
          )
        )
        .limit(1)

      // Only a completed upload is a true duplicate. A failed one (wrong
      // password, unreadable chunk) must be retryable with the same file.
      if (existingUpload && existingUpload.processingStatus === "completed") {
        safeLogInfo("[UPLOAD] Duplicate file detected, returning cached result", {
          userId,
          fileHash: fileHash.substring(0, 12),
          existingUploadId: existingUpload.id,
        })
        return NextResponse.json({
          success: true,
          uploadId: existingUpload.id,
          // Nothing is stored on a repeat upload: report every row as skipped
          // (the UI used to show the first upload's count as "new").
          transactionsAdded: 0,
          transactionsSkipped: (existingUpload.transactionsExtracted || 0) + (existingUpload.transactionsDuplicate || 0),
          duplicate: true,
          message: `This file was already uploaded on ${existingUpload.createdAt.toLocaleDateString("en-IN")}. No re-parsing needed.`,
        })
      }

      // Create upload record WITH fileHash, or reuse the row from an earlier
      // attempt — (user_id, file_hash) is unique, so a second insert would fail.
      const uploadValues: typeof statementUploads.$inferInsert = {
        userId, bankAccountId, fileName: file.name, fileType, fileHash,
        fileSize: file.size,
        statementMonth: statementMonth || undefined,
        statementYear: statementMonth ? parseInt(statementMonth.split("-")[0]!) : undefined,
        processingStatus: "processing",
        errorMessage: null,
      }
      const [upload] = existingUpload
        ? await db.update(statementUploads).set(uploadValues).where(eq(statementUploads.id, existingUpload.id)).returning()
        : await db.insert(statementUploads).values(uploadValues).returning()

      // Parse file
      let parsed: ParsedTransaction[] = []
      let statementMetadata: Record<string, unknown> | undefined
      let continuityErrors: ParsedStatementResult["continuityErrors"] = []

      try {
        if (fileType === "csv") {
          parsed = await parseCSVStatement(buffer)
        } else if (fileType === "xlsx") {
          parsed = await parseExcelStatement(buffer)
        } else if (fileType === "pdf") {
          const result = await parsePDFStatement(buffer, {
            password: password || undefined,
            bankId: bankId || undefined,
            // The account the user uploads into names its bank, which gives an
            // encrypted statement a bank-specific password hint. It does not
            // override detection: the statement may be from another bank.
            hintBankId: detectBank(bank.bankName ?? "")?.id,
            fileName: file.name,
          })
          // Missing chunks mean missing rows; saving a partial ledger would
          // understate income and spending with no visible sign of it.
          if (result.failedChunks > 0) {
            throw new PDFParseError(
              `Part of this statement could not be read (${result.failedChunks} section${result.failedChunks > 1 ? "s" : ""}). Please try uploading it again.`
            )
          }
          parsed = result.transactions
          continuityErrors = result.continuityErrors
          statementMetadata = {
            bankName: result.metadata.bankName,
            bankProfileId: result.metadata.bankProfileId,
            accountNumber: result.metadata.accountNumber,
            accountLast4: result.metadata.accountLast4,
            accountHolderName: result.metadata.accountHolderName,
            ifscCode: result.metadata.ifscCode,
            branch: result.metadata.branch,
            statementPeriod: result.metadata.statementPeriod
              ? {
                  from: result.metadata.statementPeriod.from.toISOString(),
                  to: result.metadata.statementPeriod.to.toISOString(),
                }
              : undefined,
            bankProfile: result.bankProfile,
            engine: result.engine,
            ocr: result.ocr,
            pageCount: result.pageCount,
            wasEncrypted: result.wasEncrypted,
          }
        }
      } catch (error) {
        // Handle password-required errors specifically
        if (error instanceof PasswordRequiredError) {
          await db.update(statementUploads).set({
            processingStatus: "failed",
            errorMessage: "Password required for encrypted PDF",
          }).where(eq(statementUploads.id, upload!.id))

          return NextResponse.json({
            error: "password_required",
            message: error.message,
            passwordHint: error.passwordHint,
            detectedBankId: error.detectedBankId,
            detectedBankName: error.detectedBankName,
          }, { status: 422 })
        }

        // Use safeLog instead of console.error to prevent leaking sensitive data
        safeLogError("[STATEMENT PARSE ERROR]", error);
        const errMsg = error instanceof Error ? error.message : "Failed to parse statement file";
        await db.update(statementUploads).set({ processingStatus: "failed", errorMessage: errMsg.slice(0, 500) }).where(eq(statementUploads.id, upload!.id))
        return NextResponse.json({ error: errMsg }, { status: 422 })
      }

      if (!parsed.length) {
        await db.update(statementUploads).set({ processingStatus: "failed", errorMessage: "No transactions found" }).where(eq(statementUploads.id, upload!.id))
        return NextResponse.json({ error: "No transactions found in the uploaded file" }, { status: 422 })
      }

      // Deduplicate
      const { newTransactions, duplicates, gapWarning } = await deduplicateTransactions(db, userId, bankAccountId, parsed)

      // Insert new transactions
      if (newTransactions.length > 0) {
        const now = new Date()
        await db.insert(transactions).values(
          chronological(newTransactions).map((txn, i) => ({
            userId, bankAccountId, statementUploadId: upload!.id,
            type: txn.type, amount: txn.amount.toString(),
            category: txn.category, subcategory: txn.subcategory,
            description: txn.description, rawDescription: txn.rawDescription,
            merchant: txn.merchant, paymentMethod: txn.paymentMethod || "unknown",
            status: "completed" as const, date: txn.date,
            dayOfWeek: txn.date.getDay(), hourOfDay: txn.date.getHours(),
            isRecurring: txn.isRecurring,
            balanceAfter: txn.balance ? txn.balance.toString() : null,
            hash: txn.hash, createdAt: sequencedTimestamp(now, i), updatedAt: now,
          }))
        )
      }

      // Update upload record
      await db.update(statementUploads).set({
        processingStatus: "completed",
        transactionsExtracted: newTransactions.length,
        transactionsDuplicate: duplicates.length,
        processedAt: new Date(),
      }).where(eq(statementUploads.id, upload!.id))

      storedNewRows = newTransactions.length > 0

      return NextResponse.json({
        success: true, uploadId: upload!.id,
        transactionsAdded: newTransactions.length,
        transactionsSkipped: duplicates.length,
        gapWarning,
        continuityWarning: continuityErrors.length > 0
          ? `${continuityErrors.length} row${continuityErrors.length > 1 ? "s" : ""} did not match the running balance — a transaction may be missing or misread. Please review them.`
          : undefined,
        continuityErrors: continuityErrors.length > 0 ? continuityErrors : undefined,
        metadata: statementMetadata,
        message: `✓ ${newTransactions.length} transactions added${duplicates.length > 0 ? `, ${duplicates.length} duplicates skipped` : ""}`,
      })
    } catch (error) {
      // Use safeLog instead of console.error to prevent leaking sensitive data
      safeLogError("[UPLOAD STATEMENT]", error)
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
    }
  })

  // Make the new rows visible to the tax engine, the dashboard and the Virtual
  // CA now, not at the next nightly refresh. This must run after the scoped
  // transaction above has committed: the refresh reads through a separate
  // connection and would not see uncommitted rows. The upload has succeeded,
  // so a refresh failure is logged rather than returned.
  if (storedNewRows) {
    await refreshUserAggregates(userId).catch((err) => safeLogError("[UPLOAD] Aggregate refresh failed:", err))
  }

  return response
}
