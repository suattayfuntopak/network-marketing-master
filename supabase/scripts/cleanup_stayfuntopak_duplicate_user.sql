-- =============================================================================
-- NMM: stayfuntopak@gmail.com yanlış/duplicate hesap temizliği
-- =============================================================================
-- Amaç: Şifre sıfırlama sırasında yanlışlıkla oluşan stayfuntopak@gmail.com
-- oturumunu ve tüm veritabanı kırıntılarını kaldırmak.
-- Asıl hesap: suattayfuntopak@gmail.com (Super Admin / Focus Team)
--
-- KULLANIM (Supabase Dashboard → SQL Editor):
--   1) Önce PREVIEW bölümünü çalıştırın — silinecek kayıtları doğrulayın.
--   2) Sonra CLEANUP bölümünü çalıştırın (BEGIN…COMMIT bloğu).
--
-- NOT: auth.users silme işlemi Dashboard SQL Editor'de çalışır.
--      Alternatif: Supabase Dashboard → Authentication → Users → Delete User
-- =============================================================================

-- ─── PREVIEW ────────────────────────────────────────────────────────────────

WITH real_admin AS (
  SELECT id, email, raw_user_meta_data->>'full_name' AS full_name, created_at
  FROM auth.users
  WHERE lower(email) = lower('suattayfuntopak@gmail.com')
  LIMIT 1
),
duplicate_user AS (
  SELECT id, email, raw_user_meta_data->>'full_name' AS full_name, created_at
  FROM auth.users
  WHERE lower(email) = lower('stayfuntopak@gmail.com')
  LIMIT 1
)
SELECT 'real_admin' AS row_type, * FROM real_admin
UNION ALL
SELECT 'duplicate_user' AS row_type, id, email, full_name, created_at FROM duplicate_user;

-- Duplicate kullanıcının sahip olduğu workspace'ler
SELECT w.*
FROM nmm_workspaces w
JOIN auth.users u ON u.id = w.owner_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com');

-- Duplicate kullanıcının üye olduğu workspace'ler (Focus Team vb.)
SELECT wm.*, w.name AS workspace_name
FROM nmm_workspace_members wm
JOIN auth.users u ON u.id = wm.user_id
JOIN nmm_workspaces w ON w.id = wm.workspace_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com');

-- Super admin pipeline'ında duplicate'e ait aday kaydı (varsa)
SELECT c.*
FROM nmm_candidates c
JOIN auth.users admin_u ON admin_u.id = c.owner_id
WHERE lower(admin_u.email) = lower('suattayfuntopak@gmail.com')
  AND (
    c.note ILIKE '%stayfuntopak@gmail.com%'
    OR (
      c.full_name ILIKE '%Suat Tayfun TOPAK%'
      AND c.note ILIKE '%Platform Üyesi%'
    )
  );

-- Diğer kırıntılar (auth.users CASCADE ile de silinir; önizleme için)
SELECT 'nmm_notifications' AS tbl, count(*) AS cnt
FROM nmm_notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com')
UNION ALL
SELECT 'nmm_daily_actions', count(*)
FROM nmm_daily_actions da
JOIN auth.users u ON u.id = da.user_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com')
UNION ALL
SELECT 'nmm_onboarding_progress', count(*)
FROM nmm_onboarding_progress op
JOIN auth.users u ON u.id = op.user_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com')
UNION ALL
SELECT 'nmm_ai_usage_daily', count(*)
FROM nmm_ai_usage_daily aud
JOIN auth.users u ON u.id = aud.user_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com')
UNION ALL
SELECT 'nmm_custom_trainings', count(*)
FROM nmm_custom_trainings ct
JOIN auth.users u ON u.id = ct.user_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com')
UNION ALL
SELECT 'nmm_custom_objections', count(*)
FROM nmm_custom_objections co
JOIN auth.users u ON u.id = co.user_id
WHERE lower(u.email) = lower('stayfuntopak@gmail.com');

-- ─── CLEANUP ────────────────────────────────────────────────────────────────
-- Preview sonuçlarını doğruladıktan sonra aşaıdaki bloğu çalıştırın.

BEGIN;

DO $$
DECLARE
  v_dup_id uuid;
  v_real_id uuid;
BEGIN
  SELECT id INTO v_real_id
  FROM auth.users
  WHERE lower(email) = lower('suattayfuntopak@gmail.com')
  LIMIT 1;

  SELECT id INTO v_dup_id
  FROM auth.users
  WHERE lower(email) = lower('stayfuntopak@gmail.com')
  LIMIT 1;

  IF v_dup_id IS NULL THEN
    RAISE EXCEPTION 'stayfuntopak@gmail.com bulunamadı — işlem iptal.';
  END IF;

  IF v_real_id IS NOT NULL AND v_dup_id = v_real_id THEN
    RAISE EXCEPTION 'Güvenlik: duplicate id asıl admin ile aynı — işlem iptal.';
  END IF;

  -- Super admin pipeline'ındaki yanlış aday kaydı
  IF v_real_id IS NOT NULL THEN
    DELETE FROM nmm_candidates c
    WHERE c.owner_id = v_real_id
      AND (
        c.note ILIKE '%stayfuntopak@gmail.com%'
        OR (
          c.full_name ILIKE '%Suat Tayfun TOPAK%'
          AND c.note ILIKE '%Platform Üyesi%'
          AND c.created_at > now() - interval '30 days'
        )
      );
  END IF;

  -- Başka workspace'lere eklenmiş üyelik satırları (Focus Team vb.)
  DELETE FROM nmm_workspace_members
  WHERE user_id = v_dup_id;

  -- Legacy parent_id (user UUID) referanslarını kaldır
  UPDATE nmm_workspaces
  SET parent_id = NULL
  WHERE parent_id = v_dup_id;

  -- Duplicate workspace'e bağlı downline parent_id referanslarını kaldır
  UPDATE nmm_workspaces
  SET parent_id = NULL
  WHERE parent_id IN (
    SELECT id FROM nmm_workspaces WHERE owner_id = v_dup_id
  );

  -- Duplicate'in sahip olduğu workspace(ler) — CASCADE: candidates, actions, email log…
  DELETE FROM nmm_workspaces
  WHERE owner_id = v_dup_id;

  -- Auth kullanıcısı — CASCADE: notifications, onboarding, ai_usage, custom content…
  DELETE FROM auth.users
  WHERE id = v_dup_id;

  RAISE NOTICE 'Temizlendi: stayfuntopak@gmail.com (%)', v_dup_id;
END $$;

COMMIT;

-- ─── VERIFY ─────────────────────────────────────────────────────────────────

SELECT id, email, created_at
FROM auth.users
WHERE lower(email) IN (lower('stayfuntopak@gmail.com'), lower('suattayfuntopak@gmail.com'))
ORDER BY email;
