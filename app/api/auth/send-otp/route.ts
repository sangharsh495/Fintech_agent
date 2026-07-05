import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUserByEmail, generateOTP, storeOTP, sendOTPEmail } from "@/server/services/auth.service"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json())

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
    console.error("[SEND_OTP]", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
