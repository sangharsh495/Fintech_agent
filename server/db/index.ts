import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "./schema"

const rawUrl = process.env.DATABASE_URL || "postgres://localhost:5432/mock"
const connectionString = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "")

/**
 * The Neon HTTP driver only talks to Neon's hosted endpoint. A local Postgres
 * (development, CI, end-to-end tests) is reached over the ordinary wire
 * protocol instead, with the same `pg` driver the RLS pool already uses. The
 * query API used across the app is the same on both.
 */
const isLocalDatabase = /^postgres(?:ql)?:\/\/[^@/]*@?(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(connectionString)

function createDb() {
  if (isLocalDatabase) {
    const local = drizzleNodePg(new pg.Pool({ connectionString, max: 5 }), { schema })
    return local as unknown as ReturnType<typeof drizzle<typeof schema>>
  }
  return drizzle(neon(connectionString), { schema })
}

export const db = createDb()
export type Database = typeof db
