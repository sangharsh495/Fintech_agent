import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { buildUserContext } from "@/server/services/ai-context.service"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

export const dynamic = "force-dynamic"

// Configure OpenAI-compatible provider with Oracle Cloud endpoint
const endpoint = process.env.ORACLE_AI_ENDPOINT;
const apiKey = process.env.ORACLE_AI_API_KEY;

if (!endpoint || !apiKey) {
  console.warn("[AI CHAT] ORACLE_AI_ENDPOINT or ORACLE_AI_API_KEY is not defined in environment variables. Running with local development configuration.");
}

const aiModel = createOpenAI({
  baseURL: endpoint || "https://api.groq.com/openai/v1",
  apiKey: apiKey || process.env.GROQ_API_KEY || "",
})

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, currentPath } = await req.json()
    const userContext = await buildUserContext(session.user.id, currentPath || "/")

    const modelName = process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b"

    const result = streamText({
      model: aiModel(modelName),
      system: `You are FinWise AI, a premium personal financial assistant for Indian users.
You have comprehensive access to the user's real financial context (Profile details, KYC status, Active bank accounts, spending habits, monthly trend metrics, and tax calculation breakdown).

PROACTIVE FINANCIAL PLANNING DIRECTIVES:
1. Cross-reference the user's tax liability and 80C opportunities with their top spending categories and monthly savings rate.
2. If they have discretionary spending room (e.g. heavy shopping/entertainment expenses) and remaining 80C limits, suggest channeling a portion of that spend into tax-saving instruments (ELSS, PPF, or LIC) to maximize tax optimization.
3. Reference specific sections of the Indian Income Tax Act (e.g. Section 80C, 80D, 80CCD(1B)) using exact numbers from their context.
4. Format all currency amounts as ₹X,XX,XXX (Indian numbering scale).
5. Always keep responses concise, premium, actionable, and formatted in clear bullet points.
6. Enforce strict privacy: Never discuss other users' data. Keep recommendations private.

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
