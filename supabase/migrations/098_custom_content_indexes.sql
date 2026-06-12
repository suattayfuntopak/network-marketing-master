-- 098: Custom Content RLS Performance Indexes
-- Create composite indexes on nmm_custom_trainings and nmm_custom_objections for is_approved and user_id where is_deleted = false.

CREATE INDEX IF NOT EXISTS idx_custom_trainings_perf 
  ON public.nmm_custom_trainings (is_approved, user_id) 
  WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_custom_objections_perf 
  ON public.nmm_custom_objections (is_approved, user_id) 
  WHERE (is_deleted = false);
