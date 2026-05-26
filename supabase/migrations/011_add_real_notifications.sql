-- Migration 011: Add real database-driven notifications table with Supabase Realtime enabled.
-- Also update nmm_join_workspace to automatically insert a notification when a user joins a team.

-- 1. Create nmm_notifications table
CREATE TABLE IF NOT EXISTS nmm_notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title_tr       text not null,
  title_en       text not null,
  description_tr text not null,
  description_en text not null,
  type           text not null default 'info' check (type in ('bell', 'alert', 'info', 'user', 'calendar')),
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS) on nmm_notifications
ALTER TABLE nmm_notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy to allow users to manage their own notifications
CREATE POLICY "nmm_notifications_owner_all" ON nmm_notifications
  FOR ALL USING (user_id = auth.uid());

-- 4. Enable Supabase Realtime publication for nmm_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE nmm_notifications;

-- 5. Re-define nmm_join_workspace to include automatic notification dispatch
CREATE OR REPLACE FUNCTION nmm_join_workspace(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id   uuid;
  v_workspace_name text;
  v_leader_id      uuid;
  v_user_id        uuid := auth.uid();
  v_own_ws_id      uuid;
  v_user_fullname  text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- A. Find the workspace of the sponsor/leader who owns the invite code
  SELECT id, name, owner_id INTO v_workspace_id, v_workspace_name, v_leader_id
  FROM nmm_workspaces
  WHERE invite_code = p_invite_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite_code';
  END IF;

  IF v_leader_id = v_user_id THEN
    RAISE EXCEPTION 'cannot_join_own_workspace';
  END IF;

  -- B. Get user's current fullname from nmm_workspace_members
  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Yeni Üye';
  END IF;

  -- C. Find the caller's own workspace (where they are the owner)
  SELECT id INTO v_own_ws_id
  FROM nmm_workspaces
  WHERE owner_id = v_user_id;

  -- D. If caller doesn't have their own workspace yet, create one!
  IF NOT FOUND THEN
    INSERT INTO nmm_workspaces (name, owner_id, invite_code, parent_id)
    VALUES (v_user_fullname || '''in Ekibi', v_user_id, upper(substr(md5(gen_random_uuid()::text), 1, 8)), v_leader_id)
    RETURNING id INTO v_own_ws_id;
  ELSE
    -- If they have their own workspace, update its parent_id to the sponsor's owner_id!
    UPDATE nmm_workspaces
    SET parent_id = v_leader_id
    WHERE id = v_own_ws_id;
  END IF;

  -- E. Ensure they have a 'leader' row in nmm_workspace_members for their own workspace!
  INSERT INTO nmm_workspace_members (workspace_id, user_id, role, full_name)
  VALUES (v_own_ws_id, v_user_id, 'leader', v_user_fullname)
  ON CONFLICT (workspace_id, user_id) DO UPDATE
  SET role = 'leader';

  -- F. If they had membership rows belonging to another workspace, delete them!
  -- (Ensures maybeSingle() in useWorkspace.ts always returns exactly one row: their own workspace!)
  DELETE FROM nmm_workspace_members
  WHERE user_id = v_user_id AND workspace_id <> v_own_ws_id;

  -- G. Automatically dispatch real-time in-app notification to the leader/sponsor!
  INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
  VALUES (
    v_leader_id,
    'Ekibinize yeni ortak katıldı!',
    'New partner joined your team!',
    v_user_fullname || ' davet kodunuzu kullanarak ekibinize dahil oldu.',
    v_user_fullname || ' joined your team using your invite code.',
    'user'
  );

  RETURN json_build_object(
    'workspace_id',   v_own_ws_id,
    'workspace_name', v_workspace_name
  );
END;
$$;
