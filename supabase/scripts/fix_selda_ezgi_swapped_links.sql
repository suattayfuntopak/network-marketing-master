-- Selda ↔ Ezgi pipeline link düzeltmesi (ters bağlanmış user_id ↔ candidate_id)
-- Telefon doğrulaması:
--   001a2b65… → Ezgi (+905373985084)
--   00fa3484… → Selda (+905316610273)
-- Idempotent.

WITH sponsor AS (
  SELECT w.id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1
)
INSERT INTO nmm_team_pipeline_links (workspace_id, member_user_id, candidate_id)
SELECT s.id, v.member_user_id, v.candidate_id
FROM sponsor s
CROSS JOIN (VALUES
  ('eeb42bdd-6bc0-4839-b109-d28f3e55d884'::uuid, '00fa3484-97b1-4683-b987-638df261b6e2'::uuid), -- Selda user → Selda aday
  ('a71184ee-5b32-455a-88aa-c6aba538cdc0'::uuid, '001a2b65-8820-4b2c-9c4a-67d1344b17c2'::uuid)  -- Ezgi user → Ezgi aday
) AS v(member_user_id, candidate_id)
ON CONFLICT (workspace_id, member_user_id) DO UPDATE
SET candidate_id = EXCLUDED.candidate_id;

UPDATE nmm_candidates c
SET email = lower(u.email), updated_at = now()
FROM auth.users u
WHERE u.id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884'
  AND c.id = '00fa3484-97b1-4683-b987-638df261b6e2';

UPDATE nmm_candidates c
SET email = lower(u.email), updated_at = now()
FROM auth.users u
WHERE u.id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0'
  AND c.id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2';
