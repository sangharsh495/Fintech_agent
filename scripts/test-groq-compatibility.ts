import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function testGroqCompatibility() {
  console.log("Testing Groq with compatibility: 'compatible'...")
  const groq = (createOpenAI as any)({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY!,
    compatibility: "compatible",
  })

  const modelsToTest = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "groq/compound",
  ]

  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: ${modelName}...`)
    try {
      const result = streamText({
        model: groq.chat(modelName),
        messages: [{ role: "user", content: "What is 2+2? Reply in 5 words." }],
      })

      for await (const chunk of result.textStream) {
        process.stdout.write(chunk)
      }
      console.log(`\n✓ Model ${modelName} succeeded!`)
      break
    } catch (err: any) {
      console.log(`✗ Model ${modelName} failed:`, err.message)
    }
  }
}

testGroqCompatibility().catch(console.error)
