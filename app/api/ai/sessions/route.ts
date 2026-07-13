/**
 * app/api/ai/sessions/route.ts
 *
 * PHASE 6: Chat Session CRUD
 *
 * Endpoints:
 * - GET: List all chat sessions for the authenticated user
 * - POST: Create a new chat session
 * - DELETE: Delete a specific chat session (cascade deletes messages)
 *
 * All operations are user-scoped via JWT session — userId never from request body.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { chatSessions, chatMessages } from "@/server/db/schema"
import { eq, and, desc, count, max } from "drizzle-orm"
import { safeLogError } from "@/server/lib/safe-log"

// ─── GET /api/ai/sessions — List sessions ───────────────────

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Fetch all sessions with message count and last message time
    const sessions = await db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        pageContext: chatSessions.pageContext,
        isActive: chatSessions.isActive,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        messageCount: count(chatMessages.id),
        lastMessageAt: max(chatMessages.createdAt),
      })
      .from(chatSessions)
      .leftJoin(chatMessages, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatSessions.userId, userId))
      .groupBy(chatSessions.id)
      .orderBy(desc(chatSessions.updatedAt))
      .limit(50)

    return NextResponse.json({ sessions })
  } catch (error) {
    safeLogError("[CHAT SESSIONS GET]", error)
    return NextResponse.json({ error: "Failed to load chat sessions" }, { status: 500 })
  }
}

// ─── POST /api/ai/sessions — Create session ────────────────

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await req.json()
    const title = body.title || "New Chat"
    const pageContext = body.pageContext || "/"

    // Deactivate any currently active session
    await db
      .update(chatSessions)
      .set({ isActive: false })
      .where(and(eq(chatSessions.userId, userId), eq(chatSessions.isActive, true)))

    // Create new session
    const [newSession] = await db.insert(chatSessions).values({
      userId,
      title,
      pageContext,
      isActive: true,
    }).returning()

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    safeLogError("[CHAT SESSIONS POST]", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

// ─── DELETE /api/ai/sessions?id=... — Delete session ────────

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const sessionId = req.nextUrl.searchParams.get("id")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  try {
    // Verify session belongs to this user before deleting
    const [existing] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Cascade delete: messages are deleted automatically via FK ON DELETE CASCADE
    await db.delete(chatSessions).where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    )

    return NextResponse.json({ success: true, deleted: sessionId })
  } catch (error) {
    safeLogError("[CHAT SESSIONS DELETE]", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
