-- 057_day_journal.sql
-- Günlük saha notları: localStorage yerine kullanıcı başına, gün başına kalıcı kayıt.
-- content: "Türkçe ||| İngilizce" bilingual format (proje i18n kuralı).

CREATE TABLE IF NOT EXISTS public.nmm_day_journal (
  user_id      uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  journal_date date NOT NULL DEFAULT (timezone('utc', now()))::date,
  content      text NOT NULL DEFAULT '' CHECK (char_length(content) <= 8000),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, journal_date)
);

CREATE INDEX IF NOT EXISTS nmm_day_journal_user_date_idx
  ON public.nmm_day_journal (user_id, journal_date DESC);

ALTER TABLE public.nmm_day_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own day journal" ON public.nmm_day_journal;
CREATE POLICY "own day journal" ON public.nmm_day_journal
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
