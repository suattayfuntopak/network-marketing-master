-- ============================================================
-- NMM Faz 2: Pipeline & Süreç Takibi
-- Supabase SQL Editor'de çalıştır
-- ============================================================

-- nmm_update_updated_at_column fonksiyonu Faz 1'de oluşturuldu.
-- Oluşturulmadıysa aşağıdaki bloğu aç:
-- CREATE OR REPLACE FUNCTION nmm_update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
-- $$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 1. nmm_pipeline_stages — Özelleştirilebilir aşamalar
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nmm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'gray' CHECK (color IN (
    'gray', 'blue', 'purple', 'amber', 'orange', 'emerald', 'red', 'pink'
  )),
  icon TEXT,

  position INTEGER NOT NULL,
  win_probability INTEGER DEFAULT 0 CHECK (win_probability BETWEEN 0 AND 100),

  is_system BOOLEAN DEFAULT false,
  is_won_stage BOOLEAN DEFAULT false,
  is_lost_stage BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_nmm_pipeline_stages_user
  ON nmm_pipeline_stages(user_id, position);

DROP TRIGGER IF EXISTS update_nmm_pipeline_stages_updated_at ON nmm_pipeline_stages;
CREATE TRIGGER update_nmm_pipeline_stages_updated_at
  BEFORE UPDATE ON nmm_pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ------------------------------------------------------------
-- 2. nmm_deals — Deal kayıtları
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nmm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES nmm_contacts(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES nmm_pipeline_stages(id),

  title TEXT NOT NULL,
  deal_type TEXT DEFAULT 'prospect' CHECK (deal_type IN (
    'prospect', 'product_sale', 'recruitment'
  )),

  value NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  probability INTEGER DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),

  expected_close_date DATE,
  actual_close_date DATE,

  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  lost_reason TEXT,

  notes TEXT,

  position_in_stage INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_deals_user        ON nmm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_nmm_deals_contact     ON nmm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_nmm_deals_stage       ON nmm_deals(user_id, stage_id, position_in_stage);
CREATE INDEX IF NOT EXISTS idx_nmm_deals_status      ON nmm_deals(user_id, status);

DROP TRIGGER IF EXISTS update_nmm_deals_updated_at ON nmm_deals;
CREATE TRIGGER update_nmm_deals_updated_at
  BEFORE UPDATE ON nmm_deals
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ------------------------------------------------------------
-- 3. nmm_stage_history — Aşama değişim geçmişi
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nmm_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES nmm_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  from_stage_id UUID REFERENCES nmm_pipeline_stages(id),
  to_stage_id UUID NOT NULL REFERENCES nmm_pipeline_stages(id),

  duration_in_stage INTERVAL,
  moved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_stage_history_deal
  ON nmm_stage_history(deal_id, moved_at DESC);

-- ------------------------------------------------------------
-- 4. RLS Politikaları
-- ------------------------------------------------------------
ALTER TABLE nmm_pipeline_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own stages" ON nmm_pipeline_stages;
CREATE POLICY "Users manage own stages" ON nmm_pipeline_stages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE nmm_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own deals" ON nmm_deals;
CREATE POLICY "Users manage own deals" ON nmm_deals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE nmm_stage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own stage history" ON nmm_stage_history;
CREATE POLICY "Users view own stage history" ON nmm_stage_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System inserts stage history" ON nmm_stage_history;
CREATE POLICY "System inserts stage history" ON nmm_stage_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. Aşama değişim trigger (stage_history + interaction log)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION nmm_log_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  previous_moved_at TIMESTAMPTZ;
  duration INTERVAL;
BEGIN
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    SELECT moved_at INTO previous_moved_at
    FROM nmm_stage_history
    WHERE deal_id = NEW.id
    ORDER BY moved_at DESC
    LIMIT 1;

    IF previous_moved_at IS NOT NULL THEN
      duration := NOW() - previous_moved_at;
    ELSE
      duration := NOW() - OLD.created_at;
    END IF;

    INSERT INTO nmm_stage_history (deal_id, user_id, from_stage_id, to_stage_id, duration_in_stage)
    VALUES (NEW.id, NEW.user_id, OLD.stage_id, NEW.stage_id, duration);

    INSERT INTO nmm_interactions (user_id, contact_id, type, content, metadata)
    VALUES (
      NEW.user_id,
      NEW.contact_id,
      'stage_change',
      'Deal aşaması değişti',
      jsonb_build_object(
        'deal_id', NEW.id,
        'from_stage', OLD.stage_id,
        'to_stage', NEW.stage_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_deal_stage_change ON nmm_deals;
CREATE TRIGGER log_deal_stage_change
  AFTER UPDATE ON nmm_deals
  FOR EACH ROW EXECUTE FUNCTION nmm_log_stage_change();

-- ------------------------------------------------------------
-- 6. Yeni kullanıcılara otomatik default aşamalar
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION nmm_create_default_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nmm_pipeline_stages
    (user_id, name, slug, color, position, win_probability, is_system, is_won_stage, is_lost_stage)
  VALUES
    (NEW.id, 'Yeni Lead',        'new',        'gray',    0, 10,  true, false, false),
    (NEW.id, 'İletişim Kuruldu', 'contacted',  'blue',    1, 25,  true, false, false),
    (NEW.id, 'İlgileniyor',      'interested', 'purple',  2, 40,  true, false, false),
    (NEW.id, 'Sunum Yapıldı',    'presenting', 'amber',   3, 60,  true, false, false),
    (NEW.id, 'Düşünüyor',        'thinking',   'orange',  4, 75,  true, false, false),
    (NEW.id, 'Katıldı',          'joined',     'emerald', 5, 100, true, true,  false),
    (NEW.id, 'Kaybedildi',       'lost',       'red',     6, 0,   true, false, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- nmm_profiles tablosu yoksa auth.users'ı kullan:
-- NOT: Projenizde nmm_profiles tablosu varsa aşağıdaki trigger'ı aktif edin.
-- DROP TRIGGER IF EXISTS on_profile_created_add_stages ON nmm_profiles;
-- CREATE TRIGGER on_profile_created_add_stages
--   AFTER INSERT ON nmm_profiles
--   FOR EACH ROW EXECUTE FUNCTION nmm_create_default_stages();

-- ------------------------------------------------------------
-- 7. Mevcut kullanıcılar için default stages (şimdi çalıştır)
-- ------------------------------------------------------------
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    INSERT INTO nmm_pipeline_stages
      (user_id, name, slug, color, position, win_probability, is_system, is_won_stage, is_lost_stage)
    VALUES
      (u.id, 'Yeni Lead',        'new',        'gray',    0, 10,  true, false, false),
      (u.id, 'İletişim Kuruldu', 'contacted',  'blue',    1, 25,  true, false, false),
      (u.id, 'İlgileniyor',      'interested', 'purple',  2, 40,  true, false, false),
      (u.id, 'Sunum Yapıldı',    'presenting', 'amber',   3, 60,  true, false, false),
      (u.id, 'Düşünüyor',        'thinking',   'orange',  4, 75,  true, false, false),
      (u.id, 'Katıldı',          'joined',     'emerald', 5, 100, true, true,  false),
      (u.id, 'Kaybedildi',       'lost',       'red',     6, 0,   true, false, true)
    ON CONFLICT (user_id, slug) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- KONTROL: Çalıştıktan sonra şunu çalıştır:
-- SELECT count(*) FROM nmm_pipeline_stages;   -- 7 × kullanıcı sayısı
-- SELECT count(*) FROM nmm_deals;             -- 0 (henüz deal yok)
-- ============================================================
