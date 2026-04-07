-- ============================================================
-- supabase-schema-faz4.sql
-- AI Mesaj Üretici + Akademi & İtiraz Bankası
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- ------------------------------------------------------------
-- 1. nmm_message_templates — Şablonlar
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nmm_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'first_contact',
    'warm_up',
    'value_share',
    'invitation',
    'follow_up',
    'objection_handling',
    'closing',
    'after_no',
    'reactivation',
    'birthday',
    'thank_you',
    'onboarding'
  )),

  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN (
    'whatsapp', 'telegram', 'sms', 'email', 'instagram_dm', 'any'
  )),

  tone TEXT DEFAULT 'friendly' CHECK (tone IN (
    'friendly',
    'professional',
    'curious',
    'empathetic',
    'confident',
    'humorous'
  )),

  language TEXT DEFAULT 'tr',

  content TEXT NOT NULL,
  variables TEXT[],

  goal TEXT,
  use_case TEXT,

  is_ai_generated BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,

  use_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_templates_user ON nmm_message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_nmm_templates_category ON nmm_message_templates(user_id, category);

CREATE TRIGGER update_nmm_templates_updated_at
  BEFORE UPDATE ON nmm_message_templates
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ------------------------------------------------------------
-- 2. nmm_ai_messages — AI ile üretilen mesajlar
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nmm_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES nmm_contacts(id) ON DELETE SET NULL,

  prompt TEXT NOT NULL,
  context JSONB DEFAULT '{}',

  category TEXT NOT NULL,
  channel TEXT NOT NULL,
  tone TEXT NOT NULL,
  language TEXT DEFAULT 'tr',

  generated_content TEXT NOT NULL,
  variants JSONB,

  was_used BOOLEAN DEFAULT false,
  was_edited BOOLEAN DEFAULT false,
  final_content TEXT,

  feedback TEXT CHECK (feedback IN ('great', 'good', 'meh', 'bad', NULL)),

  tokens_used INTEGER,
  model TEXT DEFAULT 'claude-sonnet-4-6',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_ai_messages_user ON nmm_ai_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nmm_ai_messages_contact ON nmm_ai_messages(contact_id);

-- ------------------------------------------------------------
-- 3. nmm_objections — İtiraz Bankası
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nmm_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = sistem itirazı

  category TEXT NOT NULL CHECK (category IN (
    'money',
    'time',
    'trust',
    'family',
    'fear',
    'experience',
    'product',
    'company',
    'pyramid',
    'no_network',
    'introvert',
    'employed',
    'wait',
    'other'
  )),

  objection_text TEXT NOT NULL,
  short_label TEXT,

  response_text TEXT NOT NULL,
  response_short TEXT,

  approach TEXT,
  example_dialog TEXT,

  video_url TEXT,
  reading_url TEXT,

  language TEXT DEFAULT 'tr',
  is_system BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,

  use_count INTEGER DEFAULT 0,

  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_objections_category ON nmm_objections(category);
CREATE INDEX IF NOT EXISTS idx_nmm_objections_user ON nmm_objections(user_id);
CREATE INDEX IF NOT EXISTS idx_nmm_objections_system ON nmm_objections(is_system) WHERE is_system = true;

CREATE TRIGGER update_nmm_objections_updated_at
  BEFORE UPDATE ON nmm_objections
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ------------------------------------------------------------
-- 4. nmm_academy_content — Akademi İçeriği
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nmm_academy_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = sistem

  type TEXT NOT NULL CHECK (type IN (
    'script',
    'lesson',
    'success_story',
    'video',
    'article',
    'cheat_sheet',
    'role_play'
  )),

  category TEXT NOT NULL CHECK (category IN (
    'mindset',
    'prospecting',
    'inviting',
    'presenting',
    'closing',
    'follow_up',
    'team_building',
    'leadership',
    'social_media',
    'product_knowledge',
    'company_info',
    'compliance'
  )),

  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),

  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,

  video_url TEXT,
  reading_time_minutes INTEGER,

  tags TEXT[],
  language TEXT DEFAULT 'tr',

  is_system BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,

  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmm_academy_category ON nmm_academy_content(category, level);
CREATE INDEX IF NOT EXISTS idx_nmm_academy_user ON nmm_academy_content(user_id);
CREATE INDEX IF NOT EXISTS idx_nmm_academy_system ON nmm_academy_content(is_system) WHERE is_system = true;

CREATE TRIGGER update_nmm_academy_updated_at
  BEFORE UPDATE ON nmm_academy_content
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ------------------------------------------------------------
-- 5. RLS Politikaları
-- ------------------------------------------------------------

-- Templates
ALTER TABLE nmm_message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON nmm_message_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Messages
ALTER TABLE nmm_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai messages" ON nmm_ai_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Objections: sistem itirazları (user_id IS NULL) herkes okur
ALTER TABLE nmm_objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read system + own objections" ON nmm_objections
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Manage own objections insert" ON nmm_objections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own objections update" ON nmm_objections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Manage own objections delete" ON nmm_objections
  FOR DELETE USING (auth.uid() = user_id);

-- Academy: sistem içerikleri herkes okur
ALTER TABLE nmm_academy_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read system + own academy" ON nmm_academy_content
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Manage own academy insert" ON nmm_academy_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own academy update" ON nmm_academy_content
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Manage own academy delete" ON nmm_academy_content
  FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Doğrulama sorguları:
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'nmm_%' ORDER BY table_name;
-- SELECT count(*) FROM nmm_objections WHERE is_system = true;
-- SELECT count(*) FROM nmm_academy_content WHERE is_system = true;
-- ------------------------------------------------------------
