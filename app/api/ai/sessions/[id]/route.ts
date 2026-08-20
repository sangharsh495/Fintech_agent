/**
 * app/api/ai/sessions/[id]/route.ts
 *
 * Per-session operations: rename (PATCH), activate (PUT) and delete (DELETE).
 * The collection-level list/create lives in ../route.ts.
 *
 * Every query is filtered on the JWT-derived userId in addition to RLS scoping,
 * so a session id belonging to another account resolves to 404.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { chatSessions } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { safeLogError } from "@/server/lib/safe-log"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { id: sessionId } = await params

  return withUserScopedDb(userId, async (db) => {
    try {
      const body = await req.json()
      const title = typeof body.title === "string" ? body.title.trim().slice(0, 255) : ""
      if (!title) {
        return NextResponse.json({ error: "Title required" }, { status: 400 })
      }

      const [updated] = await db
        .update(chatSessions)
        .set({ title, updatedAt: new Date() })
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
        .returning()

      if (!updated) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session: updated })
    } catch (error) {
      safeLogError("[CHAT SESSION PATCH]", error)
      return NextResponse.json({ error: "Failed to rename session" }, { status: 500 })
    }
  })
}

/** Marks this session active and every other session inactive. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { id: sessionId } = await params

  return withUserScopedDb(userId, async (db) => {
    try {
      await db
        .update(chatSessions)
        .set({ isActive: false })
        .where(and(eq(chatSessions.userId, userId), eq(chatSessions.isActive, true)))

      const [activated] = await db
        .update(chatSessions)
        .set({ isActive: true, updatedAt: new Date() })
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
        .returning()

      if (!activated) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session: activated })
    } catch (error) {
      safeLogError("[CHAT SESSION PUT]", error)
      return NextResponse.json({ error: "Failed to activate session" }, { status: 500 })
    }
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { id: sessionId } = await params

  return withUserScopedDb(userId, async (db) => {
    try {
      // chat_messages cascade via FK ON DELETE CASCADE.
      const [deleted] = await db
        .delete(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
        .returning({ id: chatSessions.id })

      if (!deleted) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, deleted: deleted.id })
    } catch (error) {
      safeLogError("[CHAT SESSION DELETE]", error)
      return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
    }
  })
}
