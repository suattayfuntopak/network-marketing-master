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

-- Supabase Realtime publication (011/043 `ALTER PUBLICATION supabase_realtime ADD TABLE`,
-- 044 DROP). Vanilla PG'de yok → boş bir publication oluştur.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- pg_cron taklidi (070 `cron.job` / `cron.schedule`). CI'da gerçek zamanlayıcı yok;
-- şema + tablo + no-op fonksiyon, migration'ın temiz uygulanması için yeterli.
CREATE SCHEMA IF NOT EXISTS cron;
CREATE TABLE IF NOT EXISTS cron.job (
  jobid    bigint GENERATED ALWAYS AS IDENTITY,
  jobname  text,
  schedule text,
  command  text
);
CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text)
  RETURNS bigint LANGUAGE sql AS $$
    INSERT INTO cron.job (jobname, schedule, command) VALUES (job_name, schedule, command)
    RETURNING jobid;
  $$;
