-- 007: Atomic workspace join and remove operations (RPC functions)
-- Eliminates partial-write risk when moving workspace membership + candidates together.

-- nmm_join_workspace: caller moves their own membership + candidates in one transaction
CREATE OR REPLACE FUNCTION nmm_join_workspace(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id   uuid;
  v_workspace_name text;
  v_user_id        uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id, name INTO v_workspace_id, v_workspace_name
  FROM nmm_workspaces
  WHERE invite_code = p_invite_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite_code';
  END IF;

  UPDATE nmm_workspace_members
  SET workspace_id = v_workspace_id, role = 'member'
  WHERE user_id = v_user_id;

  UPDATE nmm_candidates
  SET workspace_id = v_workspace_id
  WHERE owner_id = v_user_id;

  RETURN json_build_object(
    'workspace_id',   v_workspace_id,
    'workspace_name', v_workspace_name
  );
END;
$$;

-- nmm_remove_member: leader removes a member, creates a new workspace for them atomically
-- Caller must be the owner of the workspace containing p_member_id.
CREATE OR REPLACE FUNCTION nmm_remove_member(p_member_id uuid, p_member_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_new_ws_id uuid;
  v_new_code  text;
  chars       text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i           int;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Caller must own the workspace that p_member_id currently belongs to
  IF NOT EXISTS (
    SELECT 1
    FROM nmm_workspace_members wm
    JOIN nmm_workspaces ws ON ws.id = wm.workspace_id
    WHERE wm.user_id = p_member_id
      AND ws.owner_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Generate random 8-char invite code
  v_new_code := '';
  FOR i IN 1..8 LOOP
    v_new_code := v_new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Create new workspace for the removed member
  INSERT INTO nmm_workspaces (name, owner_id, invite_code)
  VALUES (p_member_name || '''in Ekibi', p_member_id, v_new_code)
  RETURNING id INTO v_new_ws_id;

  -- Move member to new workspace as leader
  UPDATE nmm_workspace_members
  SET workspace_id = v_new_ws_id, role = 'leader'
  WHERE user_id = p_member_id;

  -- Move all member's candidates to new workspace
  UPDATE nmm_candidates
  SET workspace_id = v_new_ws_id
  WHERE owner_id = p_member_id;

  RETURN json_build_object('workspace_id', v_new_ws_id);
END;
$$;
