-- ============================================================
-- Network Marketing Master — Faz 0 Supabase Şeması
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

-- nmm_profiles: Kullanıcı profili
CREATE TABLE IF NOT EXISTS nmm_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  sponsor_name TEXT,
  role TEXT DEFAULT 'distributor' CHECK (role IN ('distributor', 'leader', 'admin')),
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Istanbul',
  language TEXT DEFAULT 'tr',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION nmm_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nmm_profiles_updated_at
  BEFORE UPDATE ON nmm_profiles
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
CREATE OR REPLACE FUNCTION nmm_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nmm_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_nmm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION nmm_handle_new_user();

-- RLS politikaları
ALTER TABLE nmm_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON nmm_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON nmm_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON nmm_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Storage bucket (avatar'lar için)
INSERT INTO storage.buckets (id, name, public)
VALUES ('nmm-avatars', 'nmm-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "NMM avatar upload policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nmm-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "NMM avatar public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nmm-avatars');
