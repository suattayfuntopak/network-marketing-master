-- Join sonrası aday e-postası senkronu + mevcut kayıtlar için idempotent backfill.

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
  v_user_email            text;
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
    raw_user_meta_data->>'phone',
    email
  INTO v_meta_fullname, v_avatar_url, v_user_phone, v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  v_user_fullname := COALESCE(NULLIF(trim(v_user_fullname), ''), NULLIF(trim(v_meta_fullname), ''), 'Yeni Üye');
  v_user_email := lower(trim(COALESCE(v_user_email, '')));

  IF v_user_phone IS NULL OR length(nmm_phone_tail(v_user_phone)) < 10 THEN
    SELECT c.phone INTO v_user_phone
    FROM nmm_candidates c
    WHERE c.owner_id = v_user_id
      AND c.phone IS NOT NULL
      AND length(nmm_phone_tail(c.phone)) >= 10
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

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
      workspace_id, owner_id, full_name, phone, email, stage, note_tr, note_en, warmth
    )
    VALUES (
      v_workspace_id, v_leader_id, v_user_fullname, NULLIF(v_user_phone, ''),
      NULLIF(v_user_email, ''),
      'katildi', 'Ekibe katılım daveti kabul edildi', 'Team invite accepted', 'ilik'
    )
    RETURNING id INTO v_sponsor_candidate_id;

    INSERT INTO nmm_daily_actions (workspace_id, user_id, candidate_id, action_type, note)
    VALUES (v_workspace_id, v_leader_id, v_sponsor_candidate_id, 'stage_change', 'joined');
  ELSIF v_existing_stage IS DISTINCT FROM 'katildi' THEN
    UPDATE nmm_candidates
    SET stage = 'katildi',
        phone = COALESCE(phone, NULLIF(v_user_phone, '')),
        email = COALESCE(NULLIF(trim(email), ''), NULLIF(v_user_email, ''))
    WHERE id = v_sponsor_candidate_id;

    INSERT INTO nmm_daily_actions (workspace_id, user_id, candidate_id, action_type, note)
    VALUES (v_workspace_id, v_leader_id, v_sponsor_candidate_id, 'stage_change', 'joined');
  ELSIF v_user_email <> '' THEN
    UPDATE nmm_candidates
    SET email = COALESCE(NULLIF(trim(email), ''), v_user_email)
    WHERE id = v_sponsor_candidate_id
      AND (email IS NULL OR trim(email) = '');
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

-- Backfill: team_pipeline_links → auth.users.email
UPDATE nmm_candidates c
SET email = lower(trim(u.email)),
    updated_at = now()
FROM nmm_team_pipeline_links tpl
JOIN auth.users u ON u.id = tpl.member_user_id
WHERE c.id = tpl.candidate_id
  AND c.workspace_id = tpl.workspace_id
  AND (c.email IS NULL OR trim(c.email) = '')
  AND u.email IS NOT NULL
  AND trim(u.email) <> '';

-- Backfill: katildi + telefon eşleşmesi (hâlâ boş olanlar)
UPDATE nmm_candidates c
SET email = lower(trim(u.email)),
    updated_at = now()
FROM nmm_workspace_members m
JOIN auth.users u ON u.id = m.user_id
WHERE m.workspace_id = c.workspace_id
  AND (c.email IS NULL OR trim(c.email) = '')
  AND c.stage = 'katildi'
  AND c.phone IS NOT NULL
  AND length(nmm_phone_tail(c.phone)) >= 10
  AND length(nmm_phone_tail(COALESCE(u.raw_user_meta_data->>'phone', ''))) >= 10
  AND nmm_phone_tail(c.phone) = nmm_phone_tail(u.raw_user_meta_data->>'phone')
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM nmm_candidates c2
    WHERE c2.workspace_id = c.workspace_id
      AND c2.id <> c.id
      AND lower(trim(c2.email)) = lower(trim(u.email))
  );
