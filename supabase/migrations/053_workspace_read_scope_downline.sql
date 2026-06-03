-- 053_workspace_read_scope_downline.sql
-- 052 DÜZELTMESİ: ekip/istatistik görünümünde downline üyeler kayboldu.
--
-- SEBEP: 052, nmm_workspaces SELECT'ini own+member ile sınırladı. Ama ekip
-- görünümü downline'ı KULLANICI-client ile parent_id üzerinden okuyor:
--   • lib/team/fetchTeamBundle.ts:59  .or('parent_id.eq.<ws>,parent_id.eq.<owner>')
--   • takvim/actions.ts:209           .eq('parent_id', user.id)
--   • ekip/memberGoalsActions.ts:42   .eq('parent_id', leaderId)
-- Bu satırlar (parent_id = ben, owner ≠ ben) own+member kümesine girmediği için
-- daralan politika tarafından gizlendi → Elif gibi gerçek downline üyeler düştü.
--
-- ÇÖZÜM: "görünür workspace" kümesine DOĞRUDAN DOWNLINE'ı ekle. Bu, kullanıcının
-- KENDİ alt ekibidir (parent_id zinciri kendisine bağlı) — yabancı/ilgisiz
-- workspace'ler hâlâ görünmez, yani 052'nin kapattığı sızıntı geri açılmaz.
-- nmm_leader_downline_workspace_ids() zaten DEFINER + auth.uid() ile sınırlı.

CREATE OR REPLACE FUNCTION public.nmm_visible_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  -- kendi workspace'in
  SELECT id FROM nmm_workspaces WHERE owner_id = auth.uid()
  UNION
  -- üyesi olduğun workspace'ler
  SELECT workspace_id FROM nmm_workspace_members WHERE user_id = auth.uid()
  UNION
  -- doğrudan downline (senin sponsor olduğun ekip) — yabancı değil, kendi ekibin
  SELECT d FROM public.nmm_leader_downline_workspace_ids() AS d
$$;

-- Politika değişmiyor (052'deki nmm_workspace_scoped_read aynı fonksiyonu çağırır);
-- yalnız fonksiyon gövdesi güncellendiği için davranış anında düzelir.

-- ─────────────────────────────────────────────────────────────────────────────
-- UYGULAMA SONRASI TEST:
--   • Süper admin → İstatistikler/Ekibim: Elif (downline) yeniden görünmeli.
--   • Yabancı/ilgisiz bir workspace HÂLÂ görünmemeli (sızıntı kapalı kalmalı).
-- ROLLBACK: 052'deki gövdeye geri dön (downline UNION satırını çıkar).
-- ─────────────────────────────────────────────────────────────────────────────
