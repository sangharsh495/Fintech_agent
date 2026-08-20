import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const rawUrl = process.env.DATABASE_URL || "postgres://localhost:5432/mock"
const connectionString = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "")
const sql = neon(connectionString)

export const db = drizzle(sql, { schema })
export type Database = typeof db
