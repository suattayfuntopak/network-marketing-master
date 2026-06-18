-- Faz F (Council O-… ölç→karar): 6 "performans/özet" yüzeyinin göreli trafiği.
-- "Tek performans kapısı" konsolidasyon kararının VERİ tabanı — kör kesme yok.
--
-- Çalıştır:  supabase db query -f supabase/scripts/analyze_surface_view_traffic.sql
--            (ya da Supabase SQL editor'de yapıştır). Salt-okunur, yan etkisiz.
--
-- Önkoşul:   surface_view olayı 2026-06-18'de enstrümante edildi (useSurfaceViewBeacon).
--            Anlamlı dağılım için ~2-4 hafta veri birikimi beklenir.
--
-- Yorum:     Düşük pay (pct_of_total) + düşük unique_users → o yüzey ayrı bir kapı
--            yerine bir başkasının sekmesine indirgenebilir (örn. saha-radar düşükse
--            İstatistikler içinde sekme). views_per_user düşükse "girip çıkılan" yüzey.
--            Pano genelde en yüksek olur (ana iniş) — onu kapatma; gerisini kıyasla.

WITH params AS (
  SELECT (now() - interval '28 days') AS since
),
views AS (
  SELECT
    metadata->>'surface' AS surface,
    user_id,
    created_at
  FROM public.nmm_product_events, params
  WHERE event_name = 'surface_view'
    AND created_at >= params.since
    AND metadata->>'surface' IS NOT NULL
)
SELECT
  surface,
  count(*)                                              AS views,
  count(DISTINCT user_id)                               AS unique_users,
  round(count(*)::numeric / NULLIF(count(DISTINCT user_id), 0), 1) AS views_per_user,
  round(100.0 * count(*) / NULLIF(sum(count(*)) OVER (), 0), 1)    AS pct_of_total
FROM views
GROUP BY surface
ORDER BY views DESC;
