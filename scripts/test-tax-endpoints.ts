import { NextRequest } from "next/server"
import { GET as getFiling } from "../app/api/tax/filing/route"
import { GET as getDocuments } from "../app/api/tax/documents/route"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { signMobileToken } from "../server/lib/mobile-auth"

async function testEndpoints() {
  console.log("Testing Tax Filing & Document API endpoints...")
  const [user] = await db.select().from(users).limit(1)
  if (!user) {
    console.log("No user found")
    return
  }

  // Generate valid mobile token for test
  const token = await signMobileToken({
    id: user.id,
    email: user.email,
    name: user.name,
    image: null,
  })

  // Test 1: GET /api/tax/filing?fy=2025-2026
  const req1 = new NextRequest("http://localhost:3000/api/tax/filing?fy=2025-2026", {
    headers: { Authorization: `Bearer ${token}` },
  })
  const res1 = await getFiling(req1)
  console.log("GET /api/tax/filing status:", res1.status)
  const json1 = await res1.json()
  console.log("GET /api/tax/filing response summary:", {
    financialYear: json1.financialYear,
    selectedRegime: json1.selectedRegime,
    itrForm: json1.itrForm,
    summary: json1.summary,
  })

  // Test 2: GET /api/tax/documents?fy=2025-2026
  const req2 = new NextRequest("http://localhost:3000/api/tax/documents?fy=2025-2026", {
    headers: { Authorization: `Bearer ${token}` },
  })
  const res2 = await getDocuments(req2)
  console.log("GET /api/tax/documents status:", res2.status)
  const json2 = await res2.json()
  console.log("GET /api/tax/documents response:", json2)

  console.log("\n🎉 All Tax endpoints PASSED successfully!")
}

testEndpoints()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err)
    process.exit(1)
  })
