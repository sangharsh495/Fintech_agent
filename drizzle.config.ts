import { defineConfig } from "drizzle-kit"
import * as dotenv from "dotenv"

// drizzle-kit CLI does not auto-load .env.local; load it explicitly
dotenv.config({ path: ".env.local" })

// Strip channel_binding param — pg driver doesn't use it (handles SSL natively)
const rawUrl = process.env.DATABASE_URL!
const migrationUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "")

export default defineConfig({
    dialect: "postgresql",
    schema: "./server/db/schema/index.ts",
    out: "./server/db/migrations",
    dbCredentials: {
        url: migrationUrl,
    },
})
