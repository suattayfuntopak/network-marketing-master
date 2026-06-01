-- 045: nmm_learning_events tablosunu kaldır.
--
-- Ekip Nabzı olay-logu artık hiçbir ekranda gösterilmiyor ve uygulama kodundaki yazma
-- çağrıları (recordProgressChange milestone, logEngagementEvent, presentation log) bu commit'te
-- söküldü. Tablo realtime publication'dan 044 ile zaten çıkarılmıştı.
--
-- CASCADE: tabloya bağlı RLS politikaları (040) ve index'ler birlikte düşer.
-- KORUNANLAR: nmm_user_progress, nmm_video_progress, nmm_onboarding_progress (hâlâ kullanılıyor).

DROP TABLE IF EXISTS public.nmm_learning_events CASCADE;
