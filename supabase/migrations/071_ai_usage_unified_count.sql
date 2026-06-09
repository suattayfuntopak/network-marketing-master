-- 071: Unified ai_count for daily YZ rollup (single pool analytics)

ALTER TABLE public.nmm_ai_usage_daily
  ADD COLUMN IF NOT EXISTS ai_count int NOT NULL DEFAULT 0 CHECK (ai_count >= 0);

UPDATE public.nmm_ai_usage_daily
SET ai_count = message_count + roleplay_count + compliance_count
WHERE ai_count = 0
  AND (message_count + roleplay_count + compliance_count) > 0;

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
    compliance_count
  )
  VALUES (
    p_user_id,
    p_workspace_id,
    p_usage_date,
    CASE WHEN p_kind IN ('ai', 'message', 'roleplay', 'compliance') THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'message' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'roleplay' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'compliance' THEN 1 ELSE 0 END
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
    updated_at = now();
END;
$$;
