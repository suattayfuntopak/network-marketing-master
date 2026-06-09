-- Video ekleme talepleri — super admin dışındaki kullanıcılar onay masasına düşer.

ALTER TABLE public.nmm_training_videos
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.nmm_workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_name text;

UPDATE public.nmm_training_videos SET is_approved = true WHERE is_approved IS DISTINCT FROM true;

DROP POLICY IF EXISTS tv_read ON public.nmm_training_videos;
CREATE POLICY tv_read ON public.nmm_training_videos
  FOR SELECT TO authenticated
  USING (
    is_approved = true
    OR user_id = auth.uid()
    OR (auth.jwt() ->> 'email') = 'suattayfuntopak@gmail.com'
  );

DROP POLICY IF EXISTS tv_write ON public.nmm_training_videos;
CREATE POLICY tv_write ON public.nmm_training_videos
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'suattayfuntopak@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'suattayfuntopak@gmail.com');
