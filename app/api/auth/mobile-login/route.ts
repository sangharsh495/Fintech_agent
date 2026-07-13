import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUserByEmail, verifyPassword } from "@/server/services/auth.service"
import { signMobileToken } from "@/server/lib/mobile-auth"
import { safeLogError } from "@/server/lib/safe-log"
import { authRateLimiter } from "@/server/lib/rate-limit"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

/**
 * Mobile Login Endpoint
 *
 * Unlike the web (which uses NextAuth cookies), mobile apps need
 * a JWT token returned directly in the response body.
 *
 * The mobile app stores this token in expo-secure-store and sends
 * it as "Authorization: Bearer <token>" on every API request.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    // Rate limiting check
    const rateLimit = await authRateLimiter.check(email.toLowerCase())
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      )
    }

    // Find user
    const user = await getUserByEmail(email)
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first" },
        { status: 403 }
      )
    }

    // Generate JWT token for mobile
    const token = await signMobileToken({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      )
    }
    safeLogError("[MOBILE LOGIN]", error)
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    )
  }
}

/**
 * Handle CORS preflight for mobile app
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
