import { auth } from "@/server/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isOnAuthRoute = nextUrl.pathname.startsWith('/auth')
  const isOnApiRoute = nextUrl.pathname.startsWith('/api')
  const isOnPublicRoute = isOnAuthRoute || nextUrl.pathname === '/public'

  if (isOnApiRoute) {
    return NextResponse.next()
  }

  if (isOnAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && !isOnPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', nextUrl))
  }

  // Enforce onboarding flow
  if (isLoggedIn) {
    const onboardingComplete = req.auth?.user?.onboardingComplete === true
    const isOnboardingRoute = nextUrl.pathname.startsWith('/onboarding')

    if (!onboardingComplete && !isOnboardingRoute) {
      return NextResponse.redirect(new URL('/onboarding', nextUrl))
    }

    if (onboardingComplete && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
