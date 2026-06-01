-- 039: Ekip Nabzı F1 — sponsor reads direct downline learning progress (SELECT only)

DROP POLICY IF EXISTS "nmm_progress_read_downlines" ON public.nmm_user_progress;
CREATE POLICY "nmm_progress_read_downlines" ON public.nmm_user_progress
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT w.owner_id
      FROM public.nmm_workspaces w
      WHERE w.parent_id = auth.uid()
        AND w.owner_id IS NOT NULL
    )
  );

COMMENT ON POLICY "nmm_progress_read_downlines" ON public.nmm_user_progress IS
  'Direct sponsor may read downline training/objection progress summaries (Ekip Nabzı).';
