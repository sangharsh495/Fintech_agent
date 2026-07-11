import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { buildUserContext } from "@/server/services/ai-context.service"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { oracleAccessControl } from "@/server/services/oracle-access-control.service"
import { groqRotator } from "@/server/services/groq-rotator.service"

export const dynamic = "force-dynamic"

// Configure OpenAI-compatible provider with Oracle Cloud endpoint
const endpoint = process.env.ORACLE_AI_ENDPOINT;
const apiKey = process.env.ORACLE_AI_API_KEY;

if (!endpoint || !apiKey) {
  console.warn("[AI CHAT] ORACLE_AI_ENDPOINT or ORACLE_AI_API_KEY is not defined in environment variables. Running with local development configuration.");
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

    let currentPath = "/";
    try {
      const body = await req.json();
      currentPath = body.currentPath || "/";
      const { messages, contextTypes, maxTokens } = body;
    const userId = session.user.id
    const userEmail = session.user.email || ""

    // Build user context with page-level access control via Oracle Cloud
    const { context, accessContext, pagePolicy } = await buildUserContext(userId, currentPath || "/", userEmail)

    // Log AI chat access attempt
    await oracleAccessControl.logAccessAttempt(
      userId,
      userEmail,
      "ai_chat",
      currentPath || "/",
      pagePolicy.allowed
    )

    if (!pagePolicy.allowed) {
      return NextResponse.json({ 
        error: "Access to AI chat on this page is restricted", 
        restrictions: pagePolicy.restrictions 
      }, { status: 403 })
    }

    // Verify AI model access
    const requestedContextTypes = contextTypes || ["profile", "transactions", "tax", "analytics", "summary"]
    const requestedTokens = maxTokens || pagePolicy.allowedOperations.includes("full-context") ? 4000 : 2000
    
    const aiAccess = await oracleAccessControl.verifyAIModelAccess(
      userId,
      userEmail,
      requestedContextTypes,
      requestedTokens
    )

    if (!aiAccess.allowed) {
      return NextResponse.json({ 
        error: "AI model access denied", 
        reason: aiAccess.reason 
      }, { status: 403 })
    }

    // Check rate limits
    const rateLimit = await oracleAccessControl.checkRateLimit(userId, requestedTokens)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: "Rate limit exceeded", 
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      }, { status: 429 })
    }

  // Use the model name defined in the user's AI model access policy. Fallback to environment variable or default.
  const modelName = aiAccess.policy?.model || process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b"

    // Check if Oracle AI is fully configured (not using placeholder values)
    const isOracleConfigured =
      apiKey &&
      !apiKey.includes("your-deployment-ocid") &&
      endpoint &&
      !endpoint.includes("amaaaaaak...");

    let streamResponse: Response;

    if (isOracleConfigured) {
      const oracleModel = createOpenAI({
        baseURL: endpoint,
        apiKey: apiKey,
      });

      const result = streamText({
        model: oracleModel(modelName),
        system: `You are FinWise AI, a premium personal financial assistant for Indian users.
You have comprehensive access to the user's real financial context (Profile details, KYC status, Active bank accounts, spending habits, monthly trend metrics, and tax calculation breakdown).

PROACTIVE FINANCIAL PLANNING DIRECTIVES:
1. Cross-reference the user's tax liability and 80C opportunities with their top spending categories and monthly savings rate.
2. If they have discretionary spending room (e.g. heavy shopping/entertainment expenses) and remaining 80C limits, suggest channeling a portion of that spend into tax-saving instruments (ELSS, PPF, or LIC) to maximize tax optimization.
3. Reference specific sections of the Indian Income Tax Act (e.g. Section 80C, 80D, 80CCD(1B)) using exact numbers from their context.
4. Format all currency amounts as ₹X,XX,XXX (Indian numbering scale).
5. Always keep responses concise, premium, actionable, and formatted in clear bullet points.
6. Enforce strict privacy: Never discuss other users' data. Keep recommendations private.

PAGE CONTEXT: ${currentPath || "/"} (Data scope: ${pagePolicy.dataScope}, Operations: ${pagePolicy.allowedOperations.join(", ")})

${context}`,
        messages,
      } as any);

      streamResponse = result.toTextStreamResponse();
    } else {
      // Fallback to Groq with key rotation and automatic retry logic
      streamResponse = await groqRotator.execute(async (currentKey) => {
        // Use a standard Groq LLM model name if using the Groq fallback
        const groqModelName = modelName.includes("oracle") ? "qwen2.5-coder-32b" : modelName;
        const groqModel = createOpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: currentKey || "",
        });

        const result = streamText({
          model: groqModel(groqModelName),
          system: `You are FinWise AI, a premium personal financial assistant for Indian users.
You have comprehensive access to the user's real financial context (Profile details, KYC status, Active bank accounts, spending habits, monthly trend metrics, and tax calculation breakdown).

PROACTIVE FINANCIAL PLANNING DIRECTIVES:
1. Cross-reference the user's tax liability and 80C opportunities with their top spending categories and monthly savings rate.
2. If they have discretionary spending room (e.g. heavy shopping/entertainment expenses) and remaining 80C limits, suggest channeling a portion of that spend into tax-saving instruments (ELSS, PPF, or LIC) to maximize tax optimization.
3. Reference specific sections of the Indian Income Tax Act (e.g. Section 80C, 80D, 80CCD(1B)) using exact numbers from their context.
4. Format all currency amounts as ₹X,XX,XXX (Indian numbering scale).
5. Always keep responses concise, premium, actionable, and formatted in clear bullet points.
6. Enforce strict privacy: Never discuss other users' data. Keep recommendations private.

PAGE CONTEXT: ${currentPath || "/"} (Data scope: ${pagePolicy.dataScope}, Operations: ${pagePolicy.allowedOperations.join(", ")})

${context}`,
          messages,
        } as any);

        return result.toTextStreamResponse();
      });
    }

    // Log AI usage for rate limiting and billing
    await oracleAccessControl.logAIUsage(
      userId,
      userEmail,
      modelName,
      requestedTokens, // Estimate, actual will be counted in production
      requestedContextTypes,
      currentPath || "/",
      true
    )

    return streamResponse
  } catch (error) {
    console.error("[AI CHAT]", error)
    await oracleAccessControl.logAIUsage(
      session.user.id,
      session.user.email || "",
      process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b",
      0,
      [],
      currentPath || "/",
      false
    )
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
  }
}
