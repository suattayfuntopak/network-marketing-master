-- =============================================================
-- NMM Faz 1 — Kontak Yönetimi Schema
-- Supabase SQL Editor'de çalıştır
-- =============================================================

-- =============================================================
-- 1. nmm_contacts — Ana kontak tablosu
-- =============================================================
CREATE TABLE IF NOT EXISTS nmm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Temel bilgiler
  full_name TEXT NOT NULL,
  nickname TEXT,

  -- Çoklu kanal
  phone TEXT,
  whatsapp TEXT,
  telegram TEXT,
  email TEXT,
  instagram TEXT,

  -- Kaynak & kategori
  source TEXT DEFAULT 'manual' CHECK (source IN (
    'manual', 'referral', 'social_media', 'event', 'cold_outreach', 'import', 'other'
  )),
  contact_type TEXT DEFAULT 'prospect' CHECK (contact_type IN (
    'prospect', 'customer', 'distributor', 'lost'
  )),

  -- Network Marketing özel
  relationship TEXT,
  city TEXT,
  occupation TEXT,

  -- Sıcaklık skoru
  warmth_score INTEGER DEFAULT 50 CHECK (warmth_score BETWEEN 0 AND 100),

  -- Pipeline durumu
  stage TEXT DEFAULT 'new' CHECK (stage IN (
    'new', 'contacted', 'interested', 'presenting', 'thinking', 'joined', 'lost'
  )),

  -- Notlar
  notes TEXT,

  -- Sosyal & bağlam
  birthday DATE,
  children_count INTEGER,
  interests TEXT[],
  goals TEXT[],
  pain_points TEXT[],

  -- Takip
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,

  -- Meta
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_contacts_user_id ON nmm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_nmm_contacts_stage ON nmm_contacts(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_nmm_contacts_warmth ON nmm_contacts(user_id, warmth_score DESC);
CREATE INDEX IF NOT EXISTS idx_nmm_contacts_next_follow_up ON nmm_contacts(user_id, next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nmm_contacts_full_name ON nmm_contacts(user_id, full_name);

CREATE TRIGGER update_nmm_contacts_updated_at
  BEFORE UPDATE ON nmm_contacts
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- =============================================================
-- 2. nmm_tags — Etiketler
-- =============================================================
CREATE TABLE IF NOT EXISTS nmm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'emerald' CHECK (color IN (
    'emerald', 'amber', 'blue', 'red', 'purple', 'pink', 'gray', 'orange'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_nmm_tags_user_id ON nmm_tags(user_id);

-- =============================================================
-- 3. nmm_contact_tags — Kontak-Etiket ilişkisi
-- =============================================================
CREATE TABLE IF NOT EXISTS nmm_contact_tags (
  contact_id UUID NOT NULL REFERENCES nmm_contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES nmm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_nmm_contact_tags_contact ON nmm_contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_nmm_contact_tags_tag ON nmm_contact_tags(tag_id);

-- =============================================================
-- 4. nmm_interactions — Etkileşim geçmişi
-- =============================================================
CREATE TABLE IF NOT EXISTS nmm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES nmm_contacts(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN (
    'note', 'call', 'whatsapp', 'telegram', 'email', 'sms',
    'meeting', 'presentation', 'objection', 'stage_change',
    'warmth_change', 'system'
  )),

  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  warmth_impact INTEGER DEFAULT 0,

  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_interactions_contact ON nmm_interactions(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_nmm_interactions_user_type ON nmm_interactions(user_id, type);

-- =============================================================
-- 5. RLS Politikaları
-- =============================================================

ALTER TABLE nmm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own contacts" ON nmm_contacts;
CREATE POLICY "Users manage own contacts" ON nmm_contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE nmm_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tags" ON nmm_tags;
CREATE POLICY "Users manage own tags" ON nmm_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE nmm_contact_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own contact tags" ON nmm_contact_tags;
CREATE POLICY "Users manage own contact tags" ON nmm_contact_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nmm_contacts
      WHERE id = contact_id AND user_id = auth.uid()
    )
  );

ALTER TABLE nmm_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own interactions" ON nmm_interactions;
CREATE POLICY "Users manage own interactions" ON nmm_interactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- 6. Warmth Score Güncelleme Trigger
-- =============================================================

CREATE OR REPLACE FUNCTION nmm_update_contact_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nmm_contacts
  SET
    last_contact_at = NEW.occurred_at,
    warmth_score = GREATEST(0, LEAST(100, warmth_score + COALESCE(NEW.warmth_impact, 0))),
    updated_at = NOW()
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_contact_on_interaction ON nmm_interactions;
CREATE TRIGGER update_contact_on_interaction
  AFTER INSERT ON nmm_interactions
  FOR EACH ROW EXECUTE FUNCTION nmm_update_contact_on_interaction();

-- =============================================================
-- 7. Demo Veri (isteğe bağlı)
-- Önce: SELECT id FROM auth.users WHERE email = 'SENİN_EMAIL@gmail.com';
-- Sonra USER_ID'yi aşağıda değiştir:
-- =============================================================

-- INSERT INTO nmm_contacts (user_id, full_name, phone, whatsapp, city, occupation, source, contact_type, stage, warmth_score, notes, relationship) VALUES
--   ('USER_ID', 'Ahmet Yılmaz', '+905551234567', '+905551234567', 'İstanbul', 'Mühendis', 'referral', 'prospect', 'interested', 65, 'Spor salonunda tanıştık, sağlığa önem veriyor', 'tanıdık'),
--   ('USER_ID', 'Zeynep Kaya', '+905557654321', '+905557654321', 'Ankara', 'Öğretmen', 'social_media', 'prospect', 'presenting', 75, 'Instagram''dan ulaştı, ek gelir arıyor', 'tanıdık'),
--   ('USER_ID', 'Mehmet Demir', '+905552345678', NULL, 'İzmir', 'Esnaf', 'manual', 'customer', 'joined', 90, 'Ürünleri çok beğendi, düzenli sipariş veriyor', 'akraba'),
--   ('USER_ID', 'Ayşe Şahin', '+905553456789', '+905553456789', 'Bursa', 'Muhasebeci', 'cold_outreach', 'prospect', 'thinking', 55, 'İtirazı var: zamanı olmadığını söylüyor', 'iş arkadaşı'),
--   ('USER_ID', 'Fatma Öztürk', '+905554567890', NULL, 'Antalya', 'Ev hanımı', 'referral', 'prospect', 'contacted', 40, 'Henüz derinlemesine konuşmadık', 'arkadaş'),
--   ('USER_ID', 'Ali Çelik', '+905555678901', '+905555678901', 'Adana', 'Taksici', 'event', 'prospect', 'new', 30, 'Etkinlikte tanıştık, kart değiştirdik', 'tanıdık'),
--   ('USER_ID', 'Elif Arslan', '+905556789012', '+905556789012', 'Konya', 'Öğrenci', 'social_media', 'prospect', 'interested', 60, 'Ek iş arıyor', 'arkadaş'),
--   ('USER_ID', 'Mustafa Koç', '+905557890123', NULL, 'Gaziantep', 'Serbest', 'referral', 'distributor', 'joined', 95, 'Ekibime katıldı, aktif çalışıyor', 'arkadaş'),
--   ('USER_ID', 'Selin Aydın', '+905558901234', '+905558901234', 'Eskişehir', 'Hemşire', 'manual', 'prospect', 'thinking', 50, 'Çocuklarıyla vakit geçirmek istiyor', 'tanıdık'),
--   ('USER_ID', 'Burak Yıldız', '+905559012345', '+905559012345', 'Samsun', 'Pazarlamacı', 'social_media', 'prospect', 'presenting', 70, 'Kariyerinden memnun değil', 'iş arkadaşı');

-- INSERT INTO nmm_tags (user_id, name, color) VALUES
--   ('USER_ID', 'VIP', 'amber'),
--   ('USER_ID', 'Yakın Çevre', 'emerald'),
--   ('USER_ID', 'Yeni Tanışık', 'blue'),
--   ('USER_ID', 'Ürün Odaklı', 'purple'),
--   ('USER_ID', 'İş Odaklı', 'orange');
