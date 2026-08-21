import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!
const connectionUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "")
const sql = neon(connectionUrl)

async function updateEnums() {
  console.log("Updating database enums for AI CA...")
  try {
    await sql`ALTER TYPE ai_page ADD VALUE IF NOT EXISTS '/ai-ca';`
    console.log("✓ Added '/ai-ca' to ai_page enum")
  } catch (err: any) {
    console.log("ai_page enum update:", err.message)
  }

  try {
    await sql`ALTER TYPE ai_context_type ADD VALUE IF NOT EXISTS 'aggregates';`
    console.log("✓ Added 'aggregates' to ai_context_type enum")
  } catch (err: any) {
    console.log("ai_context_type enum update:", err.message)
  }
}

updateEnums()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to update enums:", err)
    process.exit(1)
  })
