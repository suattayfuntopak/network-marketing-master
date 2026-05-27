-- Migration 017: Admin Signup Database Notification Trigger
-- Automatically dispatches a visual and sound realtime notification to the super admin when a new workspace is created.

CREATE OR REPLACE FUNCTION public.nmm_handle_new_workspace_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_admin_id uuid;
  v_user_email text;
  v_user_fullname text;
BEGIN
  -- Get admin's user ID
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'suattayfuntopak@gmail.com' LIMIT 1;
  
  -- If admin ID exists and the new workspace owner is not the admin
  IF v_admin_id IS NOT NULL AND NEW.owner_id <> v_admin_id THEN
    -- Fetch the new workspace owner's email and full name
    SELECT email, COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_user_email, v_user_fullname
    FROM auth.users
    WHERE id = NEW.owner_id;
    
    -- Insert notification for the admin
    INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
    VALUES (
      v_admin_id,
      'Yeni Platform Kaydı 🚀',
      'New Platform Signup 🚀',
      v_user_fullname || ' (' || v_user_email || ') platforma yeni bağımsız üye olarak kaydoldu!',
      v_user_fullname || ' (' || v_user_email || ') signed up as a new independent member!',
      'user'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS nmm_on_new_workspace_signup ON nmm_workspaces;

-- Create trigger on nmm_workspaces
CREATE TRIGGER nmm_on_new_workspace_signup
  AFTER INSERT ON nmm_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.nmm_handle_new_workspace_notification();
