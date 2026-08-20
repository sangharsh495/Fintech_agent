/**
 * app/api/tax/documents/route.ts
 *
 * Upload, list and remove tax source documents (Form 16, AIS/TIS, CAS).
 *
 * The raw file is parsed in-request and only the extracted, structured payload
 * is persisted — the PDF itself is never written to the database. That keeps
 * the blast radius of this table small: it holds figures the user is about to
 * put on a public return anyway, not the underlying certificate.
 *
 * userId comes from the verified JWT only, and every query runs inside an
 * RLS-scoped transaction.
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { eq, and, desc } from "drizzle-orm"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { taxDocuments } from "@/server/db/schema"
import { uploadRateLimiter } from "@/server/lib/rate-limit"
import { safeLogError, safeLogInfo } from "@/server/lib/safe-log"
import { parseForm16 } from "@/server/services/tax/form16.parser"
import { parseAIS } from "@/server/services/tax/ais.parser"
import { parseCAS } from "@/server/services/tax/cas.parser"
import { normaliseFinancialYear } from "@/server/services/tax/types"
import { PasswordRequiredError } from "@/server/services/parser/pdf.types"

const MAX_FILE_BYTES = 10 * 1024 * 1024

type DocumentType = "form16" | "ais" | "tis" | "cas"

const SUPPORTED_TYPES: DocumentType[] = ["form16", "ais", "tis", "cas"]

// ─── GET — list documents for a financial year ──────────────

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const financialYear = normaliseFinancialYear(req.nextUrl.searchParams.get("fy") ?? "2025-2026")
  if (!financialYear) {
    return NextResponse.json({ error: "Unsupported financial year" }, { status: 400 })
  }

  return withUserScopedDb(userId, async (db) => {
    try {
      const documents = await db
        .select({
          id: taxDocuments.id,
          documentType: taxDocuments.documentType,
          fileName: taxDocuments.fileName,
          status: taxDocuments.status,
          confidence: taxDocuments.confidence,
          missingFields: taxDocuments.missingFields,
          errorMessage: taxDocuments.errorMessage,
          parsedData: taxDocuments.parsedData,
          createdAt: taxDocuments.createdAt,
        })
        .from(taxDocuments)
        .where(and(eq(taxDocuments.userId, userId), eq(taxDocuments.financialYear, financialYear)))
        .orderBy(desc(taxDocuments.createdAt))

      return NextResponse.json({ financialYear, documents })
    } catch (error) {
      safeLogError("[TAX DOCUMENTS GET]", error)
      return NextResponse.json({ error: "Failed to load tax documents" }, { status: 500 })
    }
  })
}

// ─── POST — upload and parse ────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const rateLimit = await uploadRateLimiter.check(userId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many uploads. Try again in ${Math.ceil(rateLimit.resetMs / 60000)} minutes.` },
      { status: 429 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload" }, { status: 400 })
  }

  const file = form.get("file") as File | null
  const documentType = String(form.get("documentType") ?? "") as DocumentType
  const password = (form.get("password") as string | null) ?? undefined
  const financialYear = normaliseFinancialYear(String(form.get("fy") ?? "2025-2026"))

  if (!file) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 })
  }
  if (!SUPPORTED_TYPES.includes(documentType)) {
    return NextResponse.json(
      { error: `documentType must be one of: ${SUPPORTED_TYPES.join(", ")}` },
      { status: 400 }
    )
  }
  if (!financialYear) {
    return NextResponse.json({ error: "Unsupported financial year" }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 })
  }

  const isJson = /\.json$/i.test(file.name)
  const isPdf = /\.pdf$/i.test(file.name)
  if (!isPdf && !isJson) {
    return NextResponse.json({ error: "Upload a PDF, or the AIS JSON export from the e-filing portal." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex")

  return withUserScopedDb(userId, async (db) => {
    // ── Idempotency: the same file for the same year is the same document ──
    const [existing] = await db
      .select({ id: taxDocuments.id, status: taxDocuments.status, parsedData: taxDocuments.parsedData })
      .from(taxDocuments)
      .where(
        and(
          eq(taxDocuments.userId, userId),
          eq(taxDocuments.financialYear, financialYear),
          eq(taxDocuments.fileHash, fileHash)
        )
      )
      .limit(1)

    if (existing && existing.status === "parsed") {
      return NextResponse.json({
        document: { id: existing.id, status: existing.status, parsedData: existing.parsedData },
        duplicate: true,
        message: "This file was already uploaded and parsed for this year.",
      })
    }

    // ── Parse ──
    let parsedData: unknown
    let confidence: number | null = null
    let missingFields: string[] = []

    try {
      if (documentType === "form16") {
        const parsed = await parseForm16(buffer, { password })
        parsedData = parsed
        confidence = parsed.confidence
        missingFields = parsed.missingFields
      } else if (documentType === "ais" || documentType === "tis") {
        const parsed = await parseAIS(buffer, file.name, { password })
        parsedData = parsed
        // Warning-free parses of the authoritative JSON export are trusted;
        // PDF-derived figures always carry a caveat and score lower.
        confidence = parsed.parseWarnings.length === 0 ? 1 : 0.6
        missingFields = parsed.parseWarnings
      } else {
        const parsed = await parseCAS(buffer, { password, financialYear })
        parsedData = parsed
        confidence = parsed.holdings.length > 0 ? 0.9 : 0.2
        missingFields = parsed.parseWarnings
      }
    } catch (error) {
      const needsPassword = error instanceof PasswordRequiredError
      const message =
        error instanceof Error ? error.message : "Could not read this document."

      safeLogError("[TAX DOCUMENTS POST] parse failed", error)

      // Record the failure so the user sees it in the wizard rather than
      // silently ending up with a return built on missing data.
      await db
        .insert(taxDocuments)
        .values({
          userId,
          financialYear,
          documentType,
          fileName: file.name,
          fileHash,
          fileSize: file.size,
          status: "failed",
          errorMessage: message,
        })
        .onConflictDoNothing()

      return NextResponse.json(
        {
          error: message,
          passwordRequired: needsPassword,
          ...(needsPassword && error instanceof PasswordRequiredError
            ? { passwordHint: error.passwordHint }
            : {}),
        },
        { status: needsPassword ? 422 : 400 }
      )
    }

    // ── Persist ──
    try {
      const values = {
        userId,
        financialYear,
        documentType,
        fileName: file.name,
        fileHash,
        fileSize: file.size,
        status: "parsed" as const,
        parsedData: parsedData as Record<string, unknown>,
        confidence,
        missingFields,
        errorMessage: null,
        parsedAt: new Date(),
        updatedAt: new Date(),
      }

      const [document] = await db
        .insert(taxDocuments)
        .values(values)
        .onConflictDoUpdate({
          target: [taxDocuments.userId, taxDocuments.financialYear, taxDocuments.fileHash],
          set: values,
        })
        .returning({
          id: taxDocuments.id,
          documentType: taxDocuments.documentType,
          status: taxDocuments.status,
          confidence: taxDocuments.confidence,
          missingFields: taxDocuments.missingFields,
          parsedData: taxDocuments.parsedData,
        })

      safeLogInfo("[TAX DOCUMENTS] parsed", { userId, documentType, financialYear, confidence })

      return NextResponse.json({ document, duplicate: false }, { status: 201 })
    } catch (error) {
      safeLogError("[TAX DOCUMENTS POST] persist failed", error)
      return NextResponse.json({ error: "Parsed the document but could not save it." }, { status: 500 })
    }
  })
}

// ─── DELETE — remove a document ─────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Document id required" }, { status: 400 })
  }

  return withUserScopedDb(userId, async (db) => {
    try {
      const [deleted] = await db
        .delete(taxDocuments)
        .where(and(eq(taxDocuments.id, id), eq(taxDocuments.userId, userId)))
        .returning({ id: taxDocuments.id })

      if (!deleted) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, deleted: deleted.id })
    } catch (error) {
      safeLogError("[TAX DOCUMENTS DELETE]", error)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }
  })
}
