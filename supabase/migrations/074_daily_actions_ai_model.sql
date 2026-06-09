-- 074: AI model izleme (Flash vs Pro maliyet / süper admin paneli)

ALTER TABLE public.nmm_daily_actions
  ADD COLUMN IF NOT EXISTS ai_model text;

COMMENT ON COLUMN public.nmm_daily_actions.ai_model IS
  'Gemini model id (örn. gemini-2.5-flash) — hibrit routing maliyet takibi.';

CREATE INDEX IF NOT EXISTS idx_daily_actions_ai_model_created
  ON public.nmm_daily_actions (ai_model, created_at DESC)
  WHERE action_type = 'ai_generate' AND ai_model IS NOT NULL;
