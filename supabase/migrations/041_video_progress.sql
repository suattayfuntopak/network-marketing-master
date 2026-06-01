-- 041: Ekip Nabzı F3 — video izleme ilerlemesi (YouTube embed, manuel/API'siz)

CREATE TABLE IF NOT EXISTS public.nmm_video_progress (
  user_id        uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  video_key      text NOT NULL,
  workspace_id   uuid REFERENCES public.nmm_workspaces (id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed')),
  position_sec   integer NOT NULL DEFAULT 0,
  duration_sec   integer,
  watch_percent  smallint NOT NULL DEFAULT 0
    CHECK (watch_percent >= 0 AND watch_percent <= 100),
  started_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_key)
);

CREATE INDEX IF NOT EXISTS idx_video_progress_ws_user
  ON public.nmm_video_progress (workspace_id, user_id);

ALTER TABLE public.nmm_video_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmm_video_progress_own_all" ON public.nmm_video_progress;
CREATE POLICY "nmm_video_progress_own_all" ON public.nmm_video_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nmm_video_progress_sponsor_read" ON public.nmm_video_progress;
CREATE POLICY "nmm_video_progress_sponsor_read" ON public.nmm_video_progress
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

COMMENT ON TABLE public.nmm_video_progress IS
  'Per-user video watch state (F3). video_key from app catalog; no creator YouTube API required.';
