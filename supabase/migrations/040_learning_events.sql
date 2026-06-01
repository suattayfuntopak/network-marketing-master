-- 040: Ekip Nabzı F2 — zaman damgalı olay logu (öğrenme + saha engagement)

CREATE TABLE IF NOT EXISTS public.nmm_learning_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type   text NOT NULL CHECK (event_type IN (
    'training_read', 'training_fav', 'training_unfav',
    'objection_read', 'objection_fav', 'objection_unfav',
    'presentation_sent', 'appointment_set', 'appointment_done',
    'training_library_complete', 'objection_library_complete'
  )),
  item_key     text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_events_ws_user_created
  ON public.nmm_learning_events (workspace_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_events_ws_type_created
  ON public.nmm_learning_events (workspace_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_events_user_type_created
  ON public.nmm_learning_events (user_id, event_type, created_at DESC);

ALTER TABLE public.nmm_learning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nmm_learning_events_own_all" ON public.nmm_learning_events;
CREATE POLICY "nmm_learning_events_own_all" ON public.nmm_learning_events
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nmm_learning_events_sponsor_read" ON public.nmm_learning_events;
CREATE POLICY "nmm_learning_events_sponsor_read" ON public.nmm_learning_events
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

COMMENT ON TABLE public.nmm_learning_events IS
  'Append-only pulse/learning engagement log (F2). item_key = training id or objection id string.';
