import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyOTP } from "@/server/services/auth.service"
import { safeLogError } from "@/server/lib/safe-log"
import { authRateLimiter } from "@/server/lib/rate-limit"

const schema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase().trim()),
  otp: z.string().length(6, "OTP must be 6 digits").trim(),
})

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = schema.parse(await req.json())

    // Rate limiting check
    const rateLimit = await authRateLimiter.check(`verify:${email}`)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many verification attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      )
    }

    const result = await verifyOTP(email, otp)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 })
    }
    safeLogError("[VERIFY_OTP]", error)
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 })
  }
}
