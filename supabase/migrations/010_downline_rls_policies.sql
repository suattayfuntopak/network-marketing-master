-- Migration 010: Add RLS policies to support leader visibility of direct downlines.
-- Leaders need to read (SELECT) the member details, candidate counts, and daily actions of their direct downline partners
-- in order to show their stats and metrics in the "Ekibim" (My Team) page.

-- 1. nmm_workspace_members: Allow sponsors/leaders to view membership rows of their direct downlines
CREATE POLICY "nmm_member_read_downlines" ON nmm_workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM nmm_workspaces WHERE parent_id = auth.uid()
    )
  );

-- 2. nmm_candidates: Allow sponsors/leaders to view candidates of their direct downlines (for counting stats)
CREATE POLICY "nmm_candidate_read_downlines" ON nmm_candidates
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM nmm_workspaces WHERE parent_id = auth.uid()
    )
  );

-- 3. nmm_daily_actions: Allow sponsors/leaders to view daily actions of their direct downlines (for checking last activity)
CREATE POLICY "nmm_action_read_downlines" ON nmm_daily_actions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM nmm_workspaces WHERE parent_id = auth.uid()
    )
  );
