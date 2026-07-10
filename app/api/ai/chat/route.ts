import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { buildUserContext } from "@/server/services/ai-context.service"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

// Use custom Oracle Cloud deployment (OpenAI compatible)
// Fallback to Groq for local testing if variables aren't set
const aiModel = createOpenAI({
  baseURL: process.env.ORACLE_AI_ENDPOINT || "https://api.groq.com/openai/v1",
  apiKey: process.env.ORACLE_AI_API_KEY || process.env.GROQ_API_KEY || "",
})

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages } = await req.json()
    const userContext = await buildUserContext(session.user.id)

    const result = streamText({
      model: groq("llama-3.1-8b-instant"),
      system: `You are FinFlow AI, a personal financial assistant for Indian users.
You have access to the user's real financial data below.
Give specific, actionable answers using actual numbers from their data.
For tax questions, reference Indian Income Tax Act sections.
Format currency as ₹X,XX,XXX (Indian numbering).
Keep responses concise. Use bullet points for lists.
Never discuss other users data.

${userContext}`,
      messages,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[AI CHAT]", error)
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
  }
}
