-- 106: Lider training progress reset desteği
-- Yeni kolonlar expand-only — eski kod yeni kolonları görmez, sorun olmaz.

ALTER TABLE nmm_user_progress
  ADD COLUMN IF NOT EXISTS training_reset_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS training_reset_by TEXT DEFAULT NULL;

-- İdempotent: ikinci çalışmada IF NOT EXISTS sessizce geçer.
