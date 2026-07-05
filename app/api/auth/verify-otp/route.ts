import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyOTP } from "@/server/services/auth.service"

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = schema.parse(await req.json())
    const result = await verifyOTP(email, otp)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    console.error("[VERIFY_OTP]", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
