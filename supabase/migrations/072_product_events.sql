-- 072: Ürün hunisi / A-B ölçümü (landing popüler rozet, upgrade CTA, ödeme deep link)

CREATE TABLE IF NOT EXISTS public.nmm_product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  session_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_name_created
  ON public.nmm_product_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_user_created
  ON public.nmm_product_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.nmm_product_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated insert product events" ON public.nmm_product_events;
CREATE POLICY "authenticated insert product events" ON public.nmm_product_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "service role all product events" ON public.nmm_product_events;
CREATE POLICY "service role all product events" ON public.nmm_product_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.nmm_product_events IS
  'Hafif ürün analitiği: landing fiyat görünümü, upgrade CTA, /odeme?plan=basic deep link.';
