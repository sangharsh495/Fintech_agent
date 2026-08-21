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
  email: z.string().email("Invalid email address").transform((val) => val.toLowerCase().trim()),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp, newPassword } = requestSchema.parse(body)

    // Rate limit check
    const rateLimit = await authRateLimiter.check(`forgot:${email}`)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      )
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please check your email or create a new account." },
        { status: 404 }
      )
    }

    // Step 2: If OTP and newPassword are provided, verify and reset password
    if (otp && newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long." },
          { status: 400 }
        )
      }

      const verification = await verifyOTP(email, otp)
      if (!verification.success) {
        return NextResponse.json(
          { error: verification.message || "Invalid or expired verification code." },
          { status: 400 }
        )
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
    const emailResult = await sendOTPEmail(email, generatedOtp, user.name ?? undefined)

    return NextResponse.json({
      success: true,
      message: "Reset code has been sent to your email address.",
      delivered: emailResult.sent,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input fields" }, { status: 400 })
    }
    safeLogError("[FORGOT_PASSWORD]", error)
    return NextResponse.json(
      { error: error?.message || "Failed to process password reset. Please try again." },
      { status: 500 }
    )
  }
}
