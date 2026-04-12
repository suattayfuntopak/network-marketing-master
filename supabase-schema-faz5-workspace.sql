-- ============================================================
-- supabase-schema-faz5-workspace.sql
-- Faz 5.3 - Workspace ve Gercek Team Omurgasi
-- Supabase SQL Editor'da calistir
-- ============================================================

CREATE TABLE IF NOT EXISTS nmm_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  default_locale TEXT DEFAULT 'tr',
  country_code TEXT DEFAULT 'TR',
  is_personal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_nmm_workspaces_updated_at
  BEFORE UPDATE ON nmm_workspaces
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

CREATE TABLE IF NOT EXISTS nmm_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nmm_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'leader', 'member', 'assistant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'paused', 'removed')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nmm_workspace_members_user
  ON nmm_workspace_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_nmm_workspace_members_workspace
  ON nmm_workspace_members(workspace_id, status);

CREATE TRIGGER update_nmm_workspace_members_updated_at
  BEFORE UPDATE ON nmm_workspace_members
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

CREATE TABLE IF NOT EXISTS nmm_member_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nmm_workspaces(id) ON DELETE CASCADE,
  sponsor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL DEFAULT 1 CHECK (depth >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nmm_member_relationships_sponsor
  ON nmm_member_relationships(workspace_id, sponsor_user_id);

CREATE INDEX IF NOT EXISTS idx_nmm_member_relationships_member
  ON nmm_member_relationships(workspace_id, member_user_id);

CREATE OR REPLACE FUNCTION nmm_slugify_workspace_name(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(lower(unaccent(coalesce(value, 'workspace'))), '[^a-z0-9]+', '-', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION nmm_create_personal_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_name TEXT;
  workspace_slug TEXT;
  workspace_id UUID;
BEGIN
  workspace_name := coalesce(NEW.full_name, split_part(NEW.email, '@', 1)) || ' Workspace';
  workspace_slug := nmm_slugify_workspace_name(workspace_name || '-' || left(NEW.id::text, 6));

  INSERT INTO nmm_workspaces (owner_user_id, name, slug, default_locale, country_code, is_personal)
  VALUES (NEW.id, workspace_name, workspace_slug, coalesce(NEW.language, 'tr'), 'TR', true)
  RETURNING id INTO workspace_id;

  INSERT INTO nmm_workspace_members (workspace_id, user_id, role, status, invited_by)
  VALUES (
    workspace_id,
    NEW.id,
    CASE WHEN NEW.role IN ('leader', 'admin') THEN 'leader' ELSE 'owner' END,
    'active',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_nmm_profile_created_workspace ON nmm_profiles;
CREATE TRIGGER on_nmm_profile_created_workspace
  AFTER INSERT ON nmm_profiles
  FOR EACH ROW EXECUTE FUNCTION nmm_create_personal_workspace();

ALTER TABLE nmm_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmm_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmm_member_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can read workspaces"
  ON nmm_workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

CREATE POLICY "Workspace owners can update workspaces"
  ON nmm_workspaces
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'leader')
        AND wm.status = 'active'
    )
  );

CREATE POLICY "Users can read own memberships"
  ON nmm_workspace_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'leader')
        AND wm.status = 'active'
    )
  );

CREATE POLICY "Workspace leaders manage memberships"
  ON nmm_workspace_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'leader')
        AND wm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'leader')
        AND wm.status = 'active'
    )
  );

CREATE POLICY "Workspace leaders read relationships"
  ON nmm_member_relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_member_relationships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

CREATE POLICY "Workspace leaders manage relationships"
  ON nmm_member_relationships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_member_relationships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'leader')
        AND wm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM nmm_workspace_members wm
      WHERE wm.workspace_id = nmm_member_relationships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'leader')
        AND wm.status = 'active'
    )
  );
