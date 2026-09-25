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

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseStatement(buffer, password, { fileName: file.name, bankId });

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