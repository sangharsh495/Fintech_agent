import { SignJWT, jwtVerify } from "jose"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret")
const TOKEN_EXPIRY = "30d" // 30 days, same as NextAuth session

/**
 * Sign a JWT token for mobile authentication.
 * Uses the same AUTH_SECRET as NextAuth for consistency.
 */
export async function signMobileToken(user: {
  id: string
  email: string
  name: string | null
  image: string | null
}): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    type: "mobile",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setSubject(user.id)
    .sign(SECRET)
}

/**
 * Verify a mobile JWT token and return the payload.
 */
export async function verifyMobileToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as {
      id: string
      email: string
      name: string | null
      image: string | null
      type: string
    }
  } catch {
    return null
  }
}

/**
 * Extract Bearer token from Authorization header and return a session-like object.
 * Returns the same shape as NextAuth's auth() for compatibility.
 */
export async function getMobileSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7)
  const payload = await verifyMobileToken(token)
  if (!payload || payload.type !== "mobile") return null

  // Verify user still exists in database
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1)

  if (!user) return null

  // Return NextAuth-compatible session shape
  return {
    user: {
      id: user.id,
      email: user.email!,
      name: user.name || "",
      image: user.image || null,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}
