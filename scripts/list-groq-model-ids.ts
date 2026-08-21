import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function listModelIds() {
  const apiKey = process.env.GROQ_API_KEY
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const data = await res.json()
  const ids = data.data.map((m: any) => m.id)
  console.log("Available Groq models:", ids)
}

listModelIds().catch(console.error)
