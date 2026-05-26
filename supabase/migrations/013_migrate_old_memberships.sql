-- Migration 013: Automatically migrate old direct memberships into the new MLM parent-child hiearchical model.
-- This ensures users who joined before Migration 009 get migrated to their own workspace as Leader, 
-- and set their parent_id correctly so they instantly appear in their sponsor's team page with correct stats.

DO $$
DECLARE
  r RECORD;
  v_own_ws_id uuid;
  v_leader_id uuid;
BEGIN
  -- Find all workspace member records where role is 'member' (old model memberships)
  FOR r IN 
    SELECT wm.id, wm.workspace_id, wm.user_id, wm.full_name, w.owner_id as leader_id
    FROM nmm_workspace_members wm
    JOIN nmm_workspaces w ON w.id = wm.workspace_id
    WHERE wm.role = 'member'
  LOOP
    -- A. Find the downline member's own workspace
    SELECT id INTO v_own_ws_id
    FROM nmm_workspaces
    WHERE owner_id = r.user_id;

    -- B. If they don't have their own workspace yet, create one!
    IF NOT FOUND THEN
      INSERT INTO nmm_workspaces (name, owner_id, invite_code, parent_id)
      VALUES (r.full_name || '''in Ekibi', r.user_id, upper(substr(md5(gen_random_uuid()::text), 1, 8)), r.leader_id)
      RETURNING id INTO v_own_ws_id;
    ELSE
      -- If they have their own workspace, update parent_id to the leader
      UPDATE nmm_workspaces
      SET parent_id = r.leader_id
      WHERE id = v_own_ws_id;
    END IF;

    -- C. Ensure they have a leader row in nmm_workspace_members for their own workspace
    INSERT INTO nmm_workspace_members (workspace_id, user_id, role, full_name)
    VALUES (v_own_ws_id, r.user_id, 'leader', r.full_name)
    ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET role = 'leader';

    -- D. Move any candidates they created in the leader's workspace to their own workspace
    UPDATE nmm_candidates
    SET workspace_id = v_own_ws_id
    WHERE owner_id = r.user_id AND workspace_id = r.workspace_id;

    -- E. Move any daily actions they created in the leader's workspace to their own workspace
    UPDATE nmm_daily_actions
    SET workspace_id = v_own_ws_id
    WHERE user_id = r.user_id AND workspace_id = r.workspace_id;

    -- F. Delete the old member row in the leader's workspace
    DELETE FROM nmm_workspace_members
    WHERE id = r.id;

    -- G. Send a realtime notification to the leader!
    INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
    VALUES (
      r.leader_id,
      'Ekibinize yeni ortak katıldı!',
      'New partner joined your team!',
      r.full_name || ' davet kodunuzu kullanarak ekibinize dahil oldu.',
      r.full_name || ' joined your team using your invite code.',
      'user'
    );
  END LOOP;
END;
$$;
