-- 015: Ekibim sayfasında üye profil fotoğrafı desteği
-- nmm_workspace_members tablosuna avatar_url kolonu ekleniyor.
-- Bu sayede her üyenin profil resmi ekip panelinde senkronize görünür.

ALTER TABLE nmm_workspace_members
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Mevcut üyeler için auth.users.raw_user_meta_data'dan avatar_url'yi doldur
UPDATE nmm_workspace_members
SET avatar_url = au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE nmm_workspace_members.user_id = au.id
  AND au.raw_user_meta_data->>'avatar_url' IS NOT NULL;

