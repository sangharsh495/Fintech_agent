import { NextRequest, NextResponse } from "next/server"
import { authRateLimiter } from "@/server/lib/rate-limit"
import { safeLogError } from "@/server/lib/safe-log"
import { z } from "zod"
import {
  getUserByEmail,
  createUser,
  updateUserUnverified,
  hashPassword,
  generateOTP,
  storeOTP,
  sendOTPEmail,
} from "@/server/services/auth.service"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain a number"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const rateLimit = await authRateLimiter.check(`register:${email}`)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Check if user already exists
    const existing = await getUserByEmail(email)
    let userId: string

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        )
      }

      // Existing unverified user: update credentials and resend verification code
      const updated = await updateUserUnverified(email, passwordHash, name)
      userId = updated?.id || existing.id
    } else {
      // Create fresh user
      const user = await createUser(email, passwordHash, name)
      userId = user.id
    }

    // Generate & store OTP
    const otp = generateOTP()
    await storeOTP(email, otp)
    const emailDelivery = await sendOTPEmail(email, otp, name)

    return NextResponse.json({
      success: true,
      message: "Account created. A verification code has been sent to your email address.",
      userId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      )
    }
    safeLogError("[REGISTER]", error)
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 })
  }
}
