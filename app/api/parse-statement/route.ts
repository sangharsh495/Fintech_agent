import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/lib/get-session";
import { uploadRateLimiter } from "@/server/lib/rate-limit";
import { safeLogError } from "@/server/lib/safe-log";
import { parseStatement } from "@/lib/parser/parseStatement";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // Every call spends LLM quota, so this must never be reachable anonymously.
  // The proxy lets all /api/* requests through, so the check lives here.
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await uploadRateLimiter.check(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
      { status: 429 }
    );
  }

  try {
    // Reject oversized bodies before reading them: the request proxy buffers
    // at most 10 MB, so a larger body arrives truncated and fails to parse.
    if (Number(req.headers.get("content-length") ?? 0) > MAX_FILE_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413 });
    }
    // `req.formData()` returns the Web `FormData`. Under @types/node the global
    // `FormData` symbol differs from the DOM one, so we go through `any` to call
    // `.get()` without tripping the type-overlap check.
    const formData: any = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseStatement(buffer);

    if (result.failedChunks > 0 || !result.continuity.valid) {
      return NextResponse.json({
        warning: result.failedChunks > 0
          ? "Part of the statement could not be read — some transactions are missing"
          : "Some rows failed balance continuity check — review before trusting fully",
        ...result,
      }, { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    safeLogError("[STATEMENT PARSE ERROR]", err);
    return NextResponse.json({ error: err.message ?? "Unknown parse error" }, { status: 500 });
  }
}
