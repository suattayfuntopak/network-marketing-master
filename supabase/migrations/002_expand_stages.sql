-- Expand candidate stage options and increase note limit to 500 chars

-- 1. Update stage check constraint
ALTER TABLE nmm_candidates DROP CONSTRAINT IF EXISTS nmm_candidates_stage_check;
ALTER TABLE nmm_candidates
  ADD CONSTRAINT nmm_candidates_stage_check
  CHECK (stage IN (
    'yeni', 'iletisim', 'davetli',
    'sunum', 'takip', 'kararsiz',
    'katildi', 'ilgilenmedi', 'kayboldu'
  ));

-- 2. Update note length constraint (200 → 500)
ALTER TABLE nmm_candidates DROP CONSTRAINT IF EXISTS nmm_candidates_note_check;
ALTER TABLE nmm_candidates
  ADD CONSTRAINT nmm_candidates_note_check
  CHECK (char_length(note) <= 500);

-- 3. Add next_follow_up_at column for manual follow-up scheduling
ALTER TABLE nmm_candidates
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz;
