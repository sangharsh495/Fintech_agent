import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function testDataStream() {
  console.log("Testing streamText format...")
  const groq = (createOpenAI as any)({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY!,
    compatibility: "compatible",
  })

  const result = streamText({
    model: groq.chat("openai/gpt-oss-120b"),
    messages: [{ role: "user", content: "Say hello in 3 words" }],
  })

  const dataStreamRes = result.toUIMessageStreamResponse()
  const dataStreamText = await dataStreamRes.text()
  console.log("\n--- toDataStreamResponse Output ---")
  console.log(dataStreamText)

  const result2 = streamText({
    model: groq.chat("openai/gpt-oss-120b"),
    messages: [{ role: "user", content: "Say hello in 3 words" }],
  })

  const textStreamRes = result2.toTextStreamResponse()
  const textStreamText = await textStreamRes.text()
  console.log("\n--- toTextStreamResponse Output ---")
  console.log(textStreamText)
}

testDataStream().catch(console.error)
