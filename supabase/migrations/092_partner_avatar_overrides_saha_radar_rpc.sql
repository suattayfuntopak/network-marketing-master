-- 092: Partner avatar overrides tablosu + Saha Radarı takip RPC

CREATE TABLE IF NOT EXISTS public.nmm_partner_avatar_overrides (
  entity_id uuid PRIMARY KEY,
  display_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nmm_partner_avatar_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nmm_partner_avatar_overrides_select ON public.nmm_partner_avatar_overrides;
CREATE POLICY nmm_partner_avatar_overrides_select
  ON public.nmm_partner_avatar_overrides
  FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.nmm_partner_avatar_overrides (entity_id, display_url) VALUES
  ('eeb42bdd-6bc0-4839-b109-d28f3e55d884', 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg'),
  ('00fa3484-97b1-4683-b987-638df261b6e2', 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg'),
  ('a71184ee-5b32-455a-88aa-c6aba538cdc0', 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg'),
  ('001a2b65-8820-4b2c-9c4a-67d1344b17c2', 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg')
ON CONFLICT (entity_id) DO UPDATE
  SET display_url = EXCLUDED.display_url, updated_at = now();

CREATE OR REPLACE FUNCTION public.nmm_partner_avatar_url(p_entity_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_url
  FROM nmm_partner_avatar_overrides
  WHERE entity_id = p_entity_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_partner_avatar_url(uuid) TO authenticated;

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

    v_avatar := nmm_partner_avatar_url(v_uid);

    IF v_avatar IS NULL THEN
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
    END IF;

    IF v_avatar IS NOT NULL AND length(trim(v_avatar)) > 0 THEN
      v_result := v_result || jsonb_build_object(v_uid::text, v_avatar);
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_resolve_team_avatars(uuid, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.nmm_saha_radar_follow_ups(
  p_workspace_id uuid,
  p_owner_ids uuid[],
  p_horizon_days integer DEFAULT 7,
  p_limit integer DEFAULT 60
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  owner_id uuid,
  next_follow_up_at timestamptz,
  stage text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader_id uuid;
  v_allowed uuid[];
  v_horizon timestamptz;
  v_now timestamptz := now();
  v_safe_limit integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT w.owner_id INTO v_leader_id
  FROM nmm_workspaces w
  WHERE w.id = p_workspace_id;

  IF v_leader_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT array_agg(DISTINCT uid) INTO v_allowed
  FROM (
    SELECT auth.uid() AS uid
    UNION
    SELECT wm.user_id FROM nmm_workspace_members wm WHERE wm.workspace_id = p_workspace_id
    UNION
    SELECT w.owner_id FROM nmm_workspaces w
    WHERE w.owner_id IS NOT NULL
      AND (w.parent_id = auth.uid() OR w.parent_id = p_workspace_id)
  ) allowed_ids(uid);

  IF p_owner_ids IS NULL OR cardinality(p_owner_ids) = 0 THEN
    RETURN;
  END IF;

  v_horizon := v_now + make_interval(days => GREATEST(COALESCE(p_horizon_days, 7), 0));
  v_safe_limit := GREATEST(LEAST(COALESCE(p_limit, 60), 200), 1);

  RETURN QUERY
  SELECT c.id, c.full_name, c.phone, c.owner_id, c.next_follow_up_at, c.stage::text
  FROM nmm_candidates c
  WHERE c.owner_id = ANY(p_owner_ids)
    AND c.owner_id = ANY(COALESCE(v_allowed, ARRAY[]::uuid[]))
    AND c.next_follow_up_at IS NOT NULL
    AND c.next_follow_up_at <= v_horizon
  ORDER BY c.next_follow_up_at ASC
  LIMIT v_safe_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmm_saha_radar_follow_ups(uuid, uuid[], integer, integer) TO authenticated;
