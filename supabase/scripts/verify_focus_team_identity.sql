-- Focus Team: NMM kullanıcı ↔ pipeline adayı gerçekten aynı kişi mi?
-- Telefon / e-posta ile çapraz kontrol + mükerrer aday tespiti

WITH sponsor AS (
  SELECT w.id, w.owner_id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
),
targets AS (
  SELECT u.id AS user_id, u.email
  FROM auth.users u
  WHERE u.email IN (
    'seldakiratli34@gmail.com',
    'ezgi.sagar412841@icloud.com',
    'elifsinemtopak@gmail.com'
  )
)
SELECT
  u.email AS auth_email,
  u.raw_user_meta_data->>'full_name' AS auth_name,
  u.raw_user_meta_data->>'phone' AS auth_phone_meta,
  wm.full_name AS workspace_member_name,
  right(nmm_phone_tail(coalesce(u.raw_user_meta_data->>'phone', '')), 10) AS auth_phone_tail,
  tpl.candidate_id AS linked_candidate_id,
  c.full_name AS linked_candidate_name,
  c.phone AS linked_candidate_phone,
  right(nmm_phone_tail(coalesce(c.phone, '')), 10) AS linked_phone_tail,
  c.email AS linked_candidate_email,
  left(coalesce(c.note_tr, c.note_en, ''), 80) AS linked_note_preview,
  CASE
    WHEN tpl.candidate_id IS NULL THEN 'LINK YOK'
    WHEN right(nmm_phone_tail(coalesce(c.phone, u.raw_user_meta_data->>'phone', '')), 10) =
         right(nmm_phone_tail(coalesce(u.raw_user_meta_data->>'phone', c.phone, '')), 10)
         AND length(nmm_phone_tail(coalesce(c.phone, ''))) >= 10
    THEN 'OK telefon'
    WHEN lower(trim(coalesce(c.email, ''))) = lower(trim(u.email)) AND trim(u.email) <> ''
    THEN 'OK email'
    WHEN tpl.candidate_id IS NOT NULL THEN 'UYARI eslesme zayif'
    ELSE 'LINK YOK'
  END AS identity_check
FROM targets t
JOIN auth.users u ON u.id = t.user_id
LEFT JOIN nmm_workspaces ow ON ow.owner_id = u.id
LEFT JOIN nmm_workspace_members wm ON wm.user_id = u.id AND wm.workspace_id = ow.id
CROSS JOIN sponsor s
LEFT JOIN nmm_team_pipeline_links tpl
  ON tpl.member_user_id = u.id AND tpl.workspace_id = s.id
LEFT JOIN nmm_candidates c ON c.id = tpl.candidate_id
ORDER BY u.email;

-- Aynı telefonla birden fazla "katildi" aday var mı? (mükerrer riski)
WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
SELECT
  right(nmm_phone_tail(c.phone), 10) AS phone_tail,
  count(*) AS katildi_count,
  string_agg(c.full_name || ' [' || c.id::text || ']', ' | ' ORDER BY c.created_at) AS adaylar
FROM sponsor s
JOIN nmm_candidates c ON c.workspace_id = s.id
WHERE c.stage = 'katildi'
  AND c.phone IS NOT NULL
  AND length(nmm_phone_tail(c.phone)) >= 10
GROUP BY right(nmm_phone_tail(c.phone), 10)
HAVING count(*) > 1
ORDER BY katildi_count DESC;

-- Listem'deki Selda/Ezgi/Elif adayları (linkli + linksiz hepsi)
WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
SELECT
  c.id AS candidate_id,
  c.full_name,
  c.phone,
  c.email,
  c.stage,
  tpl.member_user_id,
  u.email AS linked_user_email,
  CASE WHEN tpl.member_user_id IS NOT NULL THEN 'bagli' ELSE 'bagli degil' END AS link_durumu
FROM sponsor s
JOIN nmm_candidates c ON c.workspace_id = s.id
LEFT JOIN nmm_team_pipeline_links tpl ON tpl.candidate_id = c.id AND tpl.workspace_id = s.id
LEFT JOIN auth.users u ON u.id = tpl.member_user_id
WHERE c.full_name ILIKE '%selda%'
   OR c.full_name ILIKE '%ezgi%'
   OR c.full_name ILIKE '%elif%sinem%'
ORDER BY c.full_name, c.created_at;
