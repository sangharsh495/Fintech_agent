-- ═══════════════════════════════════════════════════════════════
-- Migration 0004: Encryption columns for PII fields
-- ═══════════════════════════════════════════════════════════════
-- Widens PAN and Aadhaar columns to hold AES-256-GCM ciphertext
-- (base64-encoded, ~3x larger than plaintext).
-- Adds encrypted account number column to bank_accounts.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Widen PAN column for encrypted values ──────────────
-- Plaintext PAN: 10 chars → Encrypted base64: ~80 chars
ALTER TABLE user_profiles
  ALTER COLUMN pan_number TYPE VARCHAR(255);

-- ─── 2. Widen Aadhaar column for encrypted values ──────────
-- Plaintext last4: 4 chars → Encrypted base64: ~80 chars
ALTER TABLE user_profiles
  ALTER COLUMN aadhaar_last4 TYPE VARCHAR(255);

-- ─── 3. Add encrypted account number to bank_accounts ──────
-- Stores AES-256-GCM encrypted full account number (optional)
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS account_number_encrypted VARCHAR(512);

-- ─── 4. Add encrypted IFSC to bank_accounts ────────────────
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS ifsc_encrypted VARCHAR(255);

-- ─── NOTE ───────────────────────────────────────────────────
-- After running this migration, existing plaintext PAN/Aadhaar
-- values in user_profiles need to be encrypted in-place via an
-- application-level migration script (see server/scripts/encrypt-existing-pii.ts).
-- SQL cannot perform HKDF + AES-256-GCM encryption.
