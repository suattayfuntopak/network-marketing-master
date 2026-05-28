-- 022: Council Faz E — Y-12 + O-4
-- Y-12: persist custom trainings/objections in DB (was localStorage only -> lost
--       across browsers, breaking the "premium" promise).
-- O-4:  dedicated nmm_user_progress table (stop abusing nmm_daily_actions as
--       progress storage, which polluted action analytics).

-- ─────────────────────────────────────────────────────────────
-- Y-12: custom content tables
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmm_custom_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.nmm_workspaces (id) ON DELETE SET NULL,
  item_key text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

CREATE TABLE IF NOT EXISTS public.nmm_custom_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.nmm_workspaces (id) ON DELETE SET NULL,
  item_key text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_custom_trainings_user ON public.nmm_custom_trainings (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_objections_user ON public.nmm_custom_objections (user_id);

ALTER TABLE public.nmm_custom_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nmm_custom_objections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own custom trainings" ON public.nmm_custom_trainings;
CREATE POLICY "own custom trainings" ON public.nmm_custom_trainings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own custom objections" ON public.nmm_custom_objections;
CREATE POLICY "own custom objections" ON public.nmm_custom_objections
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- O-4: user progress (read/favorite trainings & objections)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmm_user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.nmm_workspaces (id) ON DELETE SET NULL,
  read_trainings jsonb NOT NULL DEFAULT '[]'::jsonb,
  fav_trainings jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  fav_objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nmm_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own progress" ON public.nmm_user_progress;
CREATE POLICY "own progress" ON public.nmm_user_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
