-- ============================================================
-- NMM Faz 3: Takvim & Akıllı Takip
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. nmm_appointments — Randevular
-- ────────────────────────────────────────────────────────────

CREATE TABLE nmm_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES nmm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES nmm_deals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,

  type TEXT DEFAULT 'meeting' CHECK (type IN (
    'meeting',
    'call',
    'video_call',
    'presentation',
    'coffee',
    'event',
    'other'
  )),

  location TEXT,
  meeting_url TEXT,

  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'Europe/Istanbul',

  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
  )),

  outcome TEXT,
  outcome_notes TEXT,

  reminder_minutes INTEGER[] DEFAULT ARRAY[15, 60],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nmm_appointments_user ON nmm_appointments(user_id);
CREATE INDEX idx_nmm_appointments_contact ON nmm_appointments(contact_id);
CREATE INDEX idx_nmm_appointments_starts_at ON nmm_appointments(user_id, starts_at);
CREATE INDEX idx_nmm_appointments_status ON nmm_appointments(user_id, status);

CREATE TRIGGER update_nmm_appointments_updated_at
  BEFORE UPDATE ON nmm_appointments
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 2. nmm_follow_ups — Takip hatırlatıcıları
-- ────────────────────────────────────────────────────────────

CREATE TABLE nmm_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES nmm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES nmm_deals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  notes TEXT,

  action_type TEXT DEFAULT 'call' CHECK (action_type IN (
    'call',
    'message',
    'email',
    'visit',
    'send_info',
    'check_in',
    'other'
  )),

  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  due_at TIMESTAMPTZ NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed',
    'snoozed',
    'cancelled'
  )),

  completed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,

  auto_generated BOOLEAN DEFAULT false,
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nmm_follow_ups_user ON nmm_follow_ups(user_id);
CREATE INDEX idx_nmm_follow_ups_contact ON nmm_follow_ups(contact_id);
CREATE INDEX idx_nmm_follow_ups_due ON nmm_follow_ups(user_id, due_at, status)
  WHERE status = 'pending';
CREATE INDEX idx_nmm_follow_ups_status ON nmm_follow_ups(user_id, status);

CREATE TRIGGER update_nmm_follow_ups_updated_at
  BEFORE UPDATE ON nmm_follow_ups
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 3. RLS Politikaları
-- ────────────────────────────────────────────────────────────

ALTER TABLE nmm_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own appointments" ON nmm_appointments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE nmm_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own follow ups" ON nmm_follow_ups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. Takip tamamlanınca otomatik interaction log
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION nmm_log_follow_up_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO nmm_interactions (user_id, contact_id, type, subject, content, warmth_impact)
    VALUES (
      NEW.user_id,
      NEW.contact_id,
      CASE NEW.action_type
        WHEN 'call'    THEN 'call'
        WHEN 'message' THEN 'whatsapp'
        WHEN 'email'   THEN 'email'
        ELSE 'note'
      END,
      NEW.title,
      NEW.notes,
      5
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_follow_up_completion
  AFTER UPDATE ON nmm_follow_ups
  FOR EACH ROW EXECUTE FUNCTION nmm_log_follow_up_completion();

-- ────────────────────────────────────────────────────────────
-- 5. Kontağın next_follow_up_at alanını otomatik güncelle
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION nmm_update_contact_next_follow_up()
RETURNS TRIGGER AS $$
DECLARE
  next_due TIMESTAMPTZ;
BEGIN
  SELECT MIN(due_at) INTO next_due
  FROM nmm_follow_ups
  WHERE contact_id = COALESCE(NEW.contact_id, OLD.contact_id)
    AND status = 'pending';

  UPDATE nmm_contacts
  SET next_follow_up_at = next_due
  WHERE id = COALESCE(NEW.contact_id, OLD.contact_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_contact_next_follow_up
  AFTER INSERT OR UPDATE OR DELETE ON nmm_follow_ups
  FOR EACH ROW EXECUTE FUNCTION nmm_update_contact_next_follow_up();

-- ────────────────────────────────────────────────────────────
-- DEMO VERİ (opsiyonel — USER_ID'yi kendi UUID'inle değiştir)
-- ────────────────────────────────────────────────────────────

-- Demo randevular (önümüzdeki 2 hafta, rastgele kontaklar):
/*
INSERT INTO nmm_appointments (user_id, contact_id, title, type, starts_at, ends_at, location, description, status)
SELECT
  '3fe88734-4617-4da7-8e37-83c454d5a751',
  id,
  full_name || ' - ' ||
    CASE (RANDOM() * 3)::INT
      WHEN 0 THEN 'Tanışma Kahvesi'
      WHEN 1 THEN 'Ürün Sunumu'
      ELSE 'Takip Görüşmesi'
    END,
  (ARRAY['meeting', 'call', 'presentation', 'coffee'])[(RANDOM() * 3 + 1)::INT],
  NOW() + (RANDOM() * 14 || ' days')::INTERVAL + INTERVAL '9 hours',
  NOW() + (RANDOM() * 14 || ' days')::INTERVAL + INTERVAL '10 hours',
  'Kadıköy Starbucks',
  'Network Marketing fırsatı sunumu',
  'scheduled'
FROM nmm_contacts
WHERE user_id = '3fe88734-4617-4da7-8e37-83c454d5a751'
LIMIT 5;
*/

-- Demo takipler (karışık: bugün, geciken, yarın, gelecek):
/*
INSERT INTO nmm_follow_ups (user_id, contact_id, title, action_type, priority, due_at, notes)
SELECT
  '3fe88734-4617-4da7-8e37-83c454d5a751',
  id,
  full_name || ' ile takip',
  (ARRAY['call', 'message', 'email'])[(RANDOM() * 2 + 1)::INT],
  (ARRAY['medium', 'high', 'urgent'])[(RANDOM() * 2 + 1)::INT],
  NOW() + ((RANDOM() * 14 - 3) || ' days')::INTERVAL,
  'Otomatik oluşturulmuş demo takip'
FROM nmm_contacts
WHERE user_id = '3fe88734-4617-4da7-8e37-83c454d5a751'
LIMIT 8;
*/
