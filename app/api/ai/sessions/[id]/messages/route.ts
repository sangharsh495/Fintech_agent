/**
 * app/api/ai/sessions/[id]/messages/route.ts
 *
 * Loads the persisted message history for one chat session so the AI CA page
 * can rehydrate a past consultation.
 *
 * Security: userId comes from the verified JWT only. The session id from the
 * URL is filtered against that userId (belt) on top of RLS scoping (braces), so
 * a guessed session id from another account returns 404, not someone's chat.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { chatSessions, chatMessages } from "@/server/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { safeLogError } from "@/server/lib/safe-log"

const MAX_MESSAGES = 200

export async function GET(
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
      const [owned] = await db
        .select({ id: chatSessions.id, title: chatSessions.title })
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
        .limit(1)

      if (!owned) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      const messages = await db
        .select({
          id: chatMessages.id,
          role: chatMessages.role,
          content: chatMessages.content,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId)))
        .orderBy(asc(chatMessages.createdAt))
        .limit(MAX_MESSAGES)

      return NextResponse.json({ session: owned, messages })
    } catch (error) {
      safeLogError("[CHAT MESSAGES GET]", error)
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
    }
  })
}
