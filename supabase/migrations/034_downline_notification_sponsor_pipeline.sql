-- Migration 034: Ekip bildirimleri sponsor pipeline kaydına yönlensin
-- Downline aday UUID'si sponsor için erişilemez; sponsor workspace'inde
-- ekip üyesinin adına eşleşen aday kaydı kullanılır.

CREATE OR REPLACE FUNCTION nmm_candidate_change_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id             uuid;
  v_sponsor_ws_id         uuid;
  v_member_pipeline_id    uuid;
  v_user_fullname         text;
BEGIN
  SELECT parent_id INTO v_parent_id
  FROM nmm_workspaces
  WHERE id = NEW.workspace_id;

  IF v_parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = NEW.owner_id AND workspace_id = NEW.workspace_id
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Ekip Arkadaşınız';
  END IF;

  SELECT id INTO v_sponsor_ws_id
  FROM nmm_workspaces
  WHERE owner_id = v_parent_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_sponsor_ws_id IS NOT NULL THEN
    SELECT c.id INTO v_member_pipeline_id
    FROM nmm_candidates c
    WHERE c.workspace_id = v_sponsor_ws_id
      AND c.owner_id = v_parent_id
      AND lower(trim(c.full_name)) = lower(trim(v_user_fullname))
    LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO nmm_notifications (
      user_id, title_tr, title_en, description_tr, description_en, type, candidate_id
    )
    VALUES (
      v_parent_id,
      'Ekip üyeniz yeni aday ekledi!',
      'Team member added a new prospect!',
      v_user_fullname || ', listesine "' || NEW.full_name || '" isimli yeni bir aday ekledi.',
      v_user_fullname || ' added a new prospect named "' || NEW.full_name || '" to their list.',
      'user',
      v_member_pipeline_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stage <> NEW.stage THEN
      INSERT INTO nmm_notifications (
        user_id, title_tr, title_en, description_tr, description_en, type, candidate_id
      )
      VALUES (
        v_parent_id,
        'Ekip üyeniz aşama güncelledi!',
        'Team member updated a stage!',
        v_user_fullname || ', "' || NEW.full_name || '" isimli adayı "' || nmm_get_stage_name_tr(NEW.stage) || '" aşamasına taşıdı.',
        v_user_fullname || ' moved "' || NEW.full_name || '" to "' || nmm_get_stage_name_en(NEW.stage) || '" stage.',
        'alert',
        v_member_pipeline_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
