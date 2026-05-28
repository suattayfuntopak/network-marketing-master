-- 019: Downline RLS supports parent_id as sponsor user UUID OR sponsor workspace UUID.
-- Adds avatar sync helper, batch avatar resolve RPC, and join-time avatar propagation.

-- Workspace IDs of direct downlines for the authenticated leader/sponsor.
CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT w.id
  FROM nmm_workspaces w
  WHERE w.parent_id = auth.uid()
     OR w.parent_id IN (
       SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
     );
$$;

DROP POLICY IF EXISTS "nmm_member_read_downlines" ON nmm_workspace_members;
CREATE POLICY "nmm_member_read_downlines" ON nmm_workspace_members
  FOR SELECT
  USING (workspace_id IN (SELECT public.nmm_leader_downline_workspace_ids()));

DROP POLICY IF EXISTS "nmm_candidate_read_downlines" ON nmm_candidates;
CREATE POLICY "nmm_candidate_read_downlines" ON nmm_candidates
  FOR SELECT
  USING (workspace_id IN (SELECT public.nmm_leader_downline_workspace_ids()));

DROP POLICY IF EXISTS "nmm_action_read_downlines" ON nmm_daily_actions;
CREATE POLICY "nmm_action_read_downlines" ON nmm_daily_actions
  FOR SELECT
  USING (workspace_id IN (SELECT public.nmm_leader_downline_workspace_ids()));

-- Propagate avatar to every workspace_members row for the current user.
CREATE OR REPLACE FUNCTION public.nmm_sync_member_avatar(p_avatar_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_avatar_url IS NULL OR length(trim(p_avatar_url)) = 0 THEN
    RETURN;
  END IF;
  UPDATE nmm_workspace_members
  SET avatar_url = p_avatar_url
  WHERE user_id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_sync_member_avatar(text) TO authenticated;

-- Sponsor resolves avatars for their team in one roundtrip (workspace rows + auth metadata).
CREATE OR REPLACE FUNCTION public.nmm_resolve_team_avatars(
  p_workspace_id uuid,
  p_user_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_owner_id uuid;
  v_result jsonb := '{}'::jsonb;
  v_uid uuid;
  v_avatar text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM nmm_workspaces
  WHERE id = p_workspace_id;

  IF v_owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOREACH v_uid IN ARRAY p_user_ids
  LOOP
    IF v_uid IS NULL THEN
      CONTINUE;
    END IF;

    IF v_uid <> v_owner_id
       AND v_uid NOT IN (SELECT user_id FROM nmm_workspace_members WHERE workspace_id = p_workspace_id)
       AND v_uid NOT IN (
         SELECT owner_id FROM nmm_workspaces
         WHERE parent_id = auth.uid() OR parent_id = p_workspace_id
       ) THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(
      (SELECT wm.avatar_url
       FROM nmm_workspace_members wm
       WHERE wm.user_id = v_uid AND wm.avatar_url IS NOT NULL
       ORDER BY wm.joined_at DESC NULLS LAST
       LIMIT 1),
      (SELECT au.raw_user_meta_data->>'avatar_url'
       FROM auth.users au
       WHERE au.id = v_uid)
    ) INTO v_avatar;

    IF v_avatar IS NOT NULL AND length(trim(v_avatar)) > 0 THEN
      v_result := v_result || jsonb_build_object(v_uid::text, v_avatar);
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_resolve_team_avatars(uuid, uuid[]) TO authenticated;

-- Join workspace: copy avatar from auth metadata; link parent to sponsor workspace id (dual legacy support).
CREATE OR REPLACE FUNCTION nmm_join_workspace(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_workspace_id   uuid;
  v_workspace_name text;
  v_leader_id      uuid;
  v_user_id        uuid := auth.uid();
  v_own_ws_id      uuid;
  v_user_fullname  text;
  v_avatar_url     text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id, name, owner_id INTO v_workspace_id, v_workspace_name, v_leader_id
  FROM nmm_workspaces
  WHERE invite_code = p_invite_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite_code';
  END IF;

  IF v_leader_id = v_user_id THEN
    RAISE EXCEPTION 'cannot_join_own_workspace';
  END IF;

  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Yeni Üye';
  END IF;

  SELECT raw_user_meta_data->>'avatar_url' INTO v_avatar_url
  FROM auth.users
  WHERE id = v_user_id;

  SELECT id INTO v_own_ws_id
  FROM nmm_workspaces
  WHERE owner_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO nmm_workspaces (name, owner_id, invite_code, parent_id)
    VALUES (
      v_user_fullname || '''in Ekibi',
      v_user_id,
      upper(substr(md5(gen_random_uuid()::text), 1, 8)),
      v_workspace_id
    )
    RETURNING id INTO v_own_ws_id;
  ELSE
    UPDATE nmm_workspaces
    SET parent_id = v_workspace_id
    WHERE id = v_own_ws_id;
  END IF;

  INSERT INTO nmm_workspace_members (workspace_id, user_id, role, full_name, avatar_url)
  VALUES (v_own_ws_id, v_user_id, 'leader', v_user_fullname, v_avatar_url)
  ON CONFLICT (workspace_id, user_id) DO UPDATE
  SET role = 'leader',
      full_name = EXCLUDED.full_name,
      avatar_url = COALESCE(EXCLUDED.avatar_url, nmm_workspace_members.avatar_url);

  DELETE FROM nmm_workspace_members
  WHERE user_id = v_user_id AND workspace_id <> v_own_ws_id;

  INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
  VALUES (
    v_leader_id,
    'Ekibinize yeni ortak katıldı!',
    'New partner joined your team!',
    v_user_fullname || ' davet kodunuzu kullanarak ekibinize dahil oldu.',
    v_user_fullname || ' joined your team using your invite code.',
    'user'
  );

  RETURN json_build_object(
    'workspace_id',   v_own_ws_id,
    'workspace_name', v_workspace_name
  );
END;
$$;
