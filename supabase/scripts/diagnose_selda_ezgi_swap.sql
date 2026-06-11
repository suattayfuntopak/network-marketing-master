-- Selda / Ezgi: kim hangi hesap, hangi aday, hangi foto?
-- Prod SQL Editor'da çalıştır; sonuç ekran görüntüsüyle karşılaştır.

WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
),
downline AS (
  SELECT w.id AS ws_id, w.name AS ws_name, w.owner_id, u.email, u.raw_user_meta_data->>'full_name' AS auth_name
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE w.parent_id IN (
    SELECT l.id FROM nmm_workspaces l
    JOIN auth.users su ON su.id = l.owner_id
    WHERE su.email = 'suattayfuntopak@gmail.com'
  )
)
SELECT
  d.email,
  d.auth_name,
  wm.full_name AS member_name,
  right(nmm_phone_tail(coalesce(c.phone, '')), 10) AS linked_phone_tail,
  c.full_name AS linked_candidate_name,
  CASE tpl.candidate_id
    WHEN '00fa3484-97b1-4683-b987-638df261b6e2'::uuid THEN 'Selda adayı (5316610273)'
    WHEN '001a2b65-8820-4b2c-9c4a-67d1344b17c2'::uuid THEN 'Ezgi adayı (5373985084)'
    ELSE 'DIGER / YANLIS'
  END AS link_etiketi,
  left(coalesce(wm.avatar_url, ''), 72) AS avatar_preview,
  d.ws_name
FROM downline d
LEFT JOIN nmm_workspace_members wm ON wm.user_id = d.owner_id AND wm.workspace_id = d.ws_id
CROSS JOIN sponsor s
LEFT JOIN nmm_team_pipeline_links tpl ON tpl.member_user_id = d.owner_id AND tpl.workspace_id = s.id
LEFT JOIN nmm_candidates c ON c.id = tpl.candidate_id
WHERE d.email IN ('seldakiratli34@gmail.com', 'ezgi.sagar412841@icloud.com')
ORDER BY d.email;
