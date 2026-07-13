-- ═══════════════════════════════════════════════════════════════
-- Migration 0005: Aggregation tables + RLS + Goals
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Create monthly_summaries ────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  category VARCHAR(64) NOT NULL,
  type VARCHAR(10) NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  tx_count INTEGER NOT NULL DEFAULT 0,
  avg_amount DECIMAL(14,2) DEFAULT 0,
  min_amount DECIMAL(14,2),
  max_amount DECIMAL(14,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month, category, type)
);

-- ─── 2. Create tax_summaries ────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fy VARCHAR(10) NOT NULL,
  section VARCHAR(32) NOT NULL,
  category VARCHAR(64) NOT NULL,
  type VARCHAR(10) NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  tx_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fy, section, category, type)
);

-- ─── 3. Create net_worth_snapshots ──────────────────────────
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  bank_balances TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, snapshot_date)
);

-- ─── 4. Create goals ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  target_amount DECIMAL(14,2),
  current_amount DECIMAL(14,2) DEFAULT 0,
  deadline DATE,
  category VARCHAR(64),
  priority VARCHAR(16) DEFAULT 'medium',
  status VARCHAR(16) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── 5. Enable RLS on all new tables ────────────────────────
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries FORCE ROW LEVEL SECURITY;

ALTER TABLE tax_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_summaries FORCE ROW LEVEL SECURITY;

ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots FORCE ROW LEVEL SECURITY;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals FORCE ROW LEVEL SECURITY;

-- ─── 6. RLS Policies ────────────────────────────────────────

-- monthly_summaries
CREATE POLICY monthly_summaries_select ON monthly_summaries FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY monthly_summaries_insert ON monthly_summaries FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY monthly_summaries_update ON monthly_summaries FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY monthly_summaries_delete ON monthly_summaries FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- tax_summaries
CREATE POLICY tax_summaries_select ON tax_summaries FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY tax_summaries_insert ON tax_summaries FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY tax_summaries_update ON tax_summaries FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY tax_summaries_delete ON tax_summaries FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- net_worth_snapshots
CREATE POLICY net_worth_snapshots_select ON net_worth_snapshots FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY net_worth_snapshots_insert ON net_worth_snapshots FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY net_worth_snapshots_update ON net_worth_snapshots FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY net_worth_snapshots_delete ON net_worth_snapshots FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- goals
CREATE POLICY goals_select ON goals FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY goals_insert ON goals FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY goals_update ON goals FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY goals_delete ON goals FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ─── 7. Grant permissions to finflow_app role ───────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_summaries TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_summaries TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON net_worth_snapshots TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO finflow_app;

-- ─── 8. Indexes for performance ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_month ON monthly_summaries (user_id, month);
CREATE INDEX IF NOT EXISTS idx_tax_summaries_user_fy ON tax_summaries (user_id, fy);
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_date ON net_worth_snapshots (user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals (user_id, status);
