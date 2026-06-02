-- 047_training_videos.sql
-- Video eğitim kataloğunu koddan (TRAINING_VIDEOS) Supabase'e taşır → super admin
-- ekle/düzenle/sil yapabilsin, kalıcı olsun. nmm_video_progress.video_key bu
-- tablodaki `key` ile eşleşir (mevcut ilerleme korunur).

CREATE TABLE IF NOT EXISTS public.nmm_training_videos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 text UNIQUE NOT NULL,
  youtube_id          text NOT NULL,
  title_tr            text NOT NULL,
  title_en            text NOT NULL DEFAULT '',
  description_tr      text NOT NULL DEFAULT '',
  description_en      text NOT NULL DEFAULT '',
  duration_min        integer NOT NULL DEFAULT 10,
  category_tr         text NOT NULL DEFAULT '',
  category_en         text NOT NULL DEFAULT '',
  related_training_id text,
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nmm_training_videos ENABLE ROW LEVEL SECURITY;

-- Okuma: tüm giriş yapmış kullanıcılar (ekip videoları görebilsin).
DROP POLICY IF EXISTS tv_read ON public.nmm_training_videos;
CREATE POLICY tv_read ON public.nmm_training_videos
  FOR SELECT TO authenticated USING (true);

-- Yazma: yalnız super admin (e-posta bazlı). Sunucu action'ları ayrıca
-- assertSuperAdmin + admin client kullanır (defense-in-depth).
DROP POLICY IF EXISTS tv_write ON public.nmm_training_videos;
CREATE POLICY tv_write ON public.nmm_training_videos
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'suattayfuntopak@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'suattayfuntopak@gmail.com');

-- Mevcut 6 placeholder videoyu seed et (super admin sonradan düzenler/siler/ekler).
INSERT INTO public.nmm_training_videos
  (key, youtube_id, title_tr, title_en, description_tr, description_en, duration_min, category_tr, category_en, related_training_id, sort_order)
VALUES
  ('vid-mindset','qp0HIF3SfL4','Neden ile başla (liderlik zihniyeti)','Start with why (leadership mindset)','Motivasyon ve ikna için “neden” çerçevesi — zihniyet modülüne destek.','The “why” framework for motivation — supports the mindset module.',18,'Zihniyet','Mindset','z1',1),
  ('vid-stress','eIho2S0ZahI','Stresi yönetmek','Make stress your ally','Saha baskısında sakin kalma — iletişim öncesi hazırlık.','Staying calm under field pressure — before outreach.',14,'Zihniyet','Mindset','z3',2),
  ('vid-motivation','Ge7c7otDlgQ','Motivasyonun bilimi','The puzzle of motivation','Ödül-ceza yerine özerklik, ustalık ve amaç — ekip koçluğu.','Autonomy, mastery, purpose — for coaching your team.',10,'Ekip','Team',NULL,3),
  ('vid-communication','8jPQjjsBbIc','İnsanların dinlemek istediği şekilde konuş','How to speak so people listen','Davet ve sunum öncesi ses tonu, tempo ve netlik.','Voice, pace, and clarity before invites and presentations.',10,'İletişim','Communication','i1',4),
  ('vid-teamwork','Ryu75TpC018','Takım çalışması','Teamwork foundations','Güven ve rol netliği — ekip büyütme pratiği.','Trust and role clarity when growing a team.',12,'Ekip','Team',NULL,5),
  ('vid-goals','KpzZZfXkoqk','Hedef koyma ve takip','Setting and tracking goals','90 günlük saha planı ile uyumlu hedef disiplini.','Goal discipline aligned with your 90-day field plan.',11,'Strateji','Strategy','s1',6)
ON CONFLICT (key) DO NOTHING;
