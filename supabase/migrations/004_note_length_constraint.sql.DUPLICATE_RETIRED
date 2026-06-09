-- ============================================================
-- NMM: Backend note length constraint (matches UI limit)
-- ============================================================

ALTER TABLE nmm_candidates
  ADD CONSTRAINT nmm_candidates_note_length
  CHECK (note IS NULL OR char_length(note) <= 1000);
