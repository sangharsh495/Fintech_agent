import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { statementUploads, transactions, bankAccounts } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { parseCSVStatement } from "@/server/services/parser/csv.parser"
import { parseExcelStatement } from "@/server/services/parser/excel.parser"
import { parsePDFStatement } from "@/server/services/parser/pdf.parser"
import { deduplicateTransactions } from "@/server/services/parser/deduplicator"
import type { ParsedTransaction } from "@/server/services/parser/deduplicator"
import { PasswordRequiredError, PDFParseError } from "@/server/services/parser/pdf.types"

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const bankAccountId = formData.get("bankAccountId") as string | null
    const statementMonth = formData.get("statementMonth") as string | null
    const password = formData.get("password") as string | null
    const bankId = formData.get("bankId") as string | null

    if (!file || !bankAccountId) {
      return NextResponse.json({ error: "File and bank account are required" }, { status: 400 })
    }

    // Verify bank belongs to user
    const [bank] = await db.select().from(bankAccounts).where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.userId, userId))).limit(1)
    if (!bank) return NextResponse.json({ error: "Bank account not found" }, { status: 404 })

    // Validate file type
    const fileName = file.name.toLowerCase()
    const fileType = fileName.endsWith(".pdf") ? "pdf"
      : fileName.endsWith(".xlsx") || fileName.endsWith(".xls") ? "xlsx"
        : fileName.endsWith(".csv") ? "csv"
          : null

    if (!fileType) return NextResponse.json({ error: "Unsupported file type. Use PDF, Excel, or CSV." }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 })

    // Create upload record
    const [upload] = await db.insert(statementUploads).values({
      userId, bankAccountId, fileName: file.name, fileType,
      fileSize: file.size,
      statementMonth: statementMonth || undefined,
      statementYear: statementMonth ? parseInt(statementMonth.split("-")[0]!) : undefined,
      processingStatus: "processing",
    }).returning()

    // Parse file
    const buffer = Buffer.from(await file.arrayBuffer())
    let parsed: ParsedTransaction[] = []
    let statementMetadata: Record<string, unknown> | undefined

    try {
      if (fileType === "csv") {
        parsed = await parseCSVStatement(buffer)
      } else if (fileType === "xlsx") {
        parsed = await parseExcelStatement(buffer)
      } else if (fileType === "pdf") {
        const result = await parsePDFStatement(buffer, {
          password: password || undefined,
          bankId: bankId || undefined,
        })
        parsed = result.transactions
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
        }, { status: 422 })
      }

      console.error("[STATEMENT PARSE ERROR]", error);
      await db.update(statementUploads).set({ processingStatus: "failed", errorMessage: "Failed to parse file" }).where(eq(statementUploads.id, upload!.id))
      return NextResponse.json({ error: "Failed to parse statement file" }, { status: 422 })
    }

    if (!parsed.length) {
      await db.update(statementUploads).set({ processingStatus: "failed", errorMessage: "No transactions found" }).where(eq(statementUploads.id, upload!.id))
      return NextResponse.json({ error: "No transactions found in the uploaded file" }, { status: 422 })
    }

    // Deduplicate
    const { newTransactions, duplicates, gapWarning } = await deduplicateTransactions(userId, bankAccountId, parsed)

    // Insert new transactions
    if (newTransactions.length > 0) {
      const now = new Date()
      await db.insert(transactions).values(
        newTransactions.map((txn) => ({
          userId, bankAccountId, statementUploadId: upload!.id,
          type: txn.type, amount: txn.amount.toString(),
          category: txn.category, subcategory: txn.subcategory,
          description: txn.description, rawDescription: txn.rawDescription,
          merchant: txn.merchant, paymentMethod: txn.paymentMethod,
          status: "completed" as const, date: txn.date,
          dayOfWeek: txn.date.getDay(), hourOfDay: txn.date.getHours(),
          isRecurring: txn.isRecurring,
          balanceAfter: txn.balance ? txn.balance.toString() : null,
          hash: txn.hash, createdAt: now, updatedAt: now,
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

    return NextResponse.json({
      success: true, uploadId: upload!.id,
      transactionsAdded: newTransactions.length,
      transactionsSkipped: duplicates.length,
      gapWarning,
      metadata: statementMetadata,
      message: `✓ ${newTransactions.length} transactions added${duplicates.length > 0 ? `, ${duplicates.length} duplicates skipped` : ""}`,
    })
  } catch (error) {
    console.error("[UPLOAD STATEMENT]", error)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }
}
