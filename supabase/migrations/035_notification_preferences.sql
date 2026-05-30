-- Migration 035: Bildirim tercihleri — kalıcı tablo (çok cihaz senkronu)

CREATE TABLE IF NOT EXISTS nmm_notification_preferences (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled  boolean NOT NULL DEFAULT true,
  push_enabled   boolean NOT NULL DEFAULT true,
  sound_enabled  boolean NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nmm_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nmm_notification_preferences_owner_all"
  ON nmm_notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
