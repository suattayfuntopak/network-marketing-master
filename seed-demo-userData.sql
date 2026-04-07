-- ============================================================
-- Network Marketing Master — Otomatik Demo Veri Ekleme Aracı
-- Bu betik, panele yeni katılan eksik hesap verilerini (stage, contacts, deals)
-- otomatik doldurarak uygulamanın panolarının boş kalmamasını sağlar.
-- ============================================================

-- 1. ADIM: Tüm kullanıcılara varsayılan Pipeline (Süreç) aşamalarını zorunlu ekle
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


-- 2. ADIM: Kontakları ve Pano (Deal) verilerini olmayan hesaplara ekle
DO $$
DECLARE
  target_user RECORD;
  c1_id UUID;
  c2_id UUID;
  c3_id UUID;
  stage_new_id UUID;
  stage_contacted_id UUID;
  stage_interested_id UUID;
BEGIN
  -- Her bir kullanıcı için sırayla dolaş:
  FOR target_user IN SELECT id FROM auth.users LOOP
  
    -- Eğer kullanıcının hiç kontağı yoksa, demo verilerini ekle:
    IF NOT EXISTS (SELECT 1 FROM nmm_contacts WHERE user_id = target_user.id) THEN
      
      -- Dinamik ID'leri DÖNGÜ İÇİNDE üret (duplicate hatasını çözmek için)
      c1_id := gen_random_uuid();
      c2_id := gen_random_uuid();
      c3_id := gen_random_uuid();

      -- 1. Demo Kontaklar
      INSERT INTO nmm_contacts (id, user_id, full_name, email, phone, stage, source, contact_type, warmth_score) VALUES
      (c1_id, target_user.id, 'Ali Yılmaz', 'ali.yilmaz@example.com', '5551234567', 'new', 'manual', 'prospect', 20),
      (c2_id, target_user.id, 'Ayşe Demir', 'ayse.demir@example.com', '5559876543', 'contacted', 'social_media', 'prospect', 45),
      (c3_id, target_user.id, 'Veli Kaya', 'veli.kaya@example.com', '5551112233', 'interested', 'referral', 'prospect', 75);

      -- Kullanıcının Pipeline Aşama ID'lerini bul
      SELECT id INTO stage_new_id FROM nmm_pipeline_stages WHERE user_id = target_user.id AND slug = 'new' LIMIT 1;
      SELECT id INTO stage_contacted_id FROM nmm_pipeline_stages WHERE user_id = target_user.id AND slug = 'contacted' LIMIT 1;
      SELECT id INTO stage_interested_id FROM nmm_pipeline_stages WHERE user_id = target_user.id AND slug = 'interested' LIMIT 1;

      -- 2. Demo Süreçler (Deals)
      INSERT INTO nmm_deals (user_id, contact_id, stage_id, title, deal_type, value, probability, status) VALUES
      (target_user.id, c1_id, stage_new_id, 'Kollajen ve Kahve Seti Sunumu', 'product_sale', 1500, 20, 'open'),
      (target_user.id, c2_id, stage_contacted_id, 'İş Fırsatı Görüşmesi Hedef', 'recruitment', 0, 45, 'open'),
      (target_user.id, c3_id, stage_interested_id, 'Kapsamlı Ekip Liderliği Bilgilendirmesi', 'recruitment', 0, 75, 'open');
      
    END IF;
    
  END LOOP;
END $$;
