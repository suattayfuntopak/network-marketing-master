-- 054_user_goals.sql
-- Kullanıcının KENDİ uzun vadeli hedefi (kişi sayısı + süre). Crown'dan esinlenen
-- "Hedef → Yol Haritası → Günlük Takip" döngüsünün tek kalıcı verisi. Yol haritası
-- ve günlük gerçekleşenler DEPOLANMAZ — hedeften + mevcut veriden türetilir.
--
-- ŞİRKETE ÖZEL DEĞİL: yalnız kişi-sayısı + ay. PV/bonus/rütbe/gelir YOK.
-- nmm_member_goals (050, lider→downline atanan) bundan AYRIDIR.

CREATE TABLE IF NOT EXISTS public.nmm_user_goals (
  user_id        uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id   uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  target_people  int NOT NULL CHECK (target_people > 0 AND target_people <= 100000),
  target_months  int NOT NULL CHECK (target_months > 0 AND target_months <= 120),
  start_at       timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nmm_user_goals ENABLE ROW LEVEL SECURITY;

-- Kendi hedefini tam yönet (oku/yaz/sil).
DROP POLICY IF EXISTS "nmm_user_goals_self_all" ON public.nmm_user_goals;
CREATE POLICY "nmm_user_goals_self_all" ON public.nmm_user_goals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Lider, downline'ının (kendi ekibinin) hedefini OKUYABİLİR (koçluk). Yazamaz.
-- nmm_visible_workspace_ids() (052/053) own+member+downline'ı kapsar; iki
-- parent_id formatını da DEFINER fonksiyonla doğru hesaplar.
DROP POLICY IF EXISTS "nmm_user_goals_leader_read" ON public.nmm_user_goals;
CREATE POLICY "nmm_user_goals_leader_read" ON public.nmm_user_goals
  FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.nmm_visible_workspace_ids()));

COMMENT ON TABLE public.nmm_user_goals IS
  'Self-set long-term goal (headcount + months). Company-agnostic; roadmap + daily targets are derived, not stored.';
