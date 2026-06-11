-- 087: Selda ↔ Ezgi kimlik düzeltmesi (link + isim + avatar)
--
-- Belirti: Ekibim'de 3 NMM ortağı görünür ama Selda/Ezgi yüz veya profil olarak ters.
-- Kök neden (geçmiş oturumlar): pipeline link veya aday fotoğrafı ters eşleşmesi.
--
-- Telefon doğrulaması (kaynak gerçek):
--   eeb42bdd… + seldakiratli34@gmail.com  → aday 00fa3484… (+905316610273) Selda
--   a71184ee… + ezgi.sagar412841@icloud.com → aday 001a2b65… (+905373985084) Ezgi
--
-- Idempotent.

DO $$
DECLARE
  v_sponsor_ws_id   uuid;
  v_selda_user      uuid := 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
  v_selda_candidate uuid := '00fa3484-97b1-4683-b987-638df261b6e2';
  v_ezgi_user       uuid := 'a71184ee-5b32-455a-88aa-c6aba538cdc0';
  v_ezgi_candidate  uuid := '001a2b65-8820-4b2c-9c4a-67d1344b17c2';
  v_selda_avatar    text;
  v_ezgi_avatar     text;
  v_selda_name      text;
  v_ezgi_name       text;
BEGIN
  SELECT w.id
  INTO v_sponsor_ws_id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1;

  IF v_sponsor_ws_id IS NULL THEN
    RAISE EXCEPTION 'Focus Team sponsor workspace bulunamadı';
  END IF;

  -- 1) Pipeline linkleri telefon doğrulamalı sabitle
  INSERT INTO nmm_team_pipeline_links (workspace_id, member_user_id, candidate_id)
  VALUES
    (v_sponsor_ws_id, v_selda_user, v_selda_candidate),
    (v_sponsor_ws_id, v_ezgi_user, v_ezgi_candidate)
  ON CONFLICT (workspace_id, member_user_id) DO UPDATE
  SET candidate_id = EXCLUDED.candidate_id;

  -- 2) Aday e-postalarını auth ile hizala
  UPDATE nmm_candidates c
  SET email = lower(trim(u.email)), updated_at = now()
  FROM auth.users u
  WHERE u.id = v_selda_user AND c.id = v_selda_candidate
    AND u.email IS NOT NULL AND trim(u.email) <> '';

  UPDATE nmm_candidates c
  SET email = lower(trim(u.email)), updated_at = now()
  FROM auth.users u
  WHERE u.id = v_ezgi_user AND c.id = v_ezgi_candidate
    AND u.email IS NOT NULL AND trim(u.email) <> '';

  SELECT full_name, nullif(trim(avatar_url), '')
  INTO v_selda_name, v_selda_avatar
  FROM nmm_candidates WHERE id = v_selda_candidate;

  SELECT full_name, nullif(trim(avatar_url), '')
  INTO v_ezgi_name, v_ezgi_avatar
  FROM nmm_candidates WHERE id = v_ezgi_candidate;

  -- 3) workspace_members: doğru isim + aday avatarı (tüm üyelik satırları)
  UPDATE nmm_workspace_members wm
  SET full_name = coalesce(v_selda_name, wm.full_name),
      avatar_url = coalesce(v_selda_avatar, wm.avatar_url)
  WHERE wm.user_id = v_selda_user;

  UPDATE nmm_workspace_members wm
  SET full_name = coalesce(v_ezgi_name, wm.full_name),
      avatar_url = coalesce(v_ezgi_avatar, wm.avatar_url)
  WHERE wm.user_id = v_ezgi_user;

  -- 4) auth metadata
  UPDATE auth.users u
  SET raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'full_name', coalesce(v_selda_name, u.raw_user_meta_data->>'full_name')
    )
    || CASE
      WHEN v_selda_avatar IS NOT NULL THEN jsonb_build_object('avatar_url', v_selda_avatar)
      ELSE '{}'::jsonb
    END
  WHERE u.id = v_selda_user;

  UPDATE auth.users u
  SET raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'full_name', coalesce(v_ezgi_name, u.raw_user_meta_data->>'full_name')
    )
    || CASE
      WHEN v_ezgi_avatar IS NOT NULL THEN jsonb_build_object('avatar_url', v_ezgi_avatar)
      ELSE '{}'::jsonb
    END
  WHERE u.id = v_ezgi_user;

  RAISE NOTICE 'Selda/Ezgi kimlik düzeltmesi tamam (sponsor ws %)', v_sponsor_ws_id;
END;
$$;

-- 5) Aday storage dosyaları ters yüklendiyse: Selda↔Ezgi avatar URL swap
-- Selda user → 001a2b65 dosyası, Ezgi user → 00fa3484 dosyası (083'ün tersi)
DO $$
DECLARE
  v_url_selda_candidate text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg';
  v_url_ezgi_candidate  text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg';
BEGIN
  -- Kullanıcı satırları: Selda hesabına Ezgi dosyası, Ezgi hesabına Selda dosyası
  UPDATE nmm_workspace_members SET avatar_url = v_url_ezgi_candidate
  WHERE user_id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';

  UPDATE nmm_workspace_members SET avatar_url = v_url_selda_candidate
  WHERE user_id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0';

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('avatar_url', v_url_ezgi_candidate)
  WHERE id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('avatar_url', v_url_selda_candidate)
  WHERE id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0';

  -- Aday kayıtlarında da swap (Listem / pipeline tutarlılığı)
  UPDATE nmm_candidates SET avatar_url = v_url_ezgi_candidate, updated_at = now()
  WHERE id = '00fa3484-97b1-4683-b987-638df261b6e2';

  UPDATE nmm_candidates SET avatar_url = v_url_selda_candidate, updated_at = now()
  WHERE id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2';
END;
$$;
