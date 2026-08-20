import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getUserByEmail,
  generateOTP,
  storeOTP,
  sendOTPEmail,
  verifyOTP,
  hashPassword,
  updateUserPassword,
} from "@/server/services/auth.service"
import { safeLogError } from "@/server/lib/safe-log"
import { authRateLimiter } from "@/server/lib/rate-limit"

const requestSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).optional(),
  newPassword: z.string().min(8).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp, newPassword } = requestSchema.parse(body)

    // Rate limit check
    const rateLimit = await authRateLimiter.check(email.toLowerCase())
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      )
    }

    const user = await getUserByEmail(email)
    if (!user) {
      // Don't leak user existence; return generic success message
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset code has been dispatched.",
      })
    }

    // Step 2: If OTP and newPassword are provided, verify and reset password
    if (otp && newPassword) {
      const verification = await verifyOTP(email, otp)
      if (!verification.success) {
        return NextResponse.json({ error: verification.message }, { status: 400 })
      }

      const hashedPassword = await hashPassword(newPassword)
      await updateUserPassword(email, hashedPassword)

      return NextResponse.json({
        success: true,
        message: "Password has been successfully updated. You can now sign in.",
      })
    }

    // Step 1: Request OTP for password reset
    const generatedOtp = generateOTP()
    await storeOTP(email, generatedOtp)
    await sendOTPEmail(email, generatedOtp, user.name ?? undefined)

    return NextResponse.json({
      success: true,
      message: "Reset code has been sent to your email address.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input fields" }, { status: 400 })
    }
    safeLogError("[FORGOT_PASSWORD]", error)
    return NextResponse.json({ error: "Failed to process password reset" }, { status: 500 })
  }
}
