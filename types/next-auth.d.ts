import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      onboardingComplete?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    onboardingComplete?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    onboardingComplete?: boolean
  }
}
