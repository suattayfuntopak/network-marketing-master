-- Migration 012: Add automatic triggers to notify leaders of downline candidate metric increases and stage changes.
-- When a downline member adds a candidate or moves a candidate to a new stage, their sponsor/leader gets a real-time notification.

-- 1. Helper function to translate stages to Turkish names
CREATE OR REPLACE FUNCTION nmm_get_stage_name_tr(p_stage text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF p_stage = 'yeni' THEN RETURN 'Yeni Aday'; END IF;
  IF p_stage = 'iletisim' THEN RETURN 'İletişim Kuruldu'; END IF;
  IF p_stage = 'takip' THEN RETURN 'Takip Ediliyor'; END IF;
  IF p_stage = 'sunum' THEN RETURN 'Sunum Yapıldı'; END IF;
  IF p_stage = 'kararsiz' THEN RETURN 'Kararsız'; END IF;
  IF p_stage = 'katildi' THEN RETURN 'Ekibe Katıldı'; END IF;
  IF p_stage = 'kayboldu' THEN RETURN 'Takip Dışı'; END IF;
  RETURN p_stage;
END;
$$;

-- 2. Helper function to translate stages to English names
CREATE OR REPLACE FUNCTION nmm_get_stage_name_en(p_stage text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF p_stage = 'yeni' THEN RETURN 'New Lead'; END IF;
  IF p_stage = 'iletisim' THEN RETURN 'Contacted'; END IF;
  IF p_stage = 'takip' THEN RETURN 'Follow-up'; END IF;
  IF p_stage = 'sunum' THEN RETURN 'Presentation Done'; END IF;
  IF p_stage = 'kararsiz' THEN RETURN 'Undecided'; END IF;
  IF p_stage = 'katildi' THEN RETURN 'Joined'; END IF;
  IF p_stage = 'kayboldu' THEN RETURN 'Lost'; END IF;
  RETURN p_stage;
END;
$$;

-- 3. Trigger function to create notifications for direct sponsors on candidate changes
CREATE OR REPLACE FUNCTION nmm_candidate_change_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id       uuid;
  v_user_fullname   text;
BEGIN
  -- A. Look up the workspace's parent_id (the sponsor's user_id)
  SELECT parent_id INTO v_parent_id
  FROM nmm_workspaces
  WHERE id = NEW.workspace_id;

  -- If there is no sponsor/parent, do nothing!
  IF v_parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- B. Get the workspace owner's fullname (the downline member)
  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = NEW.owner_id AND workspace_id = NEW.workspace_id
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Ekip Arkadaşınız';
  END IF;

  -- C. Handle INSERT (New candidate added by downline)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
    VALUES (
      v_parent_id,
      'Ekip üyeniz yeni aday ekledi!',
      'Team member added a new prospect!',
      v_user_fullname || ', listesine "' || NEW.full_name || '" isimli yeni bir aday ekledi.',
      v_user_fullname || ' added a new prospect named "' || NEW.full_name || '" to their list.',
      'user'
    );
  -- D. Handle UPDATE (Stage updated by downline)
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stage <> NEW.stage THEN
      INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
      VALUES (
        v_parent_id,
        'Ekip üyeniz aşama güncelledi!',
        'Team member updated a stage!',
        v_user_fullname || ', "' || NEW.full_name || '" isimli adayı "' || nmm_get_stage_name_tr(NEW.stage) || '" aşamasına taşıdı.',
        v_user_fullname || ' moved "' || NEW.full_name || '" to "' || nmm_get_stage_name_en(NEW.stage) || '" stage.',
        'alert'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach trigger to nmm_candidates table
DROP TRIGGER IF EXISTS nmm_candidates_notification_trigger ON nmm_candidates;

CREATE TRIGGER nmm_candidates_notification_trigger
  AFTER INSERT OR UPDATE ON nmm_candidates
  FOR EACH ROW
  EXECUTE FUNCTION nmm_candidate_change_trigger_fn();
