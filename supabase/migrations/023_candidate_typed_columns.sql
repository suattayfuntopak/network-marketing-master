-- Y-9 (phase 1): nmm_candidates — split overloaded `note` into typed columns.
-- `|||` in `note` was used for TR/EN/avatar/warmth; avatar & warmth move to dedicated columns.
-- `note` is kept as legacy 2-segment translation store (TR ||| EN) only after backfill.

ALTER TABLE public.nmm_candidates
  ADD COLUMN IF NOT EXISTS note_tr text,
  ADD COLUMN IF NOT EXISTS note_en text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS warmth text NOT NULL DEFAULT 'ilik';

ALTER TABLE public.nmm_candidates
  DROP CONSTRAINT IF EXISTS nmm_candidates_warmth_check;

ALTER TABLE public.nmm_candidates
  ADD CONSTRAINT nmm_candidates_warmth_check
  CHECK (warmth IN ('sicak', 'ilik', 'soguk'));

-- Rows with legacy 4-segment (or 2-segment) delimiter format
UPDATE public.nmm_candidates
SET
  note_tr = NULLIF(trim(split_part(note, '|||', 1)), ''),
  note_en = NULLIF(trim(split_part(note, '|||', 2)), ''),
  avatar_url = NULLIF(trim(split_part(note, '|||', 3)), ''),
  warmth = CASE
    WHEN trim(split_part(note, '|||', 4)) IN ('sicak', 'ilik', 'soguk')
      THEN trim(split_part(note, '|||', 4))
    ELSE 'ilik'
  END
WHERE note IS NOT NULL
  AND position('|||' IN note) > 0;

-- Plain text notes (no delimiter) → Turkish body only
UPDATE public.nmm_candidates
SET note_tr = NULLIF(trim(note), '')
WHERE note IS NOT NULL
  AND position('|||' IN note) = 0
  AND (note_tr IS NULL OR note_tr = '');

-- Rewrite legacy `note` to translation-only format (TR ||| EN)
UPDATE public.nmm_candidates
SET note = CASE
  WHEN coalesce(note_en, '') <> '' THEN trim(note_tr) || ' ||| ' || trim(note_en)
  WHEN coalesce(note_tr, '') <> '' THEN trim(note_tr)
  ELSE NULL
END
WHERE coalesce(note_tr, '') <> '' OR coalesce(note_en, '') <> '';

COMMENT ON COLUMN public.nmm_candidates.note_tr IS 'Candidate note (Turkish). Primary display source.';
COMMENT ON COLUMN public.nmm_candidates.note_en IS 'Candidate note (English). Permanent translation per CLAUDE.md.';
COMMENT ON COLUMN public.nmm_candidates.avatar_url IS 'Profile photo URL (Supabase storage).';
COMMENT ON COLUMN public.nmm_candidates.warmth IS 'Lead temperature: sicak | ilik | soguk';
