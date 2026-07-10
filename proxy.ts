import { auth } from "@/server/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that don't require auth.
// "/api/auth" covers the NextAuth.js handler (GET/POST for signIn, signOut, session, csrf, etc.)
// The three routes below are custom API routes — not handled by NextAuth handlers.
const PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/signup",
    "/api/auth",           // NextAuth handler (and all sub-paths like /api/auth/session)
    "/api/auth/register",  // Custom: user registration
    "/api/auth/send-otp",  // Custom: resend OTP
    "/api/auth/verify-otp", // Custom: OTP verification
]

export default auth(async function middleware(req) {
    const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { id: string; onboardingComplete?: boolean } } | null }
    const pathname = nextUrl.pathname

    // Allow public routes
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    
    // Redirect authenticated users away from auth pages
    if (session?.user && pathname.startsWith("/auth/")) {
        return NextResponse.redirect(new URL("/", nextUrl))
    }

    if (isPublicRoute) return NextResponse.next()

    // Allow API routes - they handle their own authentication (Bearer tokens for mobile, NextAuth for web)
    if (pathname.startsWith("/api/")) {
        return NextResponse.next()
    }

    // Redirect unauthenticated users to login
    if (!session?.user) {
        const loginUrl = new URL("/auth/login", nextUrl)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Enforce onboarding flow
    const onboardingComplete = session.user.onboardingComplete === true
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    if (!onboardingComplete && !isOnboardingRoute) {
        return NextResponse.redirect(new URL('/onboarding', nextUrl))
    }

    if (onboardingComplete && isOnboardingRoute) {
        return NextResponse.redirect(new URL('/', nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
