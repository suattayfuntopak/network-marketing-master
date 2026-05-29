-- 030: YZ günlük kullanım arşivi — tam kurulum (idempotent, tekrar çalıştırılabilir)
--
-- Ne zaman: 029 backfill hatası sonrası tablo hiç oluşmadıysa VEYA sadece backfill gerekiyorsa.
-- Supabase SQL editöründe bu dosyanın TAMAMINI çalıştırın.

CREATE TABLE IF NOT EXISTS public.nmm_ai_usage_daily (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.nmm_workspaces (id) ON DELETE SET NULL,
  usage_date date NOT NULL,
  message_count int NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  roleplay_count int NOT NULL DEFAULT 0 CHECK (roleplay_count >= 0),
  compliance_count int NOT NULL DEFAULT 0 CHECK (compliance_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_date
  ON public.nmm_ai_usage_daily (usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_workspace_date
  ON public.nmm_ai_usage_daily (workspace_id, usage_date DESC);

ALTER TABLE public.nmm_ai_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own ai usage daily" ON public.nmm_ai_usage_daily;
CREATE POLICY "users read own ai usage daily" ON public.nmm_ai_usage_daily
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users upsert own ai usage daily" ON public.nmm_ai_usage_daily;
CREATE POLICY "users upsert own ai usage daily" ON public.nmm_ai_usage_daily
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own ai usage daily" ON public.nmm_ai_usage_daily;
CREATE POLICY "users update own ai usage daily" ON public.nmm_ai_usage_daily
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

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
    message_count,
    roleplay_count,
    compliance_count
  )
  VALUES (
    p_user_id,
    p_workspace_id,
    p_usage_date,
    CASE WHEN p_kind = 'message' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'roleplay' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'compliance' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE SET
    workspace_id = COALESCE(EXCLUDED.workspace_id, nmm_ai_usage_daily.workspace_id),
    message_count = nmm_ai_usage_daily.message_count + CASE WHEN p_kind = 'message' THEN 1 ELSE 0 END,
    roleplay_count = nmm_ai_usage_daily.roleplay_count + CASE WHEN p_kind = 'roleplay' THEN 1 ELSE 0 END,
    compliance_count = nmm_ai_usage_daily.compliance_count + CASE WHEN p_kind = 'compliance' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_increment_ai_usage_daily(uuid, uuid, date, text) TO authenticated;

-- Geçmiş nmm_daily_actions verisinden backfill
INSERT INTO public.nmm_ai_usage_daily (user_id, workspace_id, usage_date, message_count, roleplay_count, compliance_count)
SELECT
  da.user_id,
  (array_agg(da.workspace_id ORDER BY da.created_at DESC) FILTER (WHERE da.workspace_id IS NOT NULL))[1] AS workspace_id,
  (da.created_at AT TIME ZONE 'UTC')::date AS usage_date,
  COUNT(*) FILTER (WHERE da.note IS DISTINCT FROM 'roleplay' AND da.note IS DISTINCT FROM 'compliance')::int,
  COUNT(*) FILTER (WHERE da.note = 'roleplay')::int,
  COUNT(*) FILTER (WHERE da.note = 'compliance')::int
FROM public.nmm_daily_actions da
WHERE da.action_type = 'ai_generate'
GROUP BY da.user_id, (da.created_at AT TIME ZONE 'UTC')::date
ON CONFLICT (user_id, usage_date) DO UPDATE SET
  message_count = EXCLUDED.message_count,
  roleplay_count = EXCLUDED.roleplay_count,
  compliance_count = EXCLUDED.compliance_count,
  workspace_id = COALESCE(EXCLUDED.workspace_id, nmm_ai_usage_daily.workspace_id),
  updated_at = now();
