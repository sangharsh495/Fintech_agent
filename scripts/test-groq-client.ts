import { callGroq } from "../lib/groq/client"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function testGroqClient() {
  console.log("Testing callGroq with JSON parsing prompt...")
  const prompt = `You are a bank statement parser. Return ONLY a JSON object with: {"status": "ok", "message": "Groq client working"}`
  const response = await callGroq(prompt)
  console.log("Response from Groq client:", response)
}

testGroqClient().catch(console.error)
