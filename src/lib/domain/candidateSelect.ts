/** Liste görünümleri (pano, pipeline, istatistik) — tüm satır alanları; explicit select planlayıcı dostu. */
export const CANDIDATE_LIST_SELECT =
  'id, workspace_id, owner_id, full_name, phone, stage, last_contact_at, note, note_tr, note_en, avatar_url, warmth, next_follow_up_at, created_at, updated_at'

/** Tek aday detay sayfası — şema genişledikçe buraya eklenir. */
export const CANDIDATE_DETAIL_SELECT = '*'
