-- Focus Team downline doğrulama (onarım öncesi/sonrası SQL Editor'da çalıştır)
-- UUID hardcode YOK — sponsor id e-postadan okunur.

-- 0) Gerçek sponsor id (son 4 karaktere dikkat: 083e vs 383e vs 883e)
WITH sponsor AS (
  SELECT w.id, w.name, w.invite_code, w.owner_id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
SELECT
  s.id AS sponsor_workspace_id,
  right(s.id::text, 4) AS sponsor_suffix,
  s.name,
  s.invite_code
FROM sponsor s;

-- 1) Üç kişi: parent_id gerçek sponsorla eşleşiyor mu?
WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
SELECT
  u.id AS user_id,
  u.email,
  w.parent_id,
  right(w.parent_id::text, 4) AS parent_suffix,
  s.id AS sponsor_id,
  right(s.id::text, 4) AS sponsor_suffix,
  CASE
    WHEN w.parent_id = s.id THEN 'OK downline'
    WHEN w.parent_id IS NULL THEN 'EKSIK parent_id'
    WHEN NOT EXISTS (SELECT 1 FROM nmm_workspaces p WHERE p.id = w.parent_id) THEN 'HAYALET parent_id'
    ELSE 'YANLIS parent_id'
  END AS parent_status
FROM auth.users u
LEFT JOIN nmm_workspaces w ON w.owner_id = u.id
CROSS JOIN sponsor s
WHERE u.email IN (
  'seldakiratli34@gmail.com',
  'ezgi.sagar412841@icloud.com',
  'elifsinemtopak@gmail.com'
);

-- 2) Pipeline aday + link
WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
SELECT
  c.full_name,
  c.email,
  c.stage,
  tpl.member_user_id,
  u.email AS member_email,
  CASE
    WHEN tpl.member_user_id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884'
         AND c.id = '00fa3484-97b1-4683-b987-638df261b6e2' THEN 'OK Selda'
    WHEN tpl.member_user_id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0'
         AND c.id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2' THEN 'OK Ezgi'
    WHEN c.full_name ILIKE '%Elif%' AND tpl.member_user_id IS NOT NULL THEN 'OK'
    WHEN tpl.member_user_id IS NULL THEN 'LINK YOK'
    ELSE 'TERS / YANLIS LINK'
  END AS link_status
FROM sponsor s
JOIN nmm_candidates c ON c.workspace_id = s.id
LEFT JOIN nmm_team_pipeline_links tpl
  ON tpl.candidate_id = c.id AND tpl.workspace_id = s.id
LEFT JOIN auth.users u ON u.id = tpl.member_user_id
WHERE c.full_name ILIKE '%Elif%'
   OR c.full_name ILIKE '%Selda%'
   OR c.full_name ILIKE '%Ezgi%';

-- 3) Downline workspace listesi (Ekibim RPC'nin gördüğü küme)
WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
SELECT w.id, w.name, w.owner_id, u.email
FROM sponsor s
JOIN nmm_workspaces w ON w.parent_id = s.id
JOIN auth.users u ON u.id = w.owner_id
ORDER BY w.name;
