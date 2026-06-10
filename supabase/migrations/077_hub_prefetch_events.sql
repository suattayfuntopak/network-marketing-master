-- 077: Hub prefetch telemetrisi (super admin aggregate)

CREATE TABLE IF NOT EXISTS public.nmm_hub_prefetch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  active_tab text NOT NULL,
  hub_self_queries smallint NOT NULL,
  total_tasks smallint NOT NULL,
  source text NOT NULL CHECK (source IN ('ssr', 'hover', 'client')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_prefetch_events_created
  ON public.nmm_hub_prefetch_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hub_prefetch_events_workspace_created
  ON public.nmm_hub_prefetch_events (workspace_id, created_at DESC);

ALTER TABLE public.nmm_hub_prefetch_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users insert own hub prefetch events" ON public.nmm_hub_prefetch_events;
CREATE POLICY "users insert own hub prefetch events" ON public.nmm_hub_prefetch_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "service role all hub prefetch events" ON public.nmm_hub_prefetch_events;
CREATE POLICY "service role all hub prefetch events" ON public.nmm_hub_prefetch_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.nmm_hub_prefetch_events IS
  'Saha Özetim hub prefetch maliyet telemetrisi — super admin Platform Yönetimi aggregate.';
