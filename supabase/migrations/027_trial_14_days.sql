-- Align free trial window to 14 days (SaaS single-period model).

UPDATE nmm_workspaces
SET license_expires_at = (created_at + interval '14 days')
WHERE license_type = 'free'
  AND (
    license_expires_at IS NULL
    OR license_expires_at < (created_at + interval '14 days')
  )
  AND created_at > (now() - interval '14 days');
