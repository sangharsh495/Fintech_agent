import { NextRequest } from "next/server"
import { POST } from "../app/api/auth/forgot-password/route"
import { getUserByEmail, createUser, hashPassword, storeOTP } from "../server/services/auth.service"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { sql } from "drizzle-orm"

async function testForgotPasswordFlow() {
  console.log("Testing POST /api/auth/forgot-password...")
  const testEmail = `reset_test_${Date.now()}@gmail.com`
  const initialPasswordHash = await hashPassword("OldPassword123!")

  // Create user
  await createUser(testEmail, initialPasswordHash, "Reset Test User")
  console.log("Created test user:", testEmail)

  // Step 1: Request OTP
  console.log("Step 1: Requesting reset OTP...")
  const req1 = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  })

  const res1 = await POST(req1)
  console.log("Step 1 status:", res1.status)
  const json1 = await res1.json()
  console.log("Step 1 response:", json1)

  // Step 2: Submit with invalid OTP
  console.log("Step 2: Submitting with invalid OTP...")
  const req2 = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, otp: "000000", newPassword: "NewStrongPassword123!" }),
  })
  const res2 = await POST(req2)
  console.log("Step 2 status (invalid OTP):", res2.status)
  const json2 = await res2.json()
  console.log("Step 2 response:", json2)

  // Clean up
  await db.delete(users).where(sql`lower(${users.email}) = ${testEmail.toLowerCase()}`)
  console.log("Cleaned up test user.")
}

testForgotPasswordFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test error:", err)
    process.exit(1)
  })
