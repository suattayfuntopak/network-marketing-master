-- 044: Ekip Nabzı UI kaldırıldı — kullanılmayan rollup/weekly tablolarını ve realtime aboneliğini temizle.
--
-- KORUNANLAR (Ekip Performans İzleme Tablosu'nun Eğitim/İtiraz/Video % sütunları + sponsor görünürlüğü bunları kullanır):
--   • nmm_user_progress        (eğitim/itiraz okuma yüzdeleri)        + 039 sponsor-read RLS
--   • nmm_video_progress       (video % )                            + 041 sponsor-read RLS
--   • nmm_learning_events      (hâlâ yazılıyor: okuma/favori/randevu) + 040 RLS
--
-- KALDIRILANLAR: rollup + haftalık YZ özeti tabloları (yalnız cron'lar yazıyordu; cron'lar bu commit'te silindi)
--   ve realtime publication abonelikleri (PulseRealtimeSync kaldırıldı).

-- 1) Cron'a bağlı, artık okunmayan tablolar
DROP TABLE IF EXISTS public.nmm_pulse_weekly_summaries CASCADE;
DROP TABLE IF EXISTS public.nmm_team_pulse_daily CASCADE;

-- 2) Realtime publication abonelikleri (043 ile eklenmişti) — güvenli/idempotent kaldırma
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.nmm_user_progress;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.nmm_learning_events;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.nmm_video_progress;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- nmm_pulse_weekly_summaries DROP TABLE ile zaten publication'dan düştü.
