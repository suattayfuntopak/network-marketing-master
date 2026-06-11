-- Migration 085: Focus Team downline onarımı — Elif, Selda, Ezgi
--
-- Sponsor workspace id e-postadan okunur. Elif adayı yoksa isim/e-posta ile bulunur veya oluşturulur.
-- Idempotent: güvenle tekrar çalıştırılabilir.

DO $$
DECLARE
  v_sponsor_ws_id   uuid;
  v_leader_id       uuid;
  v_selda_user      uuid := 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
  v_selda_candidate uuid := '00fa3484-97b1-4683-b987-638df261b6e2'; -- +905316610273
  v_ezgi_user       uuid := 'a71184ee-5b32-455a-88aa-c6aba538cdc0';
  v_ezgi_candidate  uuid := '001a2b65-8820-4b2c-9c4a-67d1344b17c2'; -- +905373985084
  v_elif_candidate  uuid;
  v_elif_user       uuid;
  v_elif_email      text;
  v_elif_name       text;
BEGIN
  SELECT w.id, w.owner_id
  INTO v_sponsor_ws_id, v_leader_id
  FROM nmm_workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'suattayfuntopak@gmail.com'
  ORDER BY w.created_at ASC
  LIMIT 1;

  IF v_sponsor_ws_id IS NULL THEN
    RAISE EXCEPTION 'Focus Team sponsor workspace bulunamadı (suattayfuntopak@gmail.com)';
  END IF;

  RAISE NOTICE 'Sponsor workspace id = %', v_sponsor_ws_id;

  IF NOT EXISTS (SELECT 1 FROM nmm_candidates WHERE id = v_selda_candidate) THEN
    RAISE EXCEPTION 'Selda aday kaydı bulunamadı: %', v_selda_candidate;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM nmm_candidates WHERE id = v_ezgi_candidate) THEN
    RAISE EXCEPTION 'Ezgi aday kaydı bulunamadı: %', v_ezgi_candidate;
  END IF;

  UPDATE nmm_workspaces child
  SET parent_id = v_sponsor_ws_id
  WHERE child.parent_id IS NOT NULL
    AND child.parent_id IS DISTINCT FROM v_sponsor_ws_id
    AND NOT EXISTS (
      SELECT 1 FROM nmm_workspaces p WHERE p.id = child.parent_id
    )
    AND child.owner_id IN (v_selda_user, v_ezgi_user);

  UPDATE nmm_team_pipeline_links tpl
  SET workspace_id = v_sponsor_ws_id
  WHERE tpl.workspace_id IS DISTINCT FROM v_sponsor_ws_id
    AND NOT EXISTS (
      SELECT 1 FROM nmm_workspaces p WHERE p.id = tpl.workspace_id
    );

  UPDATE nmm_candidates c
  SET workspace_id = v_sponsor_ws_id
  WHERE c.id IN (v_selda_candidate, v_ezgi_candidate)
    AND c.workspace_id IS DISTINCT FROM v_sponsor_ws_id
    AND NOT EXISTS (
      SELECT 1 FROM nmm_workspaces p WHERE p.id = c.workspace_id
    );

  INSERT INTO nmm_team_pipeline_links (workspace_id, member_user_id, candidate_id)
  VALUES (v_sponsor_ws_id, v_selda_user, v_selda_candidate)
  ON CONFLICT (workspace_id, member_user_id) DO UPDATE
  SET candidate_id = EXCLUDED.candidate_id;

  INSERT INTO nmm_team_pipeline_links (workspace_id, member_user_id, candidate_id)
  VALUES (v_sponsor_ws_id, v_ezgi_user, v_ezgi_candidate)
  ON CONFLICT (workspace_id, member_user_id) DO UPDATE
  SET candidate_id = EXCLUDED.candidate_id;

  UPDATE nmm_workspaces w
  SET parent_id = v_sponsor_ws_id
  WHERE w.owner_id IN (v_selda_user, v_ezgi_user)
    AND w.id <> v_sponsor_ws_id
    AND w.parent_id IS DISTINCT FROM v_sponsor_ws_id;

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

  SELECT u.id, lower(trim(u.email)),
         coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), 'Elif Sinem Topak')
  INTO v_elif_user, v_elif_email, v_elif_name
  FROM auth.users u
  WHERE u.email = 'elifsinemtopak@gmail.com'
  LIMIT 1;

  IF v_elif_user IS NULL THEN
    RAISE NOTICE 'Elif auth.users bulunamadı — elifsinemtopak@gmail.com';
  ELSE
    SELECT c.id
    INTO v_elif_candidate
    FROM nmm_candidates c
    WHERE c.workspace_id = v_sponsor_ws_id
      AND (
        lower(trim(coalesce(c.email, ''))) = v_elif_email
        OR c.full_name ILIKE '%Elif%Sinem%'
        OR c.full_name ILIKE '%Elif Sinem%'
      )
    ORDER BY
      CASE WHEN lower(trim(coalesce(c.email, ''))) = v_elif_email THEN 0 ELSE 1 END,
      c.updated_at DESC
    LIMIT 1;

    IF v_elif_candidate IS NULL THEN
      INSERT INTO nmm_candidates (
        workspace_id, owner_id, full_name, email, phone, stage, note_tr, note_en, warmth
      )
      VALUES (
        v_sponsor_ws_id,
        v_leader_id,
        v_elif_name,
        v_elif_email,
        NULL,
        'katildi',
        'Downline onarımı ile yeniden bağlandı',
        'Re-linked via downline repair',
        'ilik'
      )
      RETURNING id INTO v_elif_candidate;

      RAISE NOTICE 'Elif için yeni aday kaydı oluşturuldu: %', v_elif_candidate;
    ELSE
      RAISE NOTICE 'Elif mevcut aday kaydı bulundu: %', v_elif_candidate;
    END IF;

    UPDATE nmm_workspaces w
    SET parent_id = v_sponsor_ws_id
    WHERE w.owner_id = v_elif_user
      AND w.id <> v_sponsor_ws_id
      AND w.parent_id IS DISTINCT FROM v_sponsor_ws_id;

    INSERT INTO nmm_team_pipeline_links (workspace_id, member_user_id, candidate_id)
    VALUES (v_sponsor_ws_id, v_elif_user, v_elif_candidate)
    ON CONFLICT (workspace_id, member_user_id) DO UPDATE
    SET candidate_id = EXCLUDED.candidate_id;

    UPDATE nmm_candidates c
    SET email = coalesce(nullif(trim(c.email), ''), v_elif_email),
        full_name = coalesce(nullif(trim(c.full_name), ''), v_elif_name),
        stage = 'katildi',
        updated_at = now()
    WHERE c.id = v_elif_candidate
      AND c.workspace_id = v_sponsor_ws_id;

    RAISE NOTICE 'Elif bağlandı: user_id=%, candidate_id=%', v_elif_user, v_elif_candidate;
  END IF;
END;
$$;
