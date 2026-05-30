-- 032: Remove duplicate owner workspaces (orphans) + enforce one workspace per owner.

-- Keep one canonical workspace per owner:
--   1) has leader membership row for owner
--   2) else most candidates
--   3) else oldest created_at
-- Delete other owned workspaces only when they have zero candidates.

WITH owner_stats AS (
  SELECT
    w.id,
    w.owner_id,
    w.created_at,
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members m
      WHERE m.workspace_id = w.id
        AND m.user_id = w.owner_id
    ) AS has_owner_membership,
    (
      SELECT count(*)::int
      FROM nmm_candidates c
      WHERE c.workspace_id = w.id
    ) AS candidate_count
  FROM nmm_workspaces w
  WHERE w.owner_id IS NOT NULL
),
canonical AS (
  SELECT DISTINCT ON (owner_id)
    id AS keep_id,
    owner_id
  FROM owner_stats
  ORDER BY
    owner_id,
    has_owner_membership DESC,
    candidate_count DESC,
    created_at ASC
),
orphans AS (
  SELECT os.id
  FROM owner_stats os
  JOIN canonical c ON c.owner_id = os.owner_id
  WHERE os.id <> c.keep_id
    AND os.candidate_count = 0
)
DELETE FROM nmm_workspaces w
WHERE w.id IN (SELECT id FROM orphans);

CREATE UNIQUE INDEX IF NOT EXISTS nmm_workspaces_owner_id_unique
  ON nmm_workspaces (owner_id)
  WHERE owner_id IS NOT NULL;
