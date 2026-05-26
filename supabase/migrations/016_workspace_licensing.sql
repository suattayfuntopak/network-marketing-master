-- 016: Workspace lisanslama ve Shopier ödeme süre takibi desteği
-- nmm_workspaces tablosuna lisans tipi ve son geçerlilik tarihi alanları ekleniyor.

ALTER TABLE nmm_workspaces
  ADD COLUMN IF NOT EXISTS license_type text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS license_expires_at timestamptz DEFAULT null;
