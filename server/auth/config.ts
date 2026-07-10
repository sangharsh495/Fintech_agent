import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { CredentialsSignin } from "next-auth"
import { db } from "@/server/db"
import { users, userProfiles } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED"
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

          if (!user || !user.passwordHash) return null

          const isValid = await bcrypt.compare(password, user.passwordHash)
          if (!isValid) return null

          // Only allow verified users
          if (!user.emailVerified) {
            throw new EmailNotVerifiedError()
          }

          const profile = await db
            .select({ onboardingComplete: userProfiles.onboardingComplete })
            .from(userProfiles)
            .where(eq(userProfiles.userId, user.id))
            .limit(1)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            onboardingComplete: profile[0]?.onboardingComplete ?? false,
          }
        } catch (error) {
          if (error instanceof EmailNotVerifiedError) {
            throw error
          }
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image ?? null
        token.onboardingComplete = user.onboardingComplete
      }
      if (trigger === "update" && session?.onboardingComplete !== undefined) {
        token.onboardingComplete = session.onboardingComplete
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = (token.image as string) ?? null
        session.user.onboardingComplete = token.onboardingComplete as boolean
      }
      return session
    },
    async authorized({ auth }) {
      // Returning true allows the request; middleware handles redirects
      return !!auth?.user
    },
  },
  trustHost: true,
}
