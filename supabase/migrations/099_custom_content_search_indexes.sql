-- 099: Custom Content Search and Query Optimization Indexes
-- Optimize custom trainings and objections query and dynamic search.

-- 1. Index for loading custom trainings: where is_deleted = false AND (is_approved = true OR user_id = auth.uid()) ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_custom_trainings_approved_created
  ON public.nmm_custom_trainings (is_approved, created_at DESC)
  WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_custom_trainings_user_created
  ON public.nmm_custom_trainings (user_id, created_at DESC)
  WHERE (is_deleted = false);

-- 2. Index for loading custom objections: where is_deleted = false AND (is_approved = true OR user_id = auth.uid()) ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_custom_objections_approved_created
  ON public.nmm_custom_objections (is_approved, created_at DESC)
  WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_custom_objections_user_created
  ON public.nmm_custom_objections (user_id, created_at DESC)
  WHERE (is_deleted = false);

-- 3. GIN indexes on the jsonb 'data' column for dynamic text matching on keys like baslik, soru, ozet, tags, etc.
CREATE INDEX IF NOT EXISTS idx_custom_trainings_data_gin
  ON public.nmm_custom_trainings USING gin (data);

CREATE INDEX IF NOT EXISTS idx_custom_objections_data_gin
  ON public.nmm_custom_objections USING gin (data);
