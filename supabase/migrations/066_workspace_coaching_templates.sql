-- 066: workspace-level coaching templates (active/recent/silent)
-- Stored as JSONB { active: string, recent: string, silent: string }

ALTER TABLE nmm_workspaces
  ADD COLUMN IF NOT EXISTS coaching_templates JSONB;
