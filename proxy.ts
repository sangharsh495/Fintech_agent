import { auth } from "@/server/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that don't require auth.
const PUBLIC_ROUTES = [
    "/auth",
    "/calculators",
    "/api/auth",
    "/api/health",
    "/api/docs",
]

export default auth(async function middleware(req) {
    const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { id: string; onboardingComplete?: boolean } } | null }
    const pathname = nextUrl.pathname

    // Determine the real public origin from request headers (prevents any localhost redirect on Vercel)
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || nextUrl.host
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
    const origin = `${proto}://${host}`

    // 1. Root page "/" is public for unauthenticated users (shows Landing Page)
    // Authenticated users on "/" proceed directly to the Dashboard
    if (pathname === "/") {
        return NextResponse.next()
    }

    // 2. Allow public routes
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    
    // Redirect authenticated users away from auth login/signup pages to Dashboard
    if (session?.user && pathname.startsWith("/auth/")) {
        return NextResponse.redirect(new URL("/", origin))
    }

    if (isPublicRoute) return NextResponse.next()

    // 3. Allow API routes - they handle their own authentication (Bearer tokens for mobile, NextAuth for web)
    if (pathname.startsWith("/api/")) {
        return NextResponse.next()
    }

    // 4. Redirect unauthenticated users to login for protected pages
    if (!session?.user) {
        const loginUrl = new URL("/auth/login", origin)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // 5. Allow authenticated users free access to all dashboard routes
    return NextResponse.next()
})

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
