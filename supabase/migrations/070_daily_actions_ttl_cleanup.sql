-- TTL cleanup for nmm_daily_actions: keep 90 days of AI usage history.
-- Runs as a Postgres cron job (pg_cron extension must be enabled).
-- Idempotent: safe to apply multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'nmm_daily_actions_ttl_cleanup'
  ) THEN
    PERFORM cron.schedule(
      'nmm_daily_actions_ttl_cleanup',
      '30 3 * * *',
      'DELETE FROM nmm_daily_actions WHERE created_at < NOW() - INTERVAL ''90 days'';'
    );
  END IF;
END;
$$;
