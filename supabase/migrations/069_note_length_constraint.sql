-- 069: nmm_candidates.note uzunluk kısıtı (UI limiti ile hizalı: max 1000 karakter)
-- Not: Bu migration 004_note_length_constraint.sql'in çakışma düzeltmesidir.
-- Orijinal 004 numarası 004_member_self_update.sql ile çakışıyordu.
-- IF NOT EXISTS ile güvenli — constraint zaten mevcutsa sessizce geçer.

-- Mevcut 1000 karakteri aşan notları kırp (constraint öncesi zorunlu)
UPDATE nmm_candidates
SET note = LEFT(note, 1000)
WHERE note IS NOT NULL AND char_length(note) > 1000;

ALTER TABLE nmm_candidates
  DROP CONSTRAINT IF EXISTS nmm_candidates_note_length;

ALTER TABLE nmm_candidates
  ADD CONSTRAINT nmm_candidates_note_length
  CHECK (note IS NULL OR char_length(note) <= 1000);
