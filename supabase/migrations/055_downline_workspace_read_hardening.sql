-- 055_downline_workspace_read_hardening.sql
-- GÜVENLİK (codex [P1] hardening): 053, downline workspace'lerini nmm_visible_workspace_ids()'e
-- ekleyerek nmm_workspace_scoped_read SELECT politikasının downline'ın TÜM SATIRINI
-- (invite_code, license_type, license_expires_at dahil) lidere açmasına yol açtı. Uygulama bu
-- kolonları okumuyor (yalnız id/owner_id), ama POLİTİKA izin veriyordu → bir lider doğrudan bir
-- PostgREST sorgusuyla kendi downline'ının davet kodunu okuyabilirdi. Cross-tenant DEĞİL (yalnız
-- kendi sponsor ağacı) ama gereksiz aşırı-erişim; davet kodu sızıntısı izinsiz katılıma kapı açar.
--
-- ÇÖZÜM:
--   1) nmm_visible_workspace_ids()'i own + member'a daralt (downline UNION'ı çıkar) → workspace
--      SELECT'i tekrar yalnız "kendi + üyesi olunan" satırlara döner (052'nin durumu).
--   2) Downline KEŞFİNİ kolon-kısıtlı yeni bir SECURITY DEFINER fonksiyonuyla ver:
--      nmm_leader_downline_workspaces() → SADECE id + owner_id (davet kodu/lisans YOK).
--   3) (uygulama tarafı) downline okuyan 6 yardımcı sorgu .rpc(bu fonksiyon)'a taşındı.
--
-- members/candidates RLS politikaları nmm_leader_downline_workspace_ids()'i DOĞRUDAN kullanır
-- (nmm_visible_workspace_ids üzerinden DEĞİL) → onlar ETKİLENMEZ; ekip/aday/aktivite görünürlüğü korunur.

-- 1) Görünür workspace kümesi = own + member (downline ÇIKARILDI → davet kodu sızıntısı kapanır)
CREATE OR REPLACE FUNCTION public.nmm_visible_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM nmm_workspaces WHERE owner_id = auth.uid()
  UNION
  SELECT workspace_id FROM nmm_workspace_members WHERE user_id = auth.uid()
$$;

-- 2) Downline keşfi — yalnız id + owner_id döndürür (davet kodu/lisans ASLA). auth.uid()'in
--    kendi alt ekibiyle sınırlı; nmm_leader_downline_workspace_ids() ile birebir aynı tanım.
CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspaces()
RETURNS TABLE(id uuid, owner_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT w.id, w.owner_id
  FROM nmm_workspaces w
  WHERE w.parent_id = auth.uid()
     OR w.parent_id IN (
       SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
     );
$$;

GRANT EXECUTE ON FUNCTION public.nmm_leader_downline_workspaces() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- UYGULAMA SONRASI TEST (prod RLS değişikliği — şu akışları doğrula):
--   1. Süper admin → İstatistikler/Ekibim: downline (Elif) HÂLÂ görünür (rpc keşfi).
--   2. Takvim: downline takip kayıtları görünür. Hedef kartı: ekip sayısı doğru.
--   3. Üye hedefi (memberGoals) düzenleme: downline üye için çalışır, yabancıya reddeder.
--   4. KRİTİK: bir lider, downline'ının nmm_workspaces satırını DOĞRUDAN sorgulayınca
--      invite_code/license ARTIK GÖRÜNMEMELİ (yalnız own + member satırları döner).
--   5. Yabancı/ilgisiz workspace HÂLÂ görünmez (052 sızıntısı kapalı kalır).
--
-- ROLLBACK: 053'teki gövdeye dön (nmm_visible_workspace_ids'e downline UNION geri ekle) +
--   DROP FUNCTION public.nmm_leader_downline_workspaces(); ve 6 rpc çağrısını .or(parent_id)'e geri al.
-- ─────────────────────────────────────────────────────────────────────────────
