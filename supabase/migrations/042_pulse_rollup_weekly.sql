-- 042: Ekip Nabzı F4 — günlük rollup + haftalık AI özet

CREATE TABLE IF NOT EXISTS public.nmm_team_pulse_daily (
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  day           date NOT NULL,
  metrics       jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_team_pulse_daily_ws_day
  ON public.nmm_team_pulse_daily (workspace_id, day DESC);

ALTER TABLE public.nmm_team_pulse_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmm_team_pulse_daily_own" ON public.nmm_team_pulse_daily;
CREATE POLICY "nmm_team_pulse_daily_own" ON public.nmm_team_pulse_daily
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nmm_team_pulse_daily_sponsor_read" ON public.nmm_team_pulse_daily;
CREATE POLICY "nmm_team_pulse_daily_sponsor_read" ON public.nmm_team_pulse_daily
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

CREATE TABLE IF NOT EXISTS public.nmm_pulse_weekly_summaries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  scope         text NOT NULL CHECK (scope IN ('personal', 'team')),
  week_start    date NOT NULL,
  summary_tr    text NOT NULL,
  summary_en    text NOT NULL,
  bullets_tr    jsonb NOT NULL DEFAULT '[]'::jsonb,
  bullets_en    jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_flags    jsonb NOT NULL DEFAULT '[]'::jsonb,
  model         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id, scope, week_start)
);

CREATE INDEX IF NOT EXISTS idx_pulse_weekly_user_week
  ON public.nmm_pulse_weekly_summaries (user_id, week_start DESC);

ALTER TABLE public.nmm_pulse_weekly_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmm_pulse_weekly_own_read" ON public.nmm_pulse_weekly_summaries;
CREATE POLICY "nmm_pulse_weekly_own_read" ON public.nmm_pulse_weekly_summaries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.nmm_team_pulse_daily IS 'Daily aggregated pulse metrics per user (F4 rollup cron).';
COMMENT ON TABLE public.nmm_pulse_weekly_summaries IS 'AI-generated weekly pulse coaching summary (F4).';
