-- Backfill 7-day trial expiry for existing free workspaces created without license_expires_at.
-- Aligns DB with ensureWorkspaceAction (trial credits = Basic / leader limits).

UPDATE nmm_workspaces
SET license_expires_at = (created_at + interval '7 days')
WHERE license_type = 'free'
  AND license_expires_at IS NULL
  AND created_at > (now() - interval '7 days');
