import { NextResponse } from "next/server";
import { safeLogError } from "@/server/lib/safe-log";
import { parseStatement } from "@/lib/parser/parseStatement";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // `req.formData()` returns the Web `FormData`. Under @types/node the global
    // `FormData` symbol differs from the DOM one, so we go through `any` to call
    // `.get()` without tripping the type-overlap check.
    const formData: any = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseStatement(buffer);

    if (!result.continuity.valid) {
      return NextResponse.json({
        warning: "Some rows failed balance continuity check — review before trusting fully",
        ...result,
      }, { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    safeLogError("[STATEMENT PARSE ERROR]", err);
    return NextResponse.json({ error: err.message ?? "Unknown parse error" }, { status: 500 });
  }
}