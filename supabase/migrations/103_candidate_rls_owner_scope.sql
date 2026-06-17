-- Migration 100: Candidate RLS — owner-scoped CRUD (workspace-wide member access kaldırılır).
-- Downline lider SELECT: migration 010 "nmm_candidate_read_downlines" korunur.
-- Idempotent: policy zaten yoksa DROP no-op; yeniden CREATE güvenli değil — önce DROP.

DROP POLICY IF EXISTS "nmm_candidate_owner_all" ON nmm_candidates;
DROP POLICY IF EXISTS "nmm_candidate_owner_select" ON nmm_candidates;
DROP POLICY IF EXISTS "nmm_candidate_owner_insert" ON nmm_candidates;
DROP POLICY IF EXISTS "nmm_candidate_owner_update" ON nmm_candidates;
DROP POLICY IF EXISTS "nmm_candidate_owner_delete" ON nmm_candidates;

CREATE POLICY "nmm_candidate_owner_select" ON nmm_candidates
  FOR SELECT
  USING (
    owner_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM nmm_workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "nmm_candidate_owner_insert" ON nmm_candidates
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM nmm_workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "nmm_candidate_owner_update" ON nmm_candidates
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "nmm_candidate_owner_delete" ON nmm_candidates
  FOR DELETE
  USING (owner_id = auth.uid());
