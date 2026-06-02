-- 049_user_settings.sql
-- Kullanıcıya özel kalıcı UI/uygulama ayarları (Supabase = tek doğruluk kaynağı).
--
-- NEDEN: Bazı kullanıcı durumları (onboarding tamamlandı mı, Uyum Merkezi
-- checklist'i) yalnızca global localStorage'da tutuluyordu. Bu hem cihazlar
-- arası taşınmıyordu (premium söze aykırı) hem de aynı tarayıcıda kullanıcı
-- değişince ÖNCEKİ kullanıcının durumu yenisine sızıyordu. Artık her kullanıcı
-- için tek satır, RLS ile yalnız sahibine açık, kalıcı.
--
-- settings jsonb şekli (genişletilebilir):
--   { "onboardingDone": bool, "complianceChecklist": { "<id>": bool, ... } }

CREATE TABLE IF NOT EXISTS public.nmm_user_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  settings   jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nmm_user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own settings" ON public.nmm_user_settings;
CREATE POLICY "own settings" ON public.nmm_user_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
