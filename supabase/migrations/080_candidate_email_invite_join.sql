-- Aday e-postası (davet kaydı ön-doldurma) + davet kabulünde explicit candidate_id desteği.

ALTER TABLE nmm_candidates
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN nmm_candidates.email IS
  'Opsiyonel iletişim e-postası; NMM davet kayıt formunda ön-doldurulur.';

DROP FUNCTION IF EXISTS nmm_join_workspace(text);

CREATE OR REPLACE FUNCTION nmm_join_workspace(
  p_invite_code text,
  p_candidate_id uuid DEFAULT NULL
)
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
  v_user_phone            text;
  v_avatar_url            text;
  v_meta_fullname         text;
  v_sponsor_candidate_id  uuid;
  v_existing_stage        text;
  v_match_score           int;
  v_candidate_name        text;
  v_candidate_phone       text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id, name, owner_id
  INTO v_workspace_id, v_workspace_name, v_leader_id
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

  SELECT
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'phone'
  INTO v_meta_fullname, v_avatar_url, v_user_phone
  FROM auth.users
  WHERE id = v_user_id;

  v_user_fullname := COALESCE(NULLIF(trim(v_user_fullname), ''), NULLIF(trim(v_meta_fullname), ''), 'Yeni Üye');

  IF v_user_phone IS NULL OR length(nmm_phone_tail(v_user_phone)) < 10 THEN
    SELECT c.phone INTO v_user_phone
    FROM nmm_candidates c
    WHERE c.owner_id = v_user_id
      AND c.phone IS NOT NULL
      AND length(nmm_phone_tail(c.phone)) >= 10
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- Davet linkindeki aday id'si varsa: liderin Listem kaydındaki isim/telefon öncelikli.
  IF p_candidate_id IS NOT NULL THEN
    SELECT c.full_name, c.phone
    INTO v_candidate_name, v_candidate_phone
    FROM nmm_candidates c
    WHERE c.id = p_candidate_id
      AND c.workspace_id = v_workspace_id
      AND c.owner_id = v_leader_id;

    IF FOUND AND NULLIF(trim(v_candidate_name), '') IS NOT NULL THEN
      v_user_fullname := trim(v_candidate_name);
      IF v_candidate_phone IS NOT NULL AND length(nmm_phone_tail(v_candidate_phone)) >= 10 THEN
        v_user_phone := v_candidate_phone;
      END IF;
      v_sponsor_candidate_id := p_candidate_id;
    END IF;
  END IF;

  SELECT id INTO v_own_ws_id
  FROM nmm_workspaces
  WHERE owner_id = v_user_id
  LIMIT 1;

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

  BEGIN
    INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
    VALUES (
      v_leader_id,
      'Ekibinize yeni ortak katıldı!',
      'New partner joined your team!',
      v_user_fullname || ' davet kodunuzu kullanarak ekibinize dahil oldu.',
      v_user_fullname || ' joined your team using your invite code.',
      'user'
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  IF v_sponsor_candidate_id IS NULL THEN
    SELECT m.candidate_id, m.stage, m.match_score
    INTO v_sponsor_candidate_id, v_existing_stage, v_match_score
    FROM nmm_match_sponsor_candidate(v_workspace_id, v_leader_id, v_user_fullname, v_user_phone) AS m
    LIMIT 1;
  ELSE
    SELECT stage INTO v_existing_stage
    FROM nmm_candidates
    WHERE id = v_sponsor_candidate_id;
    v_match_score := 100;
  END IF;

  IF v_sponsor_candidate_id IS NULL THEN
    INSERT INTO nmm_candidates (
      workspace_id, owner_id, full_name, phone, stage, note_tr, note_en, warmth
    )
    VALUES (
      v_workspace_id, v_leader_id, v_user_fullname, NULLIF(v_user_phone, ''),
      'katildi', 'Ekibe katılım daveti kabul edildi', 'Team invite accepted', 'ilik'
    )
    RETURNING id INTO v_sponsor_candidate_id;

    INSERT INTO nmm_daily_actions (workspace_id, user_id, candidate_id, action_type, note)
    VALUES (v_workspace_id, v_leader_id, v_sponsor_candidate_id, 'stage_change', 'joined');
  ELSIF v_existing_stage IS DISTINCT FROM 'katildi' THEN
    UPDATE nmm_candidates
    SET stage = 'katildi', phone = COALESCE(phone, NULLIF(v_user_phone, ''))
    WHERE id = v_sponsor_candidate_id;

    INSERT INTO nmm_daily_actions (workspace_id, user_id, candidate_id, action_type, note)
    VALUES (v_workspace_id, v_leader_id, v_sponsor_candidate_id, 'stage_change', 'joined');
  END IF;

  IF v_sponsor_candidate_id IS NOT NULL THEN
    INSERT INTO nmm_team_pipeline_links (workspace_id, member_user_id, candidate_id)
    VALUES (v_workspace_id, v_user_id, v_sponsor_candidate_id)
    ON CONFLICT (workspace_id, member_user_id) DO UPDATE
    SET candidate_id = EXCLUDED.candidate_id;
  END IF;

  RETURN json_build_object(
    'workspace_id',   v_own_ws_id,
    'workspace_name', v_workspace_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION nmm_join_workspace(text, uuid) TO authenticated;
