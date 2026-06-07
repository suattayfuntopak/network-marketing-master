-- 058_daily_field_log.sql
-- Günlük Takip: kullanıcının elle girdiği 4 saha metriği (Crown Günlük Takip).

CREATE TABLE IF NOT EXISTS public.nmm_daily_field_log (
  user_id        uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  log_date       date NOT NULL,
  calls          int  NOT NULL DEFAULT 0 CHECK (calls BETWEEN 0 AND 9999),
  contacts       int  NOT NULL DEFAULT 0 CHECK (contacts BETWEEN 0 AND 9999),
  presentations  int  NOT NULL DEFAULT 0 CHECK (presentations BETWEEN 0 AND 9999),
  new_members    int  NOT NULL DEFAULT 0 CHECK (new_members BETWEEN 0 AND 9999),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS nmm_daily_field_log_user_date_idx
  ON public.nmm_daily_field_log (user_id, log_date DESC);

ALTER TABLE public.nmm_daily_field_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own daily field log" ON public.nmm_daily_field_log;
CREATE POLICY "own daily field log" ON public.nmm_daily_field_log
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
