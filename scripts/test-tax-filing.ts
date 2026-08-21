import { withUserScopedDb } from "../server/db/rls-connection"
import { buildFilingDraft, loadWizardInputs } from "../server/services/tax/filing.service"
import { resolveFinancialYear } from "../server/services/tax/filing.service"
import { db } from "../server/db"
import { users } from "../server/db/schema"

async function testFiling() {
  console.log("Testing filing service...")
  const [user] = await db.select().from(users).limit(1)
  if (!user) {
    console.log("No user found in DB")
    return
  }
  console.log("Testing with user:", user.id, user.email)

  const fy = resolveFinancialYear(null) // default FY
  console.log("Resolved FY:", fy)

  try {
    const result = await withUserScopedDb(user.id, async (scopedDb) => {
      const savedInputs = await loadWizardInputs(scopedDb, user.id, fy!)
      console.log("Loaded wizard inputs:", savedInputs)
      const draft = await buildFilingDraft(scopedDb, user.id, fy!, savedInputs)
      console.log("Built draft successfully:", draft.financialYear, draft.selectedRegime)
      return draft
    })
    console.log("Result:", result.computation)
  } catch (err) {
    console.error("Error building filing draft:", err)
  }
}

testFiling()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err)
    process.exit(1)
  })
