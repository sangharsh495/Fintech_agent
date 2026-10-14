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

function publicOrigin(): string | null {
    const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL
    if (!configured) return null
    try {
        return new URL(configured).origin
    } catch {
        return null
    }
}

export default auth(async function middleware(req) {
    const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { id: string; onboardingComplete?: boolean } } | null }
    const pathname = nextUrl.pathname

    // Redirect to the app's public address. Vercel and most proxies forward
    // the real host; behind `next start` the headers and nextUrl all say
    // "localhost", and then the configured canonical URL is the better answer.
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || nextUrl.host
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
    const origin = host.startsWith("localhost") ? publicOrigin() ?? `${proto}://${host}` : `${proto}://${host}`
    const redirectTo = (path: string, params?: Record<string, string>) => {
        const url = new URL(path, origin)
        for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v)
        return NextResponse.redirect(url)
    }

    // 1. Root page "/" is public for unauthenticated users (shows Landing Page)
    // Authenticated users on "/" proceed directly to the Dashboard
    if (pathname === "/") {
        // A brand-new account lands here after sign-in; send it through
        // onboarding first (skipping onboarding marks it complete).
        if (session?.user && session.user.onboardingComplete === false) {
            return redirectTo("/onboarding")
        }
        return NextResponse.next()
    }

    // 2. Allow public routes
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    
    // Redirect authenticated users away from auth login/signup pages to Dashboard
    if (session?.user && pathname.startsWith("/auth/")) {
        return redirectTo("/")
    }

    if (isPublicRoute) return NextResponse.next()

    // 3. Allow API routes - they handle their own authentication (Bearer tokens for mobile, NextAuth for web)
    if (pathname.startsWith("/api/")) {
        return NextResponse.next()
    }

    // 4. Redirect unauthenticated users to login for protected pages
    if (!session?.user) {
        return redirectTo("/auth/login", { callbackUrl: pathname })
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
