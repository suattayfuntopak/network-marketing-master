-- Migration 018: Remove signup notification DB trigger.
-- Admin signup notifications are now dispatched server-side in signupAction
-- (src/app/(auth)/kayit/actions.ts) which fires immediately at registration time,
-- before the workspace is created. The old trigger on nmm_workspaces caused
-- duplicate notifications and only fired on workspace creation (first login), not signup.

DROP TRIGGER IF EXISTS nmm_on_new_workspace_signup ON nmm_workspaces;
