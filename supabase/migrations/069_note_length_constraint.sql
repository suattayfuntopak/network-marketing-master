-- 069: nmm_candidates.note uzunluk kısıtı (UI limiti ile hizalı: max 1000 karakter)
-- Not: Bu migration 004_note_length_constraint.sql'in çakışma düzeltmesidir.
-- Orijinal 004 numarası 004_member_self_update.sql ile çakışıyordu.
-- IF NOT EXISTS ile güvenli — constraint zaten mevcutsa sessizce geçer.

ALTER TABLE nmm_candidates
  DROP CONSTRAINT IF EXISTS nmm_candidates_note_length;

ALTER TABLE nmm_candidates
  ADD CONSTRAINT nmm_candidates_note_length
  CHECK (note IS NULL OR char_length(note) <= 1000);
