/**
 * app/api/ai/chat/route.ts
 *
 * PHASE 5: Hardened AI Chat Route
 *
 * Security guarantees:
 * 1. userId from verified JWT only — NEVER from request body
 * 2. Uses buildCASystemPrompt() which reads from aggregation tables only
 * 3. System prompt includes explicit prompt-injection defenses
 * 4. Every AI call logged to ai_audit_log (context hash, not raw content)
 * 5. Context is stateless — reconstructed per-request from DB
 * 6. Messages persisted to chat_messages for session continuity
 * 7. console.error replaced with safeLog
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { buildCASystemPrompt } from "@/server/services/ai-context.service"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { oracleAccessControl } from "@/server/services/oracle-access-control.service"
import { groqRotator } from "@/server/services/groq-rotator.service"
import { db } from "@/server/db"
import { aiAuditLog, chatSessions, chatMessages } from "@/server/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { safeLogError, safeLogInfo } from "@/server/lib/safe-log"

export const dynamic = "force-dynamic"

// Configure Oracle AI endpoint
const endpoint = process.env.ORACLE_AI_ENDPOINT
const apiKey = process.env.ORACLE_AI_API_KEY

if (!endpoint || !apiKey) {
  safeLogInfo("[AI CHAT] ORACLE_AI_ENDPOINT or ORACLE_AI_API_KEY not defined. Running with Groq fallback.")
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ─── userId from JWT ONLY, never from request body ────────
  const userId = session.user.id
  const userEmail = session.user.email || ""
  let currentPath = "/"
  const startTime = Date.now()

  try {
    const body = await req.json()
    currentPath = body.currentPath || "/"
    const { messages, contextTypes, maxTokens, sessionId } = body

    // ─── Build hardened system prompt (Phase 5) ─────────────
    // buildCASystemPrompt:
    // - Accepts ONLY userId (from verified JWT)
    // - Reads from aggregation tables (monthly_summaries, tax_summaries, goals)
    // - Includes prompt-injection defense preamble
    // - Returns contextHash for audit logging
    const { context, accessContext, pagePolicy, contextHash } = await buildCASystemPrompt(
      userId,
      currentPath,
      userEmail
    )

    // ─── Access control checks ──────────────────────────────
    await oracleAccessControl.logAccessAttempt(userId, userEmail, "ai_chat", currentPath, pagePolicy.allowed)

    if (!pagePolicy.allowed) {
      return NextResponse.json({
        error: "Access to AI chat on this page is restricted",
        restrictions: pagePolicy.restrictions,
      }, { status: 403 })
    }

    const requestedContextTypes = contextTypes || ["profile", "aggregates", "tax", "summary"]
    const requestedTokens = maxTokens || (pagePolicy.allowedOperations.includes("full-context") ? 4000 : 2000)

    const aiAccess = await oracleAccessControl.verifyAIModelAccess(userId, userEmail, requestedContextTypes, requestedTokens)
    if (!aiAccess.allowed) {
      return NextResponse.json({ error: "AI model access denied", reason: aiAccess.reason }, { status: 403 })
    }

    const rateLimit = await oracleAccessControl.checkRateLimit(userId, requestedTokens)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      }, { status: 429 })
    }

    // ─── Chat session management (Phase 6) ──────────────────
    let activeSessionId = sessionId
    if (!activeSessionId) {
      // Create a new session or find the active one for this page
      const [existingSession] = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.userId, userId), eq(chatSessions.isActive, true)))
        .orderBy(desc(chatSessions.updatedAt))
        .limit(1)

      if (existingSession) {
        activeSessionId = existingSession.id
      } else {
        const [newSession] = await db.insert(chatSessions).values({
          userId,
          pageContext: currentPath,
          title: "New Chat",
        }).returning()
        activeSessionId = newSession!.id
      }
    }

    // Persist the user's message
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage && lastUserMessage.role === "user") {
        await db.insert(chatMessages).values({
          sessionId: activeSessionId,
          userId,
          role: "user",
          content: lastUserMessage.content,
          tokenCount: Math.ceil(lastUserMessage.content.length / 4), // rough estimate
        })
      }
    }

    // Load last 20 messages from this session for context continuity
    const recentMessages = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(and(eq(chatMessages.sessionId, activeSessionId), eq(chatMessages.userId, userId)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20)

    // Reverse to chronological order and format for the model
    const historyMessages = recentMessages.reverse().map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }))

    // Use history if available, otherwise use the messages from the request
    const modelMessages = historyMessages.length > 0 ? historyMessages : messages

    // ─── Model selection ────────────────────────────────────
    const modelName = aiAccess.policy?.model || process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b"

    const isOracleConfigured =
      apiKey &&
      !apiKey.includes("your-deployment-ocid") &&
      endpoint &&
      !endpoint.includes("amaaaaaak...")

    // ─── The system prompt IS the hardened context from buildCASystemPrompt ──
    // NO additional system prompt text is added here — the defense preamble,
    // financial directives, and RLS-scoped data are ALL in `context`.
    const systemPrompt = context

    let streamResponse: Response

    if (isOracleConfigured) {
      const oracleModel = createOpenAI({ baseURL: endpoint, apiKey: apiKey })

      const result = streamText({
        model: oracleModel(modelName),
        system: systemPrompt,
        messages: modelMessages,
      } as any)

      streamResponse = result.toTextStreamResponse()
    } else {
      // Groq fallback with key rotation
      streamResponse = await groqRotator.execute(async (currentKey) => {
        const groqModelName = modelName.includes("oracle") ? "qwen2.5-coder-32b" : modelName
        const groqModel = createOpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: currentKey || "",
        })

        const result = streamText({
          model: groqModel(groqModelName),
          system: systemPrompt,
          messages: modelMessages,
        } as any)

        return result.toTextStreamResponse()
      })
    }

    // ─── Audit log (context HASH, not raw content) ──────────
    const latencyMs = Date.now() - startTime
    const modelProvider = isOracleConfigured ? "oracle_cloud" : "groq"

    await db.insert(aiAuditLog).values({
      userId,
      sessionId: activeSessionId,
      contextHash,
      inputTokenCount: requestedTokens,
      outputTokenCount: 0, // Updated asynchronously if token counting is available
      modelUsed: modelName,
      modelProvider,
      latencyMs,
      pageContext: currentPath,
      isError: false,
    }).catch((err) => {
      // Audit log failure should NOT block the response
      safeLogError("[AI AUDIT] Failed to log audit entry", err)
    })

    // Log AI usage for rate limiting and billing
    await oracleAccessControl.logAIUsage(userId, userEmail, modelName, requestedTokens, requestedContextTypes, currentPath, true)

    // Update session timestamp
    await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, activeSessionId)).catch(() => {})

    return streamResponse
  } catch (error) {
    const latencyMs = Date.now() - startTime

    safeLogError("[AI CHAT]", error)

    // Log failed attempt to audit log
    await db.insert(aiAuditLog).values({
      userId,
      contextHash: "error",
      modelUsed: process.env.ORACLE_AI_MODEL || "unknown",
      modelProvider: "unknown",
      latencyMs,
      pageContext: currentPath,
      isError: true,
      errorType: error instanceof Error ? error.constructor.name : "UnknownError",
    }).catch(() => {})

    await oracleAccessControl.logAIUsage(userId, userEmail, process.env.ORACLE_AI_MODEL || "unknown", 0, [], currentPath, false)

    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
  }
}
