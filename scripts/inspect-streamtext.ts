import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function inspectResult() {
  const groq = (createOpenAI as any)({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY!,
    compatibility: "compatible",
  })

  const result = streamText({
    model: groq.chat("openai/gpt-oss-120b"),
    messages: [{ role: "user", content: "Say hello in 3 words" }],
  })

  console.log("StreamText result methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(result)))
  console.log("StreamText result keys:", Object.keys(result))
}

inspectResult().catch(console.error)
