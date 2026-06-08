-- Migration 068: Overdue e-mail digest frequency preference
-- daily (default) = send every day the cron fires
-- weekly         = send only on Mondays

ALTER TABLE nmm_notification_preferences
  ADD COLUMN IF NOT EXISTS overdue_email_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (overdue_email_frequency IN ('daily', 'weekly'));
