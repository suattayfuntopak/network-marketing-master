-- 091: nmm_resolve_team_avatars Selda/Ezgi own-file + Saha Radarı takip sorgusu indeksi

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
  v_selda_user uuid := 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
  v_ezgi_user uuid := 'a71184ee-5b32-455a-88aa-c6aba538cdc0';
  v_selda_url text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg';
  v_ezgi_url text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg';
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

    IF v_uid = v_selda_user THEN
      v_avatar := v_selda_url;
    ELSIF v_uid = v_ezgi_user THEN
      v_avatar := v_ezgi_url;
    ELSE
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

CREATE INDEX IF NOT EXISTS idx_nmm_candidates_owner_follow_up
  ON public.nmm_candidates (owner_id, next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;
