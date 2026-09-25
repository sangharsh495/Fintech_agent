import { NextResponse } from "next/server";
import { safeLogError } from "@/server/lib/safe-log";
import { parseStatement } from "@/lib/parser/parseStatement";
import { PasswordRequiredError } from "@/server/services/parser/pdf.types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // `req.formData()` returns the Web `FormData`. Under @types/node the global
    // `FormData` symbol differs from the DOM one, so we go through `any` to call
    // `.get()` without tripping the type-overlap check.
    const formData: any = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string | null) || undefined;
    const bankId = (formData.get("bankId") as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. File size limit defense against memory exhaustion / DoS
    const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Bank statements must not exceed 15 MB." },
        { status: 413 }
      );
    }

    // 2. Password length constraint
    const sanitizedPassword = password ? password.slice(0, 128) : undefined;
    const sanitizedBankId = bankId ? bankId.slice(0, 64) : undefined;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Strict PDF Magic Bytes Verification (%PDF- = 0x25 0x50 0x44 0x46 0x2D)
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
      return NextResponse.json(
        { error: "Invalid file signature. Only authentic PDF documents are supported." },
        { status: 400 }
      );
    }

    const result = await parseStatement(buffer, sanitizedPassword, { fileName: file.name, bankId: sanitizedBankId });

    if (!result.continuity.valid) {
      return NextResponse.json({
        warning: "Some rows failed balance continuity check — review before trusting fully",
        ...result,
      }, { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    if (err instanceof PasswordRequiredError || err?.name === "PasswordRequiredError") {
      return NextResponse.json({
        error: "password_required",
        message: err.message,
        passwordHint: err.passwordHint,
        detectedBankId: err.detectedBankId,
        detectedBankName: err.detectedBankName,
      }, { status: 422 });
    }

    safeLogError("[STATEMENT PARSE ERROR]", err);
    return NextResponse.json({ error: err.message ?? "Unknown parse error" }, { status: 500 });
  }
}