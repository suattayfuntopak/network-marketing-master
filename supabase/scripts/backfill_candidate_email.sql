-- Tek seferlik: nmm_candidates.email boş kayıtları, güvenli kaynaklardan doldurur.
-- Prod'da migration 081_join_email_sync_and_backfill.sql aynı UPDATE'leri uygular.
-- Bu dosya yalnızca manuel dry-run / tekrar çalıştırma referansıdır.
--
-- Kullanım (Supabase SQL Editor veya psql):
--   1) Önce dry-run SELECT'leri çalıştırın, satır sayısını kontrol edin.
--   2) BEGIN; … UPDATE … COMMIT; veya doğrudan UPDATE.
--
-- Kaynak 1: Ekip üyesi ↔ pipeline bağlantısı → auth.users.email
-- Kaynak 2: Aynı workspace'te katıldı + telefon eşleşmesi → üye auth e-postası

-- ── Dry-run: kaynak 1 ───────────────────────────────────────────────────────
SELECT c.id, c.full_name, c.email AS current_email, lower(trim(u.email)) AS proposed_email
FROM nmm_candidates c
JOIN nmm_team_pipeline_links tpl
  ON tpl.candidate_id = c.id AND tpl.workspace_id = c.workspace_id
JOIN auth.users u ON u.id = tpl.member_user_id
WHERE (c.email IS NULL OR trim(c.email) = '')
  AND u.email IS NOT NULL
  AND trim(u.email) <> '';

-- ── Dry-run: kaynak 2 (telefon kuyruğu ≥10 hane) ───────────────────────────
SELECT c.id, c.full_name, c.email AS current_email, lower(trim(u.email)) AS proposed_email
FROM nmm_candidates c
JOIN nmm_workspace_members m ON m.workspace_id = c.workspace_id
JOIN auth.users u ON u.id = m.user_id
WHERE (c.email IS NULL OR trim(c.email) = '')
  AND c.stage = 'katildi'
  AND c.phone IS NOT NULL
  AND length(nmm_phone_tail(c.phone)) >= 10
  AND length(nmm_phone_tail(COALESCE(u.raw_user_meta_data->>'phone', ''))) >= 10
  AND nmm_phone_tail(c.phone) = nmm_phone_tail(u.raw_user_meta_data->>'phone')
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM nmm_candidates c2
    WHERE c2.workspace_id = c.workspace_id
      AND c2.id <> c.id
      AND lower(trim(c2.email)) = lower(trim(u.email))
  );

-- ── Uygula: kaynak 1 ────────────────────────────────────────────────────────
UPDATE nmm_candidates c
SET email = lower(trim(u.email)),
    updated_at = now()
FROM nmm_team_pipeline_links tpl
JOIN auth.users u ON u.id = tpl.member_user_id
WHERE c.id = tpl.candidate_id
  AND c.workspace_id = tpl.workspace_id
  AND (c.email IS NULL OR trim(c.email) = '')
  AND u.email IS NOT NULL
  AND trim(u.email) <> '';

-- ── Uygula: kaynak 2 (yalnızca hâlâ boş olanlar) ───────────────────────────
UPDATE nmm_candidates c
SET email = lower(trim(u.email)),
    updated_at = now()
FROM nmm_workspace_members m
JOIN auth.users u ON u.id = m.user_id
WHERE m.workspace_id = c.workspace_id
  AND (c.email IS NULL OR trim(c.email) = '')
  AND c.stage = 'katildi'
  AND c.phone IS NOT NULL
  AND length(nmm_phone_tail(c.phone)) >= 10
  AND length(nmm_phone_tail(COALESCE(u.raw_user_meta_data->>'phone', ''))) >= 10
  AND nmm_phone_tail(c.phone) = nmm_phone_tail(u.raw_user_meta_data->>'phone')
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM nmm_candidates c2
    WHERE c2.workspace_id = c.workspace_id
      AND c2.id <> c.id
      AND lower(trim(c2.email)) = lower(trim(u.email))
  );
