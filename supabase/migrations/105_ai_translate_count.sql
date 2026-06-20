-- 105: nmm_ai_usage_daily.translate_count — çeviri maliyet takibi (kotadan AYRI).
--
-- Çeviriler (CLAUDE.md Dil Politikası: TR|||EN kalıcı saklama) kullanıcı kotasını
-- TÜKETMEZ ama Gemini maliyeti yaratır. Ayrı sayaç tut: `ai_count`'a DOKUNMA →
-- kota kapısı (action_type='ai_generate') ve fiyatlama analitiği etkilenmez.
-- Aktivite tablosuna (nmm_daily_actions) hiç yazılmaz → akış/streak kirlenmez.
-- p_kind='translate' yalnız translate_count'u artırır.

ALTER TABLE public.nmm_ai_usage_daily
  ADD COLUMN IF NOT EXISTS translate_count int NOT NULL DEFAULT 0 CHECK (translate_count >= 0);

CREATE OR REPLACE FUNCTION public.nmm_increment_ai_usage_daily(
  p_user_id uuid,
  p_workspace_id uuid,
  p_usage_date date,
  p_kind text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_usage_date IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.nmm_ai_usage_daily (
    user_id,
    workspace_id,
    usage_date,
    ai_count,
    message_count,
    roleplay_count,
    compliance_count,
    translate_count
  )
  VALUES (
    p_user_id,
    p_workspace_id,
    p_usage_date,
    CASE WHEN p_kind IN ('ai', 'message', 'roleplay', 'compliance') THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'message' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'roleplay' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'compliance' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'translate' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE SET
    workspace_id = COALESCE(EXCLUDED.workspace_id, nmm_ai_usage_daily.workspace_id),
    ai_count = nmm_ai_usage_daily.ai_count + CASE
      WHEN p_kind IN ('ai', 'message', 'roleplay', 'compliance') THEN 1
      ELSE 0
    END,
    message_count = nmm_ai_usage_daily.message_count + CASE WHEN p_kind = 'message' THEN 1 ELSE 0 END,
    roleplay_count = nmm_ai_usage_daily.roleplay_count + CASE WHEN p_kind = 'roleplay' THEN 1 ELSE 0 END,
    compliance_count = nmm_ai_usage_daily.compliance_count + CASE WHEN p_kind = 'compliance' THEN 1 ELSE 0 END,
    translate_count = nmm_ai_usage_daily.translate_count + CASE WHEN p_kind = 'translate' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;
