-- ============================================================
-- NMM: Human-readable invite code + workspace RLS fix
-- ============================================================

-- 1. Add invite_code column (8-char alphanumeric, uppercase)
ALTER TABLE nmm_workspaces
  ADD COLUMN IF NOT EXISTS invite_code text;

-- Generate codes for existing workspaces (md5 hex → uppercase 8 chars)
UPDATE nmm_workspaces
  SET invite_code = upper(substr(md5(id::text), 1, 8))
  WHERE invite_code IS NULL;

ALTER TABLE nmm_workspaces
  ALTER COLUMN invite_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS nmm_workspaces_invite_code_idx
  ON nmm_workspaces(invite_code);

-- 2. Fix workspace RLS so any authenticated user can look up a workspace by invite_code
--    (required for the join flow: user B looks up user A's workspace)
DROP POLICY IF EXISTS "nmm_workspace_owner_all" ON nmm_workspaces;

-- Authenticated users may read any workspace (needed for invite lookup)
CREATE POLICY "nmm_workspace_authenticated_read" ON nmm_workspaces
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only the owner can insert / update / delete their workspace
CREATE POLICY "nmm_workspace_owner_insert" ON nmm_workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "nmm_workspace_owner_update" ON nmm_workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "nmm_workspace_owner_delete" ON nmm_workspaces
  FOR DELETE USING (owner_id = auth.uid());
