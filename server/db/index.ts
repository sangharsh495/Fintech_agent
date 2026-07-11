import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/mock"
const sql = neon(connectionString)

export const db = drizzle(sql, { schema })
export type Database = typeof db
