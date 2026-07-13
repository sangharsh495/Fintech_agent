-- ═══════════════════════════════════════════════════════════════
-- Migration 0003: Hashing indexes and file_hash column
-- ═══════════════════════════════════════════════════════════════
-- 1. Add file_hash column to statement_uploads for duplicate file detection
-- 2. Add UNIQUE constraint on (user_id, hash) for transaction dedup
-- 3. Add UNIQUE constraint on (user_id, file_hash) for file dedup
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Add file_hash to statement_uploads ──────────────────
ALTER TABLE statement_uploads
  ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- Unique index: same user cannot upload the same file twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_statement_uploads_user_file_hash
  ON statement_uploads (user_id, file_hash)
  WHERE file_hash IS NOT NULL;

-- ─── 2. Unique constraint on transaction dedup hash ─────────
-- The `hash` column already exists on transactions.
-- Add a unique index on (user_id, hash) to enforce dedup at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_hash
  ON transactions (user_id, hash)
  WHERE hash IS NOT NULL;

-- ─── 3. Enable RLS on any new tables created by future migrations ──
-- (The aggregation tables from Phase 4 will get their own RLS policies)
