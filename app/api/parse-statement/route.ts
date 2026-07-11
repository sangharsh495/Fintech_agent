import { NextResponse } from "next/server";
import { parseStatement } from "@/lib/parser/parseStatement";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
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
    console.error("[STATEMENT PARSE ERROR]", err);
    return NextResponse.json({ error: err.message ?? "Unknown parse error" }, { status: 500 });
  }
}
