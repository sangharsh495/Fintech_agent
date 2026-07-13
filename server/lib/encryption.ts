/**
 * server/lib/encryption.ts
 *
 * AES-256-GCM encryption module with per-user HKDF key derivation.
 *
 * Architecture:
 * - Master key stored in ENCRYPTION_MASTER_KEY env var (256-bit / 32-byte hex)
 * - Per-user keys derived via HKDF: HKDF(masterKey, userId, "finflow-field-encryption")
 * - Each encrypted value stores: base64(iv + ciphertext + authTag)
 * - GCM provides both confidentiality and integrity (authenticated encryption)
 *
 * Used for:
 * - PAN numbers
 * - Aadhaar (last 4 or full)
 * - Raw account numbers (if stored)
 * - IFSC codes
 * - Any PII beyond name/email that requires recovery
 *
 * NOT used for:
 * - Passwords (use bcrypt instead — one-way hash)
 * - Transaction amounts/descriptions (need plaintext for AI/dashboard)
 * - File hashes / tx hashes (those are integrity hashes, not confidentiality)
 */

import crypto from "crypto"

// ─── Constants ──────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12       // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32      // 256 bits
const HKDF_INFO = "finflow-field-encryption"
const HKDF_HASH = "sha256"

// ─── Master Key ─────────────────────────────────────────────

function getMasterKey(): Buffer {
  const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY
  if (!masterKeyHex) {
    throw new Error(
      "[ENCRYPTION] ENCRYPTION_MASTER_KEY environment variable is not set. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }

  if (masterKeyHex.length !== 64) {
    throw new Error(
      "[ENCRYPTION] ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (256 bits). " +
      `Got ${masterKeyHex.length} characters.`
    )
  }

  return Buffer.from(masterKeyHex, "hex")
}

// ─── Per-User Key Derivation (HKDF) ────────────────────────

/**
 * Derive a per-user encryption key from the master key using HKDF.
 *
 * This ensures:
 * 1. Each user's data is encrypted with a different key
 * 2. Compromising one user's derived key doesn't expose others
 * 3. The master key is never used directly for encryption
 *
 * @param userId - The user's UUID (from verified JWT)
 * @returns 256-bit derived key
 */
function deriveUserKey(userId: string): Buffer {
  const masterKey = getMasterKey()

  // HKDF: extract-then-expand
  // Salt = userId (ensures different keys per user)
  // Info = application context string
  return crypto.hkdfSync(
    HKDF_HASH,
    masterKey,
    userId,        // salt — per-user
    HKDF_INFO,     // info — application context
    KEY_LENGTH
  ) as Buffer
}

// ─── Encrypt ────────────────────────────────────────────────

/**
 * Encrypt a plaintext field value for a specific user.
 *
 * Output format: base64(iv || ciphertext || authTag)
 * - iv: 12 bytes (96 bits)
 * - ciphertext: variable length
 * - authTag: 16 bytes (128 bits)
 *
 * @param userId - User's UUID (for per-user key derivation)
 * @param plaintext - The sensitive value to encrypt
 * @returns Base64-encoded encrypted string, or null if plaintext is empty
 */
export function encryptField(userId: string, plaintext: string | null | undefined): string | null {
  if (!plaintext || plaintext.trim() === "") return null

  const key = deriveUserKey(userId)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Concatenate: iv + ciphertext + authTag
  const combined = Buffer.concat([iv, encrypted, authTag])
  return combined.toString("base64")
}

// ─── Decrypt ────────────────────────────────────────────────

/**
 * Decrypt an encrypted field value for a specific user.
 *
 * @param userId - User's UUID (for per-user key derivation)
 * @param encryptedBase64 - Base64-encoded encrypted string from encryptField()
 * @returns Decrypted plaintext, or null if input is empty
 * @throws If decryption fails (wrong key, tampered data, etc.)
 */
export function decryptField(userId: string, encryptedBase64: string | null | undefined): string | null {
  if (!encryptedBase64 || encryptedBase64.trim() === "") return null

  const key = deriveUserKey(userId)
  const combined = Buffer.from(encryptedBase64, "base64")

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("[ENCRYPTION] Invalid encrypted data: too short")
  }

  // Extract: iv + ciphertext + authTag
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}

// ─── Utility: Check if a value appears to be encrypted ─────

/**
 * Heuristic check: returns true if the value looks like base64-encoded
 * encrypted data (vs plaintext). Useful during migration to avoid
 * double-encrypting already-encrypted values.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false

  // Encrypted values are base64 and at least iv + authTag long
  const minBase64Length = Math.ceil((IV_LENGTH + AUTH_TAG_LENGTH) / 3) * 4
  if (value.length < minBase64Length) return false

  // Check if it's valid base64
  try {
    const decoded = Buffer.from(value, "base64")
    // Re-encode and compare to verify it's valid base64
    return decoded.toString("base64") === value && decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH
  } catch {
    return false
  }
}

// ─── Utility: Rotate encryption (re-encrypt with new key) ──

/**
 * Re-encrypt a value with a new master key (for key rotation).
 * Decrypts with the current key, re-encrypts with a new key.
 *
 * @param userId - User's UUID
 * @param encryptedBase64 - Currently encrypted value
 * @param newMasterKeyHex - New master key (hex string)
 * @returns Re-encrypted value under the new key
 */
export function rotateEncryption(
  userId: string,
  encryptedBase64: string,
  newMasterKeyHex: string
): string {
  // Decrypt with current key
  const plaintext = decryptField(userId, encryptedBase64)
  if (!plaintext) throw new Error("[ENCRYPTION] Cannot rotate: decryption returned null")

  // Temporarily override master key for re-encryption
  const originalKey = process.env.ENCRYPTION_MASTER_KEY
  process.env.ENCRYPTION_MASTER_KEY = newMasterKeyHex
  try {
    const reEncrypted = encryptField(userId, plaintext)
    if (!reEncrypted) throw new Error("[ENCRYPTION] Cannot rotate: re-encryption returned null")
    return reEncrypted
  } finally {
    process.env.ENCRYPTION_MASTER_KEY = originalKey
  }
}

// ─── TLS Verification Helper ────────────────────────────────

/**
 * Verify that the database connection is using TLS.
 * Neon enforces TLS by default, but we verify explicitly.
 */
export function verifyTLSConnection(): boolean {
  const dbUrl = process.env.DATABASE_URL || ""
  // Neon connections always use TLS (sslmode=require is in the connection string)
  const hasTLS =
    dbUrl.includes("sslmode=require") ||
    dbUrl.includes("neon.tech") ||
    dbUrl.includes("ssl=true")

  if (!hasTLS) {
    console.warn(
      "[ENCRYPTION] WARNING: Database connection may not be using TLS. " +
      "Add ?sslmode=require to your DATABASE_URL."
    )
  }

  return hasTLS
}
