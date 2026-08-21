import { NextRequest } from "next/server"
import { POST } from "../app/api/ai/chat/route"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { signMobileToken } from "../server/lib/mobile-auth"

async function testAIChat() {
  console.log("Testing POST /api/ai/chat...")
  const [user] = await db.select().from(users).limit(1)
  if (!user) {
    console.log("No user found in DB")
    return
  }
  console.log("Testing with user:", user.id, user.email)

  const token = await signMobileToken({
    id: user.id,
    email: user.email,
    name: user.name,
    image: null,
  })

  const req = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "user", content: "What are the tax slabs under the New Tax Regime for FY 2025-26?" },
      ],
      currentPath: "/ai-ca",
    }),
  })

  const res = await POST(req)
  console.log("Response status:", res.status)
  if (res.status !== 200) {
    const json = await res.json()
    console.error("Error response:", json)
  } else {
    const text = await res.text()
    console.log("Response stream length:", text.length)
    console.log("Response preview:", text.slice(0, 300))
  }
}

testAIChat()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution error:", err)
    process.exit(1)
  })
