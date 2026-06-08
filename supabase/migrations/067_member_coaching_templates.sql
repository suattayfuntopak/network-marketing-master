-- Migration 067: Per-member coaching templates
-- Adds coaching_templates JSONB to nmm_workspace_members so each
-- team member can have customised coaching message templates.

ALTER TABLE nmm_workspace_members
  ADD COLUMN IF NOT EXISTS coaching_templates JSONB;
