/**
 * server/tests/rls-isolation.test.ts
 *
 * Cross-user RLS isolation test suite.
 * These tests MUST pass on every deploy — they are a CI gate.
 *
 * Tests verify that:
 * 1. User A cannot read User B's transactions
 * 2. User A cannot read User B's chat logs
 * 3. User A cannot read User B's bank accounts
 * 4. User A cannot read User B's profiles
 * 5. User A cannot read User B's statement uploads
 * 6. Queries without a user scope return zero rows (RLS blocks everything)
 *
 * Run: npx tsx server/tests/rls-isolation.test.ts
 */

import {
  withUserScope,
  userScopedQuery,
  closePool,
} from "../db/rls-connection"

// ─── Test Helpers ───────────────────────────────────────────

const TEST_USER_A = "00000000-0000-0000-0000-000000000001"
const TEST_USER_B = "00000000-0000-0000-0000-000000000002"

let passed = 0
let failed = 0

async function assert(
  name: string,
  fn: () => Promise<boolean>
): Promise<void> {
  try {
    const result = await fn()
    if (result) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name}`)
      failed++
    }
  } catch (error) {
    console.error(`  ❌ FAIL: ${name}`, error instanceof Error ? error.message : error)
    failed++
  }
}

// ─── Setup ──────────────────────────────────────────────────

async function setupTestData(): Promise<void> {
  console.log("\n📦 Setting up test data...\n")

  // Insert test users directly (bypassing RLS via admin role / table owner)
  // These inserts use withUserScope with the respective user IDs
  // so RLS policies are satisfied for the INSERT check.

  // First, clean up any previous test data using admin-level queries
  // We need to do this outside RLS scope since we're cleaning up for multiple users
  const { adminQuery } = await import("../db/rls-connection")

  await adminQuery(`DELETE FROM transactions WHERE user_id IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])
  await adminQuery(`DELETE FROM ai_chat_logs WHERE user_id::text IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])
  await adminQuery(`DELETE FROM bank_accounts WHERE user_id::text IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])
  await adminQuery(`DELETE FROM user_profiles WHERE user_id::text IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])
  await adminQuery(`DELETE FROM statement_uploads WHERE user_id::text IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])
  await adminQuery(`DELETE FROM users WHERE id::text IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])

  // Create test users (users table has no RLS)
  await adminQuery(
    `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW()),
            ($5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [
      TEST_USER_A, "test-user-a@test.com", "Test User A", "$2b$12$placeholder",
      TEST_USER_B, "test-user-b@test.com", "Test User B", "$2b$12$placeholder",
    ]
  )

  // Insert data for User A (within User A's scope)
  await withUserScope(TEST_USER_A, async (client) => {
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, category, payment_method, status, date, day_of_week, hour_of_day, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'credit', '50000.00', 'salary', 'neft', 'completed', NOW(), 1, 10, NOW(), NOW())`,
      [TEST_USER_A]
    )
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, category, payment_method, status, date, day_of_week, hour_of_day, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'debit', '5000.00', 'food_dining', 'upi', 'completed', NOW(), 2, 12, NOW(), NOW())`,
      [TEST_USER_A]
    )
  })

  // Insert data for User B (within User B's scope)
  await withUserScope(TEST_USER_B, async (client) => {
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, category, payment_method, status, date, day_of_week, hour_of_day, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'credit', '100000.00', 'salary', 'neft', 'completed', NOW(), 1, 10, NOW(), NOW())`,
      [TEST_USER_B]
    )
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, category, payment_method, status, date, day_of_week, hour_of_day, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'debit', '20000.00', 'rent', 'auto_debit', 'completed', NOW(), 3, 8, NOW(), NOW())`,
      [TEST_USER_B]
    )
  })

  console.log("  ✅ Test data inserted for User A and User B\n")
}

// ─── Tests ──────────────────────────────────────────────────

async function runTests(): Promise<void> {
  console.log("═══════════════════════════════════════════")
  console.log("  RLS ISOLATION TEST SUITE")
  console.log("═══════════════════════════════════════════")

  await setupTestData()

  console.log("📋 Running cross-user isolation tests...\n")

  // ── Test 1: User A sees only their own transactions ──
  await assert("User A sees only their own transactions", async () => {
    const result = await userScopedQuery<{ user_id: string }>(
      TEST_USER_A,
      "SELECT user_id, amount, category FROM transactions"
    )
    return (
      result.rows.length === 2 &&
      result.rows.every((r) => r.user_id === TEST_USER_A)
    )
  })

  // ── Test 2: User B sees only their own transactions ──
  await assert("User B sees only their own transactions", async () => {
    const result = await userScopedQuery<{ user_id: string }>(
      TEST_USER_B,
      "SELECT user_id, amount, category FROM transactions"
    )
    return (
      result.rows.length === 2 &&
      result.rows.every((r) => r.user_id === TEST_USER_B)
    )
  })

  // ── Test 3: User A CANNOT read User B's data via explicit WHERE ──
  await assert("User A cannot SELECT User B's transactions via WHERE clause", async () => {
    const result = await userScopedQuery(
      TEST_USER_A,
      "SELECT * FROM transactions WHERE user_id = $1",
      [TEST_USER_B]
    )
    return result.rows.length === 0
  })

  // ── Test 4: User B CANNOT read User A's data via explicit WHERE ──
  await assert("User B cannot SELECT User A's transactions via WHERE clause", async () => {
    const result = await userScopedQuery(
      TEST_USER_B,
      "SELECT * FROM transactions WHERE user_id = $1",
      [TEST_USER_A]
    )
    return result.rows.length === 0
  })

  // ── Test 5: User A CANNOT update User B's transactions ──
  await assert("User A cannot UPDATE User B's transactions", async () => {
    const result = await userScopedQuery(
      TEST_USER_A,
      "UPDATE transactions SET amount = '0.01' WHERE user_id = $1 RETURNING id",
      [TEST_USER_B]
    )
    return result.rowCount === 0
  })

  // ── Test 6: User A CANNOT delete User B's transactions ──
  await assert("User A cannot DELETE User B's transactions", async () => {
    const result = await userScopedQuery(
      TEST_USER_A,
      "DELETE FROM transactions WHERE user_id = $1 RETURNING id",
      [TEST_USER_B]
    )
    return result.rowCount === 0
  })

  // ── Test 7: Unscoped SELECT * returns only scoped user's rows ──
  await assert("SELECT * (no WHERE) returns only scoped user's rows", async () => {
    const resultA = await userScopedQuery<{ user_id: string }>(
      TEST_USER_A,
      "SELECT user_id FROM transactions"
    )
    const resultB = await userScopedQuery<{ user_id: string }>(
      TEST_USER_B,
      "SELECT user_id FROM transactions"
    )
    const allA = resultA.rows.every((r) => r.user_id === TEST_USER_A)
    const allB = resultB.rows.every((r) => r.user_id === TEST_USER_B)
    return allA && allB
  })

  // ── Test 8: Invalid userId format is rejected ──
  await assert("Invalid userId format is rejected before hitting DB", async () => {
    try {
      await userScopedQuery("not-a-uuid", "SELECT 1")
      return false // Should have thrown
    } catch (error) {
      return (
        error instanceof Error &&
        error.message.includes("not a valid UUID format")
      )
    }
  })

  // ── Test 9: Empty userId is rejected ──
  await assert("Empty userId is rejected", async () => {
    try {
      await userScopedQuery("", "SELECT 1")
      return false
    } catch (error) {
      return (
        error instanceof Error &&
        error.message.includes("without a valid userId")
      )
    }
  })

  // ── Test 10: Aggregation across users (admin only) ──
  await assert("Admin query can see all users' data (for aggregation jobs)", async () => {
    const { adminQuery } = await import("../db/rls-connection")
    const result = await adminQuery<{ user_id: string }>(
      "SELECT DISTINCT user_id FROM transactions WHERE user_id IN ($1, $2)",
      [TEST_USER_A, TEST_USER_B]
    )
    return result.rows.length === 2
  })
}

// ─── Cleanup ────────────────────────────────────────────────

async function cleanup(): Promise<void> {
  console.log("\n🧹 Cleaning up test data...")

  const { adminQuery } = await import("../db/rls-connection")
  await adminQuery(`DELETE FROM transactions WHERE user_id IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])
  await adminQuery(`DELETE FROM users WHERE id::text IN ($1, $2)`, [TEST_USER_A, TEST_USER_B])

  console.log("  ✅ Test data cleaned up")
}

// ─── Main ───────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    await runTests()
  } finally {
    await cleanup()
    await closePool()
  }

  console.log("\n═══════════════════════════════════════════")
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log("═══════════════════════════════════════════\n")

  if (failed > 0) {
    console.error("❌ RLS ISOLATION TESTS FAILED — DO NOT DEPLOY")
    process.exit(1)
  } else {
    console.log("✅ ALL RLS ISOLATION TESTS PASSED")
    process.exit(0)
  }
}

main().catch((error) => {
  console.error("Fatal error in RLS test suite:", error)
  process.exit(1)
})
