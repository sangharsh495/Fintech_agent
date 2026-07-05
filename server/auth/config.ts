import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

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
            throw new Error("EMAIL_NOT_VERIFIED")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = (token.image as string) ?? null
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
