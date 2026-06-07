-- 059_daily_field_log_pipeline_adds.sql
-- Günlük Takip: boru hattına eklenen yeni aday sayısı (tanışmadan ayrı).

ALTER TABLE public.nmm_daily_field_log
  ADD COLUMN IF NOT EXISTS pipeline_adds int NOT NULL DEFAULT 0
  CHECK (pipeline_adds BETWEEN 0 AND 9999);
