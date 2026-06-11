-- Prod SQL Editor: Ekibim downline görünürlük düzeltmesi (086 ile aynı).
-- Önce teşhis, sonra fix, sonra doğrulama.

-- ── TEŞHİS (postgres rolüyle auth.uid() NULL → downline_ids boş olabilir; normal) ──
-- Suat owner_id ile manuel kontrol:
SELECT w.id, w.name, w.owner_id, right(w.id::text, 4) AS ws_suffix
FROM nmm_workspaces w
WHERE w.parent_id IN (
  SELECT l.id FROM nmm_workspaces l
  JOIN auth.users u ON u.id = l.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
);

-- ── FIX ──
-- Supabase SQL Editor'da supabase/migrations/086_fix_team_rpc_downline_definer.sql
-- dosyasının TAMAMINI kopyalayıp çalıştırın (CREATE OR REPLACE ... $$; dahil).

-- ── DOĞRULAMA (Focus Team workspace id ile değiştirin) ──
-- SELECT jsonb_pretty(
--   public.nmm_fetch_team_with_downlines(
--     (SELECT w.id FROM nmm_workspaces w
--      JOIN auth.users u ON u.id = w.owner_id
--      WHERE u.email = 'suattayfuntopak@gmail.com' LIMIT 1)
--   )->'members'
-- );
-- Beklenen: members içinde Selda, Ezgi, Elif user_id'leri (full_name ile).
