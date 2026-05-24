-- Increase candidate note length constraint to 4000 characters to prevent check constraint violations when appending translations & avatar URLs.
ALTER TABLE nmm_candidates DROP CONSTRAINT IF EXISTS nmm_candidates_note_check;
ALTER TABLE nmm_candidates DROP CONSTRAINT IF EXISTS nmm_candidates_note_length;
ALTER TABLE nmm_candidates
  ADD CONSTRAINT nmm_candidates_note_check
  CHECK (note IS NULL OR char_length(note) <= 4000);
