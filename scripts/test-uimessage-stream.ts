import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function testUIMessageStream() {
  console.log("Testing toUIMessageStreamResponse...")
  const groq = (createOpenAI as any)({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY!,
    compatibility: "compatible",
  })

  const result = streamText({
    model: groq.chat("openai/gpt-oss-120b"),
    messages: [{ role: "user", content: "Say hello in 3 words" }],
  })

  const res = result.toUIMessageStreamResponse()
  console.log("Headers:", Object.fromEntries(res.headers.entries()))
  const text = await res.text()
  console.log("\n--- toUIMessageStreamResponse Output ---")
  console.log(text)
}

testUIMessageStream().catch(console.error)
