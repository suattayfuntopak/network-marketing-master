-- 037: Custom Content Moderation (E-9 & I-4)
-- Allows normal users to submit content/objection requests which require Super Admin approval.
-- Once approved (is_approved = true), the custom content becomes global (visible to everyone).
-- Super Admin additions bypass the queue and are approved immediately.

ALTER TABLE public.nmm_custom_trainings ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.nmm_custom_trainings ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.nmm_custom_trainings ADD COLUMN IF NOT EXISTS user_name text;

ALTER TABLE public.nmm_custom_objections ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.nmm_custom_objections ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.nmm_custom_objections ADD COLUMN IF NOT EXISTS user_name text;

-- Re-create RLS Policies to allow global reading for approved content
DROP POLICY IF EXISTS "own custom trainings" ON public.nmm_custom_trainings;
DROP POLICY IF EXISTS "select custom trainings" ON public.nmm_custom_trainings;
DROP POLICY IF EXISTS "insert own custom trainings" ON public.nmm_custom_trainings;
DROP POLICY IF EXISTS "update own or admin custom trainings" ON public.nmm_custom_trainings;
DROP POLICY IF EXISTS "delete own or admin custom trainings" ON public.nmm_custom_trainings;

CREATE POLICY "select custom trainings" ON public.nmm_custom_trainings
  FOR SELECT USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "insert own custom trainings" ON public.nmm_custom_trainings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own or admin custom trainings" ON public.nmm_custom_trainings
  FOR UPDATE USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'suattayfuntopak@gmail.com');

CREATE POLICY "delete own or admin custom trainings" ON public.nmm_custom_trainings
  FOR DELETE USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'suattayfuntopak@gmail.com');


DROP POLICY IF EXISTS "own custom objections" ON public.nmm_custom_objections;
DROP POLICY IF EXISTS "select custom objections" ON public.nmm_custom_objections;
DROP POLICY IF EXISTS "insert own custom objections" ON public.nmm_custom_objections;
DROP POLICY IF EXISTS "update own or admin custom objections" ON public.nmm_custom_objections;
DROP POLICY IF EXISTS "delete own or admin custom objections" ON public.nmm_custom_objections;

CREATE POLICY "select custom objections" ON public.nmm_custom_objections
  FOR SELECT USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "insert own custom objections" ON public.nmm_custom_objections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own or admin custom objections" ON public.nmm_custom_objections
  FOR UPDATE USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'suattayfuntopak@gmail.com');

CREATE POLICY "delete own or admin custom objections" ON public.nmm_custom_objections
  FOR DELETE USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'suattayfuntopak@gmail.com');
