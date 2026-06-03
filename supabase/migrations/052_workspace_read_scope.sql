-- 052_workspace_read_scope.sql
-- GÜVENLİK (HIGH): nmm_workspaces SELECT politikasını daralt.
--
-- SORUN: 003'teki "nmm_workspace_authenticated_read" politikası
--   USING (auth.uid() IS NOT NULL)
-- her oturum açmış kullanıcının TÜM workspace'leri (isim, sahip, lisans tipi ve
-- DAVET KODU) okumasına izin veriyordu. Sonuç: (a) tüm müşteri + lisans listesi
-- sızıyor, (b) çalınan davet koduyla nmm_join_workspace çağrılıp davetsiz katılım
-- mümkün.
--
-- ÇÖZÜM: SELECT'i yalnız "kendi + üyesi olunan" workspace'lerle sınırla.
--   • Davet araması zaten nmm_join_workspace (SECURITY DEFINER) ile yapılıyor →
--     katılım akışı BOZULMAZ (RLS'i baypas eder).
--   • Downline görünürlüğü members/candidates politikalarındaki
--     nmm_leader_downline_workspace_ids()'e bağlı → o fonksiyon daralan politikadan
--     etkilenmemesi için SECURITY DEFINER'a çekilir (auth.uid() ile zaten güvenli).
--   • İstemci/kullanıcı-client tüm nmm_workspaces okumaları own/member (denetlendi:
--     takvim, pulse, sunum-materyalleri, learningEvents, teamActivity hepsi
--     .eq('id', workspaceId) + owner/membership kontrolü). Süper admin platform/
--     istatistik okumaları admin (service-role) client → RLS baypas, etkilenmez.

-- 1) Downline fonksiyonunu DEFINER yap: workspace SELECT daralınca da downline
--    id'lerini doğru hesaplayabilsin (yalnız auth.uid()'in alt ekibini döndürür).
CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT w.id
  FROM nmm_workspaces w
  WHERE w.parent_id = auth.uid()
     OR w.parent_id IN (
       SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
     );
$$;

-- 2) "Görünür workspace" kümesi: kendi + üyesi olunan. DEFINER → RLS recursion yok
--    (005'teki members<->workspaces özyineleme tuzağına düşmez).
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

-- 3) Geniş okuma politikasını daralt.
DROP POLICY IF EXISTS "nmm_workspace_authenticated_read" ON nmm_workspaces;
CREATE POLICY "nmm_workspace_scoped_read" ON nmm_workspaces
  FOR SELECT
  USING (id IN (SELECT public.nmm_visible_workspace_ids()));

-- ─────────────────────────────────────────────────────────────────────────────
-- UYGULAMA SONRASI TEST (prod RLS değişikliği — şu akışları doğrula):
--   1. Giriş → pano açılıyor, kendi davet kodun görünüyor (own read OK).
--   2. İstatistikler/Ekip: downline üyeleri + aktiviteleri görünüyor (downline OK).
--   3. Yeni bir hesapla davet koduyla "Ekibe Katıl" çalışıyor (join RPC OK).
--   4. Süper admin Platform Yönetimi tüm kullanıcıları görüyor (admin client OK).
--
-- ROLLBACK (bir şey bozulursa tek adımda geri al):
--   DROP POLICY IF EXISTS "nmm_workspace_scoped_read" ON nmm_workspaces;
--   CREATE POLICY "nmm_workspace_authenticated_read" ON nmm_workspaces
--     FOR SELECT USING (auth.uid() IS NOT NULL);
-- ─────────────────────────────────────────────────────────────────────────────
