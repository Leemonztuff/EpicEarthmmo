-- Migration 001: Create initial tables for EpicEarthmmo (RO Clone)
-- Run this in your Supabase project's SQL Editor.

-- ============================================================
-- Helper: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Table: characters
-- One character per authenticated Supabase user.
-- user_id references auth.users, name must be unique.
-- ============================================================
DROP TABLE IF EXISTS characters CASCADE;
CREATE TABLE characters (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT UNIQUE NOT NULL,
  state      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_characters_updated_at ON characters;
CREATE TRIGGER trg_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Table: chat_messages
-- Optional: persists in-game chat history between sessions.
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender     TEXT NOT NULL,
  text       TEXT NOT NULL,
  is_system  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Characters: each user can only manage their own character.
DROP POLICY IF EXISTS characters_select_own ON characters;
CREATE POLICY characters_select_own ON characters
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS characters_insert_own ON characters;
CREATE POLICY characters_insert_own ON characters
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS characters_update_own ON characters;
CREATE POLICY characters_update_own ON characters
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS characters_delete_own ON characters;
CREATE POLICY characters_delete_own ON characters
  FOR DELETE
  USING (user_id = auth.uid());

-- Chat messages: allow anyone to read and insert messages.
DROP POLICY IF EXISTS chat_messages_select ON chat_messages;
CREATE POLICY chat_messages_select ON chat_messages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
CREATE POLICY chat_messages_insert ON chat_messages
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Done
-- ============================================================
