-- Migration 009: Add parent_id to nmm_workspaces to support sponsorship MLM trees.
-- Every user owns their own workspace and acts as a Leader.
-- When they join a team, their workspace parent_id is set to their sponsor's user_id.

ALTER TABLE nmm_workspaces
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update nmm_join_workspace to implement the new parent-child workspace link model.
CREATE OR REPLACE FUNCTION nmm_join_workspace(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id   uuid;
  v_workspace_name text;
  v_leader_id      uuid;
  v_user_id        uuid := auth.uid();
  v_own_ws_id      uuid;
  v_user_fullname  text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- 1. Find the workspace of the sponsor/leader who owns the invite code
  SELECT id, name, owner_id INTO v_workspace_id, v_workspace_name, v_leader_id
  FROM nmm_workspaces
  WHERE invite_code = p_invite_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite_code';
  END IF;

  IF v_leader_id = v_user_id THEN
    RAISE EXCEPTION 'cannot_join_own_workspace';
  END IF;

  -- 2. Get user's current fullname from nmm_workspace_members
  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Yeni Üye';
  END IF;

  -- 3. Find the caller's own workspace (where they are the owner)
  SELECT id INTO v_own_ws_id
  FROM nmm_workspaces
  WHERE owner_id = v_user_id;

  -- 4. If caller doesn't have their own workspace yet, create one!
  IF NOT FOUND THEN
    INSERT INTO nmm_workspaces (name, owner_id, invite_code, parent_id)
    VALUES (v_user_fullname || '''in Ekibi', v_user_id, upper(substr(md5(gen_random_uuid()::text), 1, 8)), v_leader_id)
    RETURNING id INTO v_own_ws_id;
  ELSE
    -- If they have their own workspace, update its parent_id to the sponsor's owner_id!
    UPDATE nmm_workspaces
    SET parent_id = v_leader_id
    WHERE id = v_own_ws_id;
  END IF;

  -- 5. Ensure they have a 'leader' row in nmm_workspace_members for their own workspace!
  INSERT INTO nmm_workspace_members (workspace_id, user_id, role, full_name)
  VALUES (v_own_ws_id, v_user_id, 'leader', v_user_fullname)
  ON CONFLICT (workspace_id, user_id) DO UPDATE
  SET role = 'leader';

  -- 6. If they had membership rows belonging to another workspace, delete them!
  -- (Ensures maybeSingle() in useWorkspace.ts always returns exactly one row: their own workspace!)
  DELETE FROM nmm_workspace_members
  WHERE user_id = v_user_id AND workspace_id <> v_own_ws_id;

  RETURN json_build_object(
    'workspace_id',   v_own_ws_id,
    'workspace_name', v_workspace_name
  );
END;
$$;
