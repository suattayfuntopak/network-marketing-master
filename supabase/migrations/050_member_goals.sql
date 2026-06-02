-- 050: Sponsor → downline organizasyon hedefi (kişi sayısı + süre)

CREATE TABLE IF NOT EXISTS public.nmm_member_goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  member_user_id  uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  set_by_user_id  uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_people   int NOT NULL CHECK (target_people > 0 AND target_people <= 10000),
  target_months   int NOT NULL CHECK (target_months > 0 AND target_months <= 120),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_member_goals_ws_member
  ON public.nmm_member_goals (workspace_id, member_user_id);

ALTER TABLE public.nmm_member_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmm_member_goals_read" ON public.nmm_member_goals;
CREATE POLICY "nmm_member_goals_read" ON public.nmm_member_goals
  FOR SELECT
  TO authenticated
  USING (
    member_user_id = auth.uid()
    OR member_user_id IN (
      SELECT w.owner_id
      FROM public.nmm_workspaces w
      WHERE w.parent_id = auth.uid()
        AND w.owner_id IS NOT NULL
    )
    OR workspace_id IN (
      SELECT wm.workspace_id
      FROM public.nmm_workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "nmm_member_goals_leader_write" ON public.nmm_member_goals;
CREATE POLICY "nmm_member_goals_leader_write" ON public.nmm_member_goals
  FOR ALL
  TO authenticated
  USING (
    set_by_user_id = auth.uid()
    AND member_user_id IN (
      SELECT w.owner_id
      FROM public.nmm_workspaces w
      WHERE w.parent_id = auth.uid()
        AND w.owner_id IS NOT NULL
    )
  )
  WITH CHECK (
    set_by_user_id = auth.uid()
    AND member_user_id IN (
      SELECT w.owner_id
      FROM public.nmm_workspaces w
      WHERE w.parent_id = auth.uid()
        AND w.owner_id IS NOT NULL
    )
  );

COMMENT ON TABLE public.nmm_member_goals IS
  'Leader-set organization goal for a direct downline member (target headcount + months).';
