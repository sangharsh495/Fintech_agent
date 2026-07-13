-- ═══════════════════════════════════════════════════════════════
-- Migration 0006: AI Audit Log + Chat Sessions + Chat Messages
-- Phase 5 (audit log) + Phase 6 (chat history) tables
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Create chat_role enum ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_role') THEN
    CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system');
  END IF;
END
$$;

-- ─── 2. Create ai_audit_log ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  context_hash VARCHAR(64) NOT NULL,
  input_token_count INTEGER DEFAULT 0,
  output_token_count INTEGER DEFAULT 0,
  output_summary VARCHAR(255),
  model_used VARCHAR(128) NOT NULL,
  model_provider VARCHAR(32) NOT NULL,
  latency_ms INTEGER,
  page_context VARCHAR(64),
  is_error BOOLEAN DEFAULT false,
  error_type VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── 3. Create chat_sessions ────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Chat',
  page_context VARCHAR(64),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── 4. Create chat_messages ────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── 5. Enable RLS on all new tables ────────────────────────

ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log FORCE ROW LEVEL SECURITY;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;

-- ─── 6. RLS Policies ────────────────────────────────────────

-- ai_audit_log
CREATE POLICY ai_audit_log_select ON ai_audit_log FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_audit_log_insert ON ai_audit_log FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_audit_log_update ON ai_audit_log FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY ai_audit_log_delete ON ai_audit_log FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- chat_sessions
CREATE POLICY chat_sessions_select ON chat_sessions FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY chat_sessions_insert ON chat_sessions FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY chat_sessions_update ON chat_sessions FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY chat_sessions_delete ON chat_sessions FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- chat_messages
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY chat_messages_update ON chat_messages FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
CREATE POLICY chat_messages_delete ON chat_messages FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- ─── 7. Grant permissions to finflow_app role ───────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_audit_log TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_sessions TO finflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO finflow_app;

-- ─── 8. Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_user ON ai_audit_log (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_session ON ai_audit_log (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id, created_at);
