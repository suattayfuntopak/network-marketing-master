-- 093_crown_team_video_series.sql
-- Video kataloğunu Crown Team / Dr. Tuna AKGÜN "Network Marketing Eğitim Serisi"
-- ile günceller. 047'deki 6 placeholder (generic İngilizce) video gerçek seri
-- videolarıyla değiştirilir. nmm_video_progress.video_key text olduğundan FK
-- yoktur; eski placeholder anahtarlara ait ilerleme (varsa) katalogda artık
-- eşleşmez ve özetlerde yok sayılır.
--
-- src/lib/domain/trainingVideos.ts (TRAINING_VIDEOS) bu liste ile aynı tutulur.

-- 1) Eski placeholder videoları kaldır (yalnız bilinen seed anahtarları).
DELETE FROM public.nmm_training_videos
WHERE key IN (
  'vid-mindset', 'vid-stress', 'vid-motivation',
  'vid-communication', 'vid-teamwork', 'vid-goals'
);

-- 2) Gerçek seri videolarını ekle (idempotent: tekrar çalışırsa günceller).
INSERT INTO public.nmm_training_videos
  (key, youtube_id, title_tr, title_en, description_tr, description_en, duration_min, category_tr, category_en, related_training_id, sort_order)
VALUES
  ('vid-liste','NyYdhTCFKTo','4 · Liste Çalışması','4 · List Building','Başarıya giden yolun ilk adımı: doğru ve kapsamlı liste oluşturma. Bilimsel veriler ve pratik tekniklerle. Mutlaka ilk 3 videoyu izleyin.','The first step to success: building a correct, comprehensive prospect list — with scientific data and practical techniques. Watch the first 3 videos first.',20,'Liste','List Building',NULL,4),
  ('vid-davet','ydAPkpY9330','5 · Davet Sanatı','5 · The Art of Inviting','Network Marketing''te davet nasıl yapılır? Davet nedir, siz hangi kategoridesiniz? Eric Worre, psikoloji bilimi ve güncel örneklerle profesyonel davet.','How to invite in network marketing. What is an invitation, which category are you in? Professional inviting with Eric Worre, psychology and current examples.',25,'Davet','Inviting',NULL,5),
  ('vid-sunum','KzO2gLQ1IQU','6 · Sunum Nasıl Yapılır?','6 · How to Present','Sunum nasıl yapılır? Ev toplantısı, 1''e 1, 2''ye 1, Zoom ya da otel toplantılarında nelere dikkat etmeliyiz?','How to deliver a presentation. What to watch for in home meetings, one-on-ones, two-on-ones, Zoom or hotel meetings.',22,'Sunum','Presentation',NULL,6),
  ('vid-takip','RDV_jfi3oiA','7 · Takip Sistemi','7 · Follow-up System','Baskı olmadan, bunaltmadan takip. Sunum sonrası yapılması (ve yapılmaması) gerekenler; hangi soruları sormalı, nasıl yaklaşmalıyız?','Follow-up without pressure. What to do (and not do) after a presentation; which questions to ask and how to approach.',18,'Takip','Follow-up',NULL,7),
  ('vid-itiraz','WzTjwfJhIZk','8 · İtiraz Yönetimi','8 · Objection Handling','Gelen itirazları nasıl yöneteceğiz? 20+ itiraz, yanlış ve doğru yanıt, bilimsel teknikler — Network Marketing''te ikna ve güven sistemi.','How to manage objections. 20+ objections, wrong vs right answers, scientific techniques — persuasion and trust in network marketing.',22,'İtiraz','Objections',NULL,8),
  ('vid-sponsorluk','O3N-xLFMqIg','9 · Sponsorluk ve Kopyalama','9 · Sponsoring & Duplication','Sponsorluk ve kopyalama: ekibini büyütürken çoğalan, kopyalanabilir bir sistem kurmak.','Sponsoring and duplication: building a duplicable system as you grow your team.',16,'Sponsorluk','Sponsoring',NULL,9)
ON CONFLICT (key) DO UPDATE SET
  youtube_id          = EXCLUDED.youtube_id,
  title_tr            = EXCLUDED.title_tr,
  title_en            = EXCLUDED.title_en,
  description_tr      = EXCLUDED.description_tr,
  description_en      = EXCLUDED.description_en,
  duration_min        = EXCLUDED.duration_min,
  category_tr         = EXCLUDED.category_tr,
  category_en         = EXCLUDED.category_en,
  related_training_id = EXCLUDED.related_training_id,
  sort_order          = EXCLUDED.sort_order,
  updated_at          = now();
