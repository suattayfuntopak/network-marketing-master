-- Migration 008: Add 'ai_generate' to nmm_daily_actions.action_type check constraint.
-- Drops the old constraint if it exists and creates a new one including 'ai_generate'.

ALTER TABLE nmm_daily_actions DROP CONSTRAINT IF EXISTS nmm_daily_actions_action_type_check;

ALTER TABLE nmm_daily_actions ADD CONSTRAINT nmm_daily_actions_action_type_check
  CHECK (action_type IN ('call', 'whatsapp', 'note', 'stage_change', 'ai_generate'));
