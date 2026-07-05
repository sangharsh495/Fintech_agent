import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUserByEmail, createUser, hashPassword, generateOTP, storeOTP, sendOTPEmail } from "@/server/services/auth.service"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
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

    // Check if user already exists
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await createUser(email, passwordHash, name)

    // Generate & send OTP
    const otp = generateOTP()
    await storeOTP(email, otp)
    await sendOTPEmail(email, otp, name)

    return NextResponse.json({
      success: true,
      message: "Account created. Check your email for the verification code.",
      userId: user.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      )
    }
    console.error("[REGISTER]", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
