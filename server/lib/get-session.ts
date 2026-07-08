import { auth } from "@/server/auth"
import { getMobileSession } from "@/server/lib/mobile-auth"
import type { NextRequest } from "next/server"

/**
 * Unified session resolver that supports both:
 * 1. Web (NextAuth cookies) — used by the browser
 * 2. Mobile (Bearer JWT token) — used by the React Native app
 *
 * Returns a NextAuth-compatible session object or null.
 *
 * Usage:
 *   // For routes that receive a NextRequest (GET with searchParams, POST, PATCH, etc.)
 *   const session = await getSession(req)
 *
 *   // For simple GET routes with no request object
 *   const session = await getSession()
 */
export async function getSession(req?: NextRequest) {
  // 1. Try NextAuth session first (web browser with cookies)
  try {
    const webSession = await auth()
    if (webSession?.user?.id) return webSession
  } catch {
    // NextAuth may throw if no cookies present (e.g., mobile request)
  }

  // 2. Fall back to Bearer token (mobile app)
  if (req) {
    const mobileSession = await getMobileSession(req)
    if (mobileSession) return mobileSession
  }

  return null
}
