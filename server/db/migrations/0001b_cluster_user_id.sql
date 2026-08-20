-- ═══════════════════════════════════════════════════════════════
-- Migration 0001b: add the missing user_id on the clustering tables
-- ═══════════════════════════════════════════════════════════════
-- The Drizzle schema (server/db/schema/transactions.ts) declares userId on
-- both cluster_metadata and cluster_runs, and migration 0002 creates RLS
-- policies that filter on that column. But migration 0000 never created it —
-- the column was added to the schema later and no migration was generated for
-- it, so the SQL chain drifted from the schema.
--
-- Replaying the migrations from scratch therefore failed at 0002 with
--   ERROR: column "user_id" does not exist
-- which is how the RLS audit workflow surfaced this. Any database built from
-- these files had NO row-level security on the clustering tables, because the
-- four policies for each table were never created.
--
-- This file is named to sort between 0001 and 0002 so the column exists before
-- the policies that reference it. It is idempotent, so an existing database
-- created with `drizzle-kit push` (which does include the column) is unaffected.
--
-- Type must be varchar(128), matching transactions.user_id — the policies
-- compare it to current_setting('app.current_user_id') without a cast.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE cluster_metadata ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);
ALTER TABLE cluster_runs ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);

-- Existing rows predate per-user clustering and cannot be attributed to a
-- user. They are deleted rather than left NULL: under the policies added in
-- 0002 a NULL user_id is invisible to every user anyway, so keeping them would
-- only leave unreachable rows behind. Clustering regenerates them per user.
DELETE FROM cluster_metadata WHERE user_id IS NULL;
DELETE FROM cluster_runs WHERE user_id IS NULL;

ALTER TABLE cluster_metadata ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cluster_runs ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cluster_metadata_user ON cluster_metadata (user_id);
CREATE INDEX IF NOT EXISTS idx_cluster_runs_user ON cluster_runs (user_id);
