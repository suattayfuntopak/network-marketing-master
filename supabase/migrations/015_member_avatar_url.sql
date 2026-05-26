-- 015: Ekibim sayfasında üye profil fotoğrafı desteği
-- nmm_workspace_members tablosuna avatar_url kolonu ekleniyor.
-- Bu sayede her üyenin profil resmi ekip panelinde senkronize görünür.

ALTER TABLE nmm_workspace_members
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Mevcut üyeler için auth.users.raw_user_meta_data'dan avatar_url'yi doldur
-- NOT: Bu update sadece veritabanı seviyesinde çalışır, güvenli Security Definer gerektirir.
-- Client-side uygulama, profil güncellemesinde bu kolonu da güncelleyecek.
