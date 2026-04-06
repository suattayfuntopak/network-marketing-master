-- ============================================================
-- supabase-schema-faz3-sync.sql
-- Kontak ↔ Pipeline Senkronizasyonu + "Yeni Aday" güncelleme
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- ------------------------------------------------------------
-- 0. "Yeni Lead" → "Yeni Aday" adını düzelt
-- ------------------------------------------------------------
UPDATE nmm_pipeline_stages
SET name = 'Yeni Aday'
WHERE slug = 'new';

-- ------------------------------------------------------------
-- 1. Trigger: nmm_contacts.stage → ilgili deal.stage_id güncelle
--    Yoksa otomatik deal oluştur
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION nmm_sync_contact_stage_to_deal()
RETURNS TRIGGER AS $$
DECLARE
  v_pipeline_stage_id UUID;
  v_deal_id           UUID;
BEGIN
  -- Sonsuz döngü koruması: başka bir trigger'dan tetikleniyorsak çık
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Stage değişmediyse işlem yapma
  IF OLD.stage IS NOT DISTINCT FROM NEW.stage THEN
    RETURN NEW;
  END IF;

  -- Bu kullanıcının slug'a karşılık gelen pipeline stage'ini bul
  SELECT id INTO v_pipeline_stage_id
  FROM public.nmm_pipeline_stages
  WHERE user_id = NEW.user_id
    AND slug    = NEW.stage
  LIMIT 1;

  -- Eşleşen pipeline stage yoksa geç (custom stage olabilir)
  IF v_pipeline_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Kontağın mevcut açık deal'ını bul (en güncel)
  SELECT id INTO v_deal_id
  FROM public.nmm_deals
  WHERE contact_id = NEW.id
    AND status     = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_deal_id IS NOT NULL THEN
    -- Mevcut deal'ı güncelle
    UPDATE public.nmm_deals
    SET stage_id   = v_pipeline_stage_id,
        updated_at = now()
    WHERE id = v_deal_id;
  ELSE
    -- Açık deal yoksa otomatik oluştur (sadece ad + stage)
    INSERT INTO public.nmm_deals (
      user_id, contact_id, stage_id,
      title, deal_type, status,
      value, currency, probability, position_in_stage
    ) VALUES (
      NEW.user_id,
      NEW.id,
      v_pipeline_stage_id,
      NEW.full_name,
      'prospect',
      'open',
      0, 'TRY', 50, 0
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'nmm_sync_contact_stage_to_deal error: %', SQLERRM;
    RETURN NEW; -- Hata olsa bile auth/update akışını bozma
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_nmm_contact_stage_to_deal ON nmm_contacts;
CREATE TRIGGER trg_nmm_contact_stage_to_deal
  AFTER UPDATE OF stage ON nmm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION nmm_sync_contact_stage_to_deal();

-- ------------------------------------------------------------
-- 2. Trigger: nmm_deals.stage_id → contact.stage güncelle
--    (Kanban'da deal sürüklenince)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION nmm_sync_deal_stage_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_stage_slug TEXT;
BEGIN
  -- Sonsuz döngü koruması
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- stage_id değişmediyse işlem yapma
  IF OLD.stage_id IS NOT DISTINCT FROM NEW.stage_id THEN
    RETURN NEW;
  END IF;

  -- Yeni stage'in slug'unu bul
  SELECT slug INTO v_stage_slug
  FROM public.nmm_pipeline_stages
  WHERE id = NEW.stage_id
  LIMIT 1;

  -- Slug, contact.stage enum değerlerinden biri mi?
  -- (Özel stage eklenmişse enum dışı olabilir — o zaman contact.stage dokunma)
  IF v_stage_slug NOT IN (
    'new', 'contacted', 'interested',
    'presenting', 'thinking', 'joined', 'lost'
  ) THEN
    RETURN NEW;
  END IF;

  -- Contact stage'ini güncelle
  UPDATE public.nmm_contacts
  SET stage      = v_stage_slug,
      updated_at = now()
  WHERE id = NEW.contact_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'nmm_sync_deal_stage_to_contact error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_nmm_deal_stage_to_contact ON nmm_deals;
CREATE TRIGGER trg_nmm_deal_stage_to_contact
  AFTER UPDATE OF stage_id ON nmm_deals
  FOR EACH ROW
  EXECUTE FUNCTION nmm_sync_deal_stage_to_contact();

-- ------------------------------------------------------------
-- Kontrol sorguları (çalıştırdıktan sonra doğrula):
-- SELECT trigger_name FROM information_schema.triggers
--   WHERE event_object_table IN ('nmm_contacts','nmm_deals');
-- SELECT name, slug FROM nmm_pipeline_stages WHERE slug = 'new' LIMIT 5;
-- ------------------------------------------------------------
