-- Davet kabulü: sponsor boru hattında aday eşleştir / oluştur, huni metriklerine yansıt.
-- Yeni aday → tanisma (created_at) + yeniUye (stage_change joined).
-- Mevcut aday → katildi + yeniUye (stage_change joined).

CREATE OR REPLACE FUNCTION nmm_join_workspace(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_workspace_id          uuid;
  v_workspace_name        text;
  v_leader_id             uuid;
  v_user_id               uuid := auth.uid();
  v_own_ws_id             uuid;
  v_user_fullname         text;
  v_avatar_url            text;
  v_sponsor_candidate_id  uuid;
  v_existing_stage        text;
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
    INSERT INTO nmm_workspaces (name, owner_id, invite_code, parent_id, license_expires_at)
    VALUES (
      v_user_fullname || '''in Ekibi',
      v_user_id,
      upper(substr(md5(gen_random_uuid()::text), 1, 8)),
      v_workspace_id,
      now() + interval '14 days'
    )
    RETURNING id INTO v_own_ws_id;
  ELSE
    UPDATE nmm_workspaces
    SET parent_id = v_workspace_id,
        license_expires_at = COALESCE(license_expires_at, now() + interval '14 days')
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

  -- Sponsor boru hattı: isim eşleşmesi veya yeni aday (katildi).
  SELECT c.id, c.stage INTO v_sponsor_candidate_id, v_existing_stage
  FROM nmm_candidates c
  WHERE c.workspace_id = v_workspace_id
    AND c.owner_id = v_leader_id
    AND lower(trim(c.full_name)) = lower(trim(v_user_fullname))
  LIMIT 1;

  IF v_sponsor_candidate_id IS NULL THEN
    INSERT INTO nmm_candidates (
      workspace_id,
      owner_id,
      full_name,
      stage,
      note_tr,
      note_en,
      warmth
    )
    VALUES (
      v_workspace_id,
      v_leader_id,
      v_user_fullname,
      'katildi',
      'Ekibe katılım daveti kabul edildi',
      'Team invite accepted',
      'ilik'
    )
    RETURNING id INTO v_sponsor_candidate_id;

    INSERT INTO nmm_daily_actions (workspace_id, user_id, candidate_id, action_type, note)
    VALUES (v_workspace_id, v_leader_id, v_sponsor_candidate_id, 'stage_change', 'joined');
  ELSIF v_existing_stage IS DISTINCT FROM 'katildi' THEN
    UPDATE nmm_candidates
    SET stage = 'katildi'
    WHERE id = v_sponsor_candidate_id;

    INSERT INTO nmm_daily_actions (workspace_id, user_id, candidate_id, action_type, note)
    VALUES (v_workspace_id, v_leader_id, v_sponsor_candidate_id, 'stage_change', 'joined');
  END IF;

  RETURN json_build_object(
    'workspace_id',   v_own_ws_id,
    'workspace_name', v_workspace_name
  );
END;
$$;
