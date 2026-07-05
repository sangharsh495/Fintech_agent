/**
 * server/trpc/context.ts
 *
 * Creates the tRPC request context, injecting the authenticated user
 * from the NextAuth v5 JWT token.
 *
 * `userId` will be `null` for unauthenticated requests.
 * Protected tRPC procedures should check `ctx.userId` and throw
 * a `TRPCError({ code: "UNAUTHORIZED" })` when it is null.
 */

import { auth } from "@/server/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"

export async function createContext(_opts: FetchCreateContextFnOptions) {
    const session = await auth()

    return {
        userId: session?.user?.id ?? null,
        user: session?.user
            ? {
                id: session.user.id!,
                email: session.user.email ?? "",
                name: session.user.name ?? null,
                image: session.user.image ?? null,
            }
            : null,
    }
}

/** Inferred Context type for use in tRPC router/procedure definitions */
export type Context = Awaited<ReturnType<typeof createContext>>
