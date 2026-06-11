-- CI Supabase shim: vanilla bir Postgres'i, migration'ların bağımlı olduğu
-- Supabase nesneleriyle donatır (auth şeması + roller + auth.uid/jwt). Böylece
-- `supabase/migrations/*.sql` sırayla gerçek bir DB'ye uygulanıp DOĞRULANABİLİR —
-- 063/064'teki "column phone does not exist" gibi şema-referans hataları artık
-- CI'da (prod'a sızmadan) yakalanır. Yalnızca migration'ların KULLANDIĞI yüzey
-- taklit edilir (grep ile bulundu: auth.uid×130, auth.users×37, auth.jwt×9,
-- raw_user_meta_data, roller anon/authenticated/service_role).

-- Roller (GRANT ... TO <rol> ifadeleri için)
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- auth şeması + minimal users tablosu (migration'lar id, email, raw_user_meta_data okur)
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text,
  phone               text,
  raw_user_meta_data  jsonb DEFAULT '{}'::jsonb,
  raw_app_meta_data   jsonb DEFAULT '{}'::jsonb,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- auth.uid() / auth.jwt(): RLS politikaları ve SECURITY DEFINER fonksiyonları için.
-- CI'da gerçek oturum yok → NULL/boş döner (DDL doğrulaması için yeterli).
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'authenticated') $$;

-- Roller auth şemasını görebilsin (RLS politikaları auth.uid() çağırır).
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
