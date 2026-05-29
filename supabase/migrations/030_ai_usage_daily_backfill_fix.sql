-- 030: 029 backfill düzeltmesi (MAX(uuid) geçersizdi)
-- 029 DDL zaten uygulandıysa yalnızca bu dosyayı çalıştırın; ON CONFLICT ile güvenli tekrar.

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
