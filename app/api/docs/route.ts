import { NextRequest, NextResponse } from "next/server"
import { serveSwaggerUI } from "@/server/lib/middleware/openapi"

/**
 * Swagger UI documentation endpoint
 * GET /api/docs
 */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const specUrl = new URL("/api/docs/openapi.json", req.url).toString()
  return serveSwaggerUI(specUrl)(req)
}