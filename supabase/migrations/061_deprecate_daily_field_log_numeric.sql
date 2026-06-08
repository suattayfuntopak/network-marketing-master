-- 061_deprecate_daily_field_log_numeric.sql
-- Huni metrikleri artık yalnızca boru hattından (nmm_daily_actions + nmm_candidates).
-- Günlük notlar nmm_day_journal üzerinden; sayı kolonları kullanılmıyor.

COMMENT ON TABLE public.nmm_daily_field_log IS
  'DEPRECATED (2026-06): Numeric funnel columns unused. Use nmm_day_journal for daily notes and pipeline actions for funnel metrics.';

COMMENT ON COLUMN public.nmm_daily_field_log.calls IS
  'DEPRECATED — do not write. Funnel call counts come from nmm_daily_actions (action_type=call).';

COMMENT ON COLUMN public.nmm_daily_field_log.contacts IS
  'DEPRECATED — do not write. New prospect counts come from nmm_candidates.created_at.';

COMMENT ON COLUMN public.nmm_daily_field_log.presentations IS
  'DEPRECATED — do not write. Presentation counts come from pipeline stage_change actions.';

COMMENT ON COLUMN public.nmm_daily_field_log.new_members IS
  'DEPRECATED — do not write. Join counts come from pipeline stage_change to katildi.';
