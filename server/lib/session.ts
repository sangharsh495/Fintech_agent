/**
 * server/lib/session.ts
 *
 * Typed helpers for accessing the authenticated session in:
 *  - Server Components
 *  - Route Handlers (API routes)
 *  - Server Actions
 *
 * These functions call `auth()` from NextAuth v5, which reads & verifies
 * the JWT from the incoming request cookie — no extra DB round-trip needed.
 */

import { auth } from "@/server/auth"
import { redirect } from "next/navigation"

/** Shape of the user object available after authentication */
export type AuthUser = {
    id: string
    email: string
    name: string | null
    image: string | null
}

/**
 * Returns the currently authenticated user, or `null` if not logged in.
 *
 * @example
 * // In a Server Component:
 * const user = await getCurrentUser()
 * if (!user) return <LoginPrompt />
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    return {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        image: session.user.image ?? null,
    }
}

/**
 * Returns the currently authenticated user, or redirects to `/auth/login`.
 * Use this in Server Components / Server Actions that require authentication.
 *
 * @example
 * // In a protected Server Component:
 * const user = await requireUser()
 * // user is guaranteed to be AuthUser here
 */
export async function requireUser(): Promise<AuthUser> {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/auth/login")
    }
    return user
}
