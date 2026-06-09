-- 076: Ekip ağacı nesil derinliği — recursive downline parent_id (davet kodu/lisans yok).

CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspace_tree()
RETURNS TABLE(id uuid, owner_id uuid, parent_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH RECURSIVE tree AS (
    SELECT w.id, w.owner_id, w.parent_id
    FROM nmm_workspaces w
    WHERE w.parent_id = auth.uid()
       OR w.parent_id IN (
         SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
       )
    UNION ALL
    SELECT w.id, w.owner_id, w.parent_id
    FROM nmm_workspaces w
    INNER JOIN tree t ON w.parent_id = t.id OR w.parent_id = t.owner_id
  )
  SELECT id, owner_id, parent_id FROM tree;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_leader_downline_workspace_tree() TO authenticated;
