-- 065: KRİTİK FIX — davet kodu kabulü (nmm_join_workspace) çalışmıyordu.
--
-- KÖK NEDEN: 063/064'teki RPC `SELECT full_name, phone FROM nmm_workspace_members`
-- yapıyordu, ama nmm_workspace_members'ta `phone` KOLONU YOK (id, workspace_id,
-- user_id, role, full_name, created_at/joined_at, avatar_url). Postgres
-- `check_function_bodies=on` ile statik SQL'i CREATE FUNCTION anında doğrular →
-- "column phone does not exist" → 063/064 CANLIYA UYGULANAMADI → davet kodu girince
-- uzun İngilizce hata. (migrate:check yalnızca dosya numarası doğrular, SQL çalıştırmaz.)
--
-- ÇÖZÜM: phone artık nmm_workspace_members'tan DEĞİL, auth metadata + adaylardan alınır.
-- Migration self-contained'tir: gerekli tablo + yardımcı fonksiyonlar IF NOT EXISTS /
-- OR REPLACE ile yeniden kurulur; 062-064 hiç uygulanmamış olsa bile TEK BAŞINA
-- uygulanınca davet akışı (parent_id + üyelik + aday eşleşme + pipeline link) çalışır.

-- ───────────────────────── Pipeline link tablosu (064 ile aynı, idempotent)
CREATE TABLE IF NOT EXISTS nmm_team_pipeline_links (
  workspace_id   uuid NOT NULL REFERENCES nmm_workspaces(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL,
  candidate_id   uuid NOT NULL REFERENCES nmm_candidates(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_pipeline_links_candidate
  ON nmm_team_pipeline_links (candidate_id);

ALTER TABLE nmm_team_pipeline_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_pipeline_links_leader_all ON nmm_team_pipeline_links;
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

-- ───────────────────────── Yardımcı fonksiyonlar (063 ile aynı)
CREATE OR REPLACE FUNCTION nmm_phone_tail(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT right(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), 10);
$$;

CREATE OR REPLACE FUNCTION nmm_clean_name(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(
    regexp_replace(
      translate(coalesce(p, ''), 'ığüşöçİĞÜŞÖÇ', 'igusocigusoc'),
      '[^a-zA-Z0-9]', '', 'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION nmm_match_sponsor_candidate(
  p_workspace_id uuid,
  p_leader_id uuid,
  p_member_name text,
  p_member_phone text
)
RETURNS TABLE(candidate_id uuid, stage text, match_score int)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_mf text := nmm_clean_name(p_member_name);
  v_phone_tail text := nmm_phone_tail(p_member_phone);
  r record;
  v_cf text;
  v_score int;
  v_best_id uuid;
  v_best_stage text;
  v_best_score int := 0;
  v_word text;
  v_word_hits int;
BEGIN
  IF v_mf = '' AND (v_phone_tail IS NULL OR length(v_phone_tail) < 10) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT c.id, c.stage, c.full_name, c.phone
    FROM nmm_candidates c
    WHERE c.workspace_id = p_workspace_id
      AND c.owner_id = p_leader_id
  LOOP
    v_score := 0;
    IF length(v_phone_tail) >= 10 AND nmm_phone_tail(r.phone) = v_phone_tail THEN
      v_score := 110;
    ELSIF v_mf <> '' THEN
      v_cf := nmm_clean_name(r.full_name);
      IF v_cf = '' THEN
        v_score := 0;
      ELSIF v_cf = v_mf THEN
        v_score := 100;
      ELSIF position(v_mf in v_cf) > 0 OR position(v_cf in v_mf) > 0 THEN
        v_score := 85;
      ELSE
        v_word_hits := 0;
        FOREACH v_word IN ARRAY string_to_array(coalesce(p_member_name, ''), ' ')
        LOOP
          IF length(nmm_clean_name(v_word)) >= 3
             AND position(nmm_clean_name(v_word) in v_cf) > 0 THEN
            v_word_hits := v_word_hits + 1;
          END IF;
        END LOOP;
        IF v_word_hits >= 2 THEN
          v_score := 70 + v_word_hits * 5;
        END IF;
      END IF;
    END IF;

    IF v_score > v_best_score THEN
      v_best_score := v_score;
      v_best_id := r.id;
      v_best_stage := r.stage;
    END IF;
  END LOOP;

  IF v_best_score >= 80 THEN
    candidate_id := v_best_id;
    stage := v_best_stage;
    match_score := v_best_score;
    RETURN NEXT;
  END IF;
END;
$$;

-- ───────────────────────── Davet kabulü RPC (phone fix'li)
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
  v_meta_fullname         text;
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

  -- İsim: önce kullanıcının kendi üyelik kaydından (phone YOK — o kolon mevcut değil).
  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = v_user_id
  LIMIT 1;

  -- İsim/avatar/telefon auth metadata'dan tamamlanır.
  SELECT
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'phone'
  INTO v_meta_fullname, v_avatar_url, v_user_phone
  FROM auth.users
  WHERE id = v_user_id;

  v_user_fullname := COALESCE(NULLIF(trim(v_user_fullname), ''), NULLIF(trim(v_meta_fullname), ''), 'Yeni Üye');

  -- Telefon hâlâ yoksa kullanıcının kendi adaylarından bir telefon dene (eşleşme için).
  IF v_user_phone IS NULL OR length(nmm_phone_tail(v_user_phone)) < 10 THEN
    SELECT c.phone INTO v_user_phone
    FROM nmm_candidates c
    WHERE c.owner_id = v_user_id
      AND c.phone IS NOT NULL
      AND length(nmm_phone_tail(c.phone)) >= 10
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- Kullanıcının kendi workspace'i: yoksa oluştur (parent = sponsor), varsa parent set et.
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

  -- Lidere bildirim (best-effort — başarısız olsa bile katılımı bozmaz).
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

  -- Sponsor boru hattında eşleşen adayı bul; yoksa "katildi" adayı oluştur.
  SELECT m.candidate_id, m.stage, m.match_score
  INTO v_sponsor_candidate_id, v_existing_stage, v_match_score
  FROM nmm_match_sponsor_candidate(v_workspace_id, v_leader_id, v_user_fullname, v_user_phone) AS m
  LIMIT 1;

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

  -- Kalıcı üye ↔ aday bağlantısı.
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

GRANT EXECUTE ON FUNCTION nmm_join_workspace(text) TO authenticated;
