import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUserByEmail, generateOTP, storeOTP, sendOTPEmail } from "@/server/services/auth.service"
import { safeLogError } from "@/server/lib/safe-log"
import { authRateLimiter } from "@/server/lib/rate-limit"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json())

    // Rate limiting check
    const rateLimit = await authRateLimiter.check(email.toLowerCase())
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      )
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 })
    }

    const otp = generateOTP()
    await storeOTP(email, otp)
    await sendOTPEmail(email, otp, user.name ?? undefined)

    return NextResponse.json({ success: true, message: "OTP sent to your email" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    safeLogError("[SEND_OTP]", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
