import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function listModels() {
  const apiKey = process.env.GROQ_API_KEY
  console.log("Checking API key starts with:", apiKey?.slice(0, 10))

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  console.log("Status:", res.status)
  const data = await res.json()
  console.log("Response:", JSON.stringify(data, null, 2))
}

listModels().catch(console.error)
