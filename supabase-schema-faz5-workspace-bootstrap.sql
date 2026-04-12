-- ============================================================
-- supabase-schema-faz5-workspace-bootstrap.sql
-- Faz 5.4 - Mevcut kullanicilar icin workspace bootstrap
-- Supabase SQL Editor'da calistir
-- ============================================================

CREATE OR REPLACE FUNCTION nmm_bootstrap_workspace_for_current_user()
RETURNS UUID AS $$
DECLARE
  profile_row nmm_profiles%ROWTYPE;
  existing_workspace_id UUID;
  workspace_name TEXT;
  workspace_slug TEXT;
BEGIN
  SELECT *
  INTO profile_row
  FROM nmm_profiles
  WHERE id = auth.uid();

  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  SELECT wm.workspace_id
  INTO existing_workspace_id
  FROM nmm_workspace_members wm
  WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
  LIMIT 1;

  IF existing_workspace_id IS NOT NULL THEN
    RETURN existing_workspace_id;
  END IF;

  workspace_name := coalesce(profile_row.full_name, split_part(profile_row.email, '@', 1)) || ' Workspace';
  workspace_slug := nmm_slugify_workspace_name(workspace_name || '-' || left(profile_row.id::text, 6));

  INSERT INTO nmm_workspaces (owner_user_id, name, slug, default_locale, country_code, is_personal)
  VALUES (
    profile_row.id,
    workspace_name,
    workspace_slug,
    coalesce(profile_row.language, 'tr'),
    'TR',
    true
  )
  RETURNING id INTO existing_workspace_id;

  INSERT INTO nmm_workspace_members (workspace_id, user_id, role, status, invited_by)
  VALUES (
    existing_workspace_id,
    profile_row.id,
    CASE WHEN profile_row.role IN ('leader', 'admin') THEN 'leader' ELSE 'owner' END,
    'active',
    profile_row.id
  )
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN existing_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION nmm_bootstrap_workspace_for_current_user() TO authenticated;
