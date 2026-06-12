-- 097: Custom Content Soft Delete
-- Add is_deleted column to both nmm_custom_trainings and nmm_custom_objections tables.
-- Recreate SELECT RLS policies to filter out soft-deleted records.

ALTER TABLE public.nmm_custom_trainings ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.nmm_custom_objections ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Recreate SELECT policy for trainings
DROP POLICY IF EXISTS "select custom trainings" ON public.nmm_custom_trainings;
CREATE POLICY "select custom trainings" ON public.nmm_custom_trainings
  FOR SELECT USING ((is_approved = true OR user_id = auth.uid()) AND is_deleted = false);

-- Recreate SELECT policy for objections
DROP POLICY IF EXISTS "select custom objections" ON public.nmm_custom_objections;
CREATE POLICY "select custom objections" ON public.nmm_custom_objections
  FOR SELECT USING ((is_approved = true OR user_id = auth.uid()) AND is_deleted = false);
