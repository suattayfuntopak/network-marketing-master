-- Kalıcı ekip üyesi ↔ sponsor boru hattı adayı bağlantısı (isim/telefon eşleşmesine ek).

CREATE TABLE IF NOT EXISTS nmm_team_pipeline_links (
  workspace_id uuid NOT NULL REFERENCES nmm_workspaces(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES nmm_candidates(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_pipeline_links_candidate
  ON nmm_team_pipeline_links (candidate_id);

ALTER TABLE nmm_team_pipeline_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_pipeline_links_leader_all ON nmm_team_pipeline_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nmm_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nmm_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  );

-- Davet kabulünde eşleşen/oluşturulan adayı kalıcı bağla (063 join + link).
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
  v_user_phone            text;
  v_avatar_url            text;
  v_sponsor_candidate_id  uuid;
  v_existing_stage        text;
  v_match_score           int;
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

  -- NOT: nmm_workspace_members'ta `phone` kolonu YOKTUR; eskiden buradaki
  -- `SELECT full_name, phone` bu migration'ın UYGULANMASINI kırıyordu. Telefon
  -- adaylardan/metadata'dan alınır (bkz. 079). full_name yeterli.
  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = v_user_id
  ORDER BY joined_at DESC NULLS LAST
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Yeni Üye';
  END IF;

  IF v_user_phone IS NULL OR length(nmm_phone_tail(v_user_phone)) < 10 THEN
    SELECT c.phone INTO v_user_phone
    FROM nmm_candidates c
    WHERE c.owner_id = v_user_id
      AND c.phone IS NOT NULL
      AND length(nmm_phone_tail(c.phone)) >= 10
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1;
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

  SELECT m.candidate_id, m.stage, m.match_score
  INTO v_sponsor_candidate_id, v_existing_stage, v_match_score
  FROM nmm_match_sponsor_candidate(
    v_workspace_id,
    v_leader_id,
    v_user_fullname,
    v_user_phone
  ) AS m
  LIMIT 1;

  IF v_sponsor_candidate_id IS NULL THEN
    INSERT INTO nmm_candidates (
      workspace_id,
      owner_id,
      full_name,
      phone,
      stage,
      note_tr,
      note_en,
      warmth
    )
    VALUES (
      v_workspace_id,
      v_leader_id,
      v_user_fullname,
      NULLIF(v_user_phone, ''),
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
    SET stage = 'katildi',
        phone = COALESCE(phone, NULLIF(v_user_phone, ''))
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
