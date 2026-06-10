-- 078: Hub prefetch günlük rollup (cron + super admin trend)

CREATE TABLE IF NOT EXISTS public.nmm_hub_prefetch_daily (
  workspace_id uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  day date NOT NULL,
  event_count int NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  sum_hub_self_queries int NOT NULL DEFAULT 0 CHECK (sum_hub_self_queries >= 0),
  sum_total_tasks int NOT NULL DEFAULT 0 CHECK (sum_total_tasks >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, day)
);

CREATE INDEX IF NOT EXISTS idx_hub_prefetch_daily_day
  ON public.nmm_hub_prefetch_daily (day DESC);

ALTER TABLE public.nmm_hub_prefetch_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role all hub prefetch daily" ON public.nmm_hub_prefetch_daily;
CREATE POLICY "service role all hub prefetch daily" ON public.nmm_hub_prefetch_daily
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.nmm_rollup_hub_prefetch_daily(
  p_day date DEFAULT ((now() AT TIME ZONE 'utc')::date - 1)
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  INSERT INTO public.nmm_hub_prefetch_daily (
    workspace_id,
    day,
    event_count,
    sum_hub_self_queries,
    sum_total_tasks,
    updated_at
  )
  SELECT
    workspace_id,
    p_day,
    count(*)::int,
    coalesce(sum(hub_self_queries), 0)::int,
    coalesce(sum(total_tasks), 0)::int,
    now()
  FROM public.nmm_hub_prefetch_events
  WHERE (created_at AT TIME ZONE 'utc')::date = p_day
  GROUP BY workspace_id
  ON CONFLICT (workspace_id, day) DO UPDATE SET
    event_count = EXCLUDED.event_count,
    sum_hub_self_queries = EXCLUDED.sum_hub_self_queries,
    sum_total_tasks = EXCLUDED.sum_total_tasks,
    updated_at = now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

COMMENT ON FUNCTION public.nmm_rollup_hub_prefetch_daily IS
  'Önceki günün hub prefetch eventlerini workspace bazında günlük tabloya toplar.';
