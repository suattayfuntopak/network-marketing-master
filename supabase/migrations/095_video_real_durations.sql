-- 095_video_real_durations.sql
-- 093/094'te süreler tahminîydi. YouTube'dan çekilen GERÇEK süreler (dakika,
-- yuvarlanmış) ile düzeltir. UI artık "~N dk" etiketini ve pano toplam dakikayı
-- doğru gösterir. src/lib/domain/trainingVideos.ts ile senkron.

UPDATE public.nmm_training_videos AS v SET
  duration_min = d.minutes,
  updated_at = now()
FROM (VALUES
  ('vid-hayaller', 26),
  ('vid-odaklanma', 14),
  ('vid-kisisel-gelisim', 21),
  ('vid-liste', 23),
  ('vid-davet', 24),
  ('vid-sunum', 21),
  ('vid-takip', 28),
  ('vid-itiraz', 38),
  ('vid-sponsorluk', 33)
) AS d(key, minutes)
WHERE v.key = d.key;
