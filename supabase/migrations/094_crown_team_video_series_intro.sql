-- 094_crown_team_video_series_intro.sql
-- Crown Team "Network Marketing Eğitim Serisi"nin ilk 3 videosunu (olmazsa
-- olmazlar) kataloğa ekler — sıra 1-3, 093'teki 4-9'un önüne geçer.
-- src/lib/domain/trainingVideos.ts (TRAINING_VIDEOS) ile senkron tutulur.

INSERT INTO public.nmm_training_videos
  (key, youtube_id, title_tr, title_en, description_tr, description_en, duration_min, category_tr, category_en, related_training_id, sort_order)
VALUES
  ('vid-hayaller','B89ZUj_7f98','1 · Hayaller ve Hedefler','1 · Dreams and Goals','Network marketing''in olmazsa olmazları serisinin ilki. Hayallerini ve hedeflerini netleştir; nereye gittiğini bil.','The first of the network marketing essentials series. Clarify your dreams and goals; know where you are going.',22,'Hedefler','Vision & Goals',NULL,1),
  ('vid-odaklanma','dw8BLLRKtGY','2 · Odaklanma ve Taahhüt','2 · Focus and Commitment','Olmazsa olmazlar serisinin 2. videosu: odaklanma ve taahhüt. Dağılmadan, söz verdiğin işe bağlı kalmak.','Episode 2 of the essentials series: focus and commitment. Staying committed to what you promised without scattering.',18,'Odak','Focus',NULL,2),
  ('vid-kisisel-gelisim','z-Wxl5eMQzI','3 · Kişisel Gelişim: Siz büyüyün, ekibiniz büyüsün','3 · Personal Growth: You grow, your team grows','İşini büyüt: Network Marketing''de kişisel gelişimin gücü. Siz büyüyün, ekibiniz büyüsün. Carol Dweck, Jim Rohn, Eric Worre ve bilimsel araştırmalar.','Grow your business: the power of personal development in network marketing. You grow, your team grows. Carol Dweck, Jim Rohn, Eric Worre and research.',21,'Kişisel Gelişim','Self-growth',NULL,3)
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
