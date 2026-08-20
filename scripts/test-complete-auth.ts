import {
  getUserByEmail,
  createUser,
  updateUserUnverified,
  hashPassword,
  verifyPassword,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
} from "../server/services/auth.service"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { eq, sql } from "drizzle-orm"

async function runE2EAuthTest() {
  console.log("🚀 Starting Comprehensive Auth Test Suite...\n")
  const testEmail = `fintech_user_${Date.now()}@gmail.com`
  const testPassword = "StrongPassword123!"
  const testName = "Test Fintech User"

  // 1. Check non-existent user
  console.log("1. Checking non-existent user lookup...")
  const nonExistent = await getUserByEmail(testEmail)
  if (nonExistent) throw new Error("Expected null for non-existent user")
  console.log("✓ Non-existent user correctly returned null.\n")

  // 2. Create unverified user
  console.log("2. Creating fresh user...")
  const hash = await hashPassword(testPassword)
  const createdUser = await createUser(testEmail, hash, testName)
  console.log(`✓ User created with ID: ${createdUser.id}, email: ${createdUser.email}, emailVerified: ${createdUser.emailVerified}\n`)

  // 3. Test case-insensitive lookup
  console.log("3. Testing case-insensitive lookup with UPPERCASE email...")
  const uppercaseLookup = await getUserByEmail(testEmail.toUpperCase())
  if (!uppercaseLookup || uppercaseLookup.id !== createdUser.id) {
    throw new Error("Case-insensitive lookup failed")
  }
  console.log("✓ Found user by uppercase email match.\n")

  // 4. Test re-registration of unverified user
  console.log("4. Testing re-registration update on unverified user...")
  const newHash = await hashPassword("NewPassword456!")
  const updatedUser = await updateUserUnverified(testEmail, newHash, "Updated Name")
  if (!updatedUser || updatedUser.name !== "Updated Name") {
    throw new Error("Update unverified user failed")
  }
  console.log("✓ Unverified user credentials updated successfully without deadlock.\n")

  // 5. Test OTP generation, storage, and verification
  console.log("5. Testing OTP generation, storage, and validation...")
  const otp = generateOTP()
  await storeOTP(testEmail, otp)
  const otpResult = await verifyOTP(testEmail, otp)
  if (!otpResult.success) throw new Error("OTP validation failed for valid OTP")
  console.log("✓ OTP generated and successfully validated.\n")

  // 6. Test OTP single-use protection
  console.log("6. Testing OTP single-use replay protection...")
  const replayResult = await verifyOTP(testEmail, otp)
  if (replayResult.success) throw new Error("OTP replay protection failed")
  console.log("✓ Replay protection verified (used OTP was rejected on second use).\n")

  // 7. Verify user email status
  console.log("7. Testing email verification status...")
  const verifiedUser = await getUserByEmail(testEmail)
  if (!verifiedUser?.emailVerified) throw new Error("Email verification flag not set")
  console.log("✓ User email confirmed as verified in database.\n")

  // 8. Password verification
  console.log("8. Testing password validation...")
  const isMatch = await verifyPassword("NewPassword456!", newHash)
  const isWrong = await verifyPassword("WrongPassword!", newHash)
  if (!isMatch || isWrong) throw new Error("Password verification failed")
  console.log("✓ Password verification succeeded.\n")

  // 9. Clean up test user
  console.log("9. Cleaning up test user...")
  await db.delete(users).where(sql`lower(${users.email}) = ${testEmail.toLowerCase()}`)
  console.log("✓ Test user cleaned up.\n")

  console.log("🎉 ALL 9 AUTHENTICATION TESTS PASSED PERFECTLY!")
}

runE2EAuthTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Auth test error:", err)
    process.exit(1)
  })
