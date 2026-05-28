-- Y-9 (phase 2): nmm_daily_actions — bilingual leader notes in typed columns.
-- System notes (system_note:*) stay in `note` only; user/leader notes use note_tr + note_en.

ALTER TABLE public.nmm_daily_actions
  ADD COLUMN IF NOT EXISTS note_tr text,
  ADD COLUMN IF NOT EXISTS note_en text;

-- Bilingual rows (skip machine/system notes)
UPDATE public.nmm_daily_actions
SET
  note_tr = NULLIF(trim(split_part(note, '|||', 1)), ''),
  note_en = NULLIF(trim(split_part(note, '|||', 2)), '')
WHERE note IS NOT NULL
  AND position('|||' IN note) > 0
  AND note NOT LIKE 'system_note:%';

-- Single-language leader notes
UPDATE public.nmm_daily_actions
SET note_tr = NULLIF(trim(note), '')
WHERE note IS NOT NULL
  AND position('|||' IN note) = 0
  AND note NOT LIKE 'system_note:%'
  AND (note_tr IS NULL OR note_tr = '');

-- Legacy `note` column: translation-only for bilingual rows
UPDATE public.nmm_daily_actions
SET note = CASE
  WHEN coalesce(note_en, '') <> '' THEN trim(note_tr) || ' ||| ' || trim(note_en)
  WHEN coalesce(note_tr, '') <> '' THEN trim(note_tr)
  ELSE note
END
WHERE note_tr IS NOT NULL
  AND note NOT LIKE 'system_note:%';

COMMENT ON COLUMN public.nmm_daily_actions.note_tr IS 'Leader/user note (Turkish). Null for system_note rows.';
COMMENT ON COLUMN public.nmm_daily_actions.note_en IS 'Leader/user note (English). Null for system_note rows.';
