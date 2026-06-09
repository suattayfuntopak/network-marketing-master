-- 073: Landing (anon) ziyaretçilerinin ürün olayı kaydı

DROP POLICY IF EXISTS "anon insert product events" ON public.nmm_product_events;
CREATE POLICY "anon insert product events" ON public.nmm_product_events
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
