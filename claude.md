# CLAUDE.md — Faz 1: Kontak Yönetimi

## 🎯 BU SEANSIN AMACI

Uygulamanın **kalbi** olan kontak yönetim modülünü kurmak:
1. Kontakları veritabanında saklamak (çoklu kanal desteği ile)
2. Kontak ekleme formu (manuel)
3. Kontak listesi (filtre, arama, sıralama)
4. Kontak detay sayfası (360° görünüm)
5. Etiketleme sistemi
6. Etkileşim (interaction) kaydı
7. CSV import/export

**Seans sonunda:** Kullanıcı manuel kontak ekleyebilmeli, listeden arayıp bulabilmeli, detay sayfasında tüm bilgileri ve geçmiş etkileşimleri görebilmeli.

---

## 🗄️ VERİTABANI ŞEMASI (Faz 1)

Tüm tablolar **`nmm_`** prefix'li.

### 1. nmm_contacts — Ana kontak tablosu

```sql
CREATE TABLE nmm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Temel bilgiler
  full_name TEXT NOT NULL,
  nickname TEXT,
  
  -- Çoklu kanal
  phone TEXT,
  whatsapp TEXT,         -- +90 formatında
  telegram TEXT,         -- @username
  email TEXT,
  instagram TEXT,        -- @username
  
  -- Kaynak & kategori
  source TEXT DEFAULT 'manual' CHECK (source IN (
    'manual', 'referral', 'social_media', 'event', 'cold_outreach', 'import', 'other'
  )),
  contact_type TEXT DEFAULT 'prospect' CHECK (contact_type IN (
    'prospect',      -- Aday
    'customer',      -- Müşteri (ürün aldı)
    'distributor',   -- Ekip üyesi
    'lost'           -- Kaybedilmiş
  )),
  
  -- Network Marketing özel
  relationship TEXT,     -- arkadaş, akraba, iş arkadaşı, tanıdık
  city TEXT,
  occupation TEXT,       -- meslek
  
  -- Sıcaklık skoru (0-100, event-driven güncellenir)
  warmth_score INTEGER DEFAULT 50 CHECK (warmth_score BETWEEN 0 AND 100),
  
  -- Pipeline durumu (Faz 2'de detaylandırılacak, şimdilik basit)
  stage TEXT DEFAULT 'new' CHECK (stage IN (
    'new',          -- Yeni eklendi
    'contacted',    -- İlk iletişim kuruldu
    'interested',   -- İlgilendi
    'presenting',   -- Sunum yapıldı
    'thinking',     -- Düşünüyor
    'joined',       -- Katıldı
    'lost'          -- Kaybedildi
  )),
  
  -- Notlar
  notes TEXT,
  
  -- Sosyal & bağlam
  birthday DATE,
  children_count INTEGER,
  interests TEXT[],      -- ilgi alanları array
  goals TEXT[],          -- hedefler (para, özgürlük, sağlık vb.)
  pain_points TEXT[],    -- sıkıntılar
  
  -- Takip
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  
  -- Meta
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler (performans için)
CREATE INDEX idx_nmm_contacts_user_id ON nmm_contacts(user_id);
CREATE INDEX idx_nmm_contacts_stage ON nmm_contacts(user_id, stage);
CREATE INDEX idx_nmm_contacts_warmth ON nmm_contacts(user_id, warmth_score DESC);
CREATE INDEX idx_nmm_contacts_next_follow_up ON nmm_contacts(user_id, next_follow_up_at) 
  WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX idx_nmm_contacts_full_name ON nmm_contacts(user_id, full_name);

-- Updated_at trigger
CREATE TRIGGER update_nmm_contacts_updated_at
  BEFORE UPDATE ON nmm_contacts
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();
```

### 2. nmm_tags — Etiketler

```sql
CREATE TABLE nmm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'emerald' CHECK (color IN (
    'emerald', 'amber', 'blue', 'red', 'purple', 'pink', 'gray', 'orange'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_nmm_tags_user_id ON nmm_tags(user_id);
```

### 3. nmm_contact_tags — Kontak-Etiket ilişkisi (many-to-many)

```sql
CREATE TABLE nmm_contact_tags (
  contact_id UUID NOT NULL REFERENCES nmm_contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES nmm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX idx_nmm_contact_tags_contact ON nmm_contact_tags(contact_id);
CREATE INDEX idx_nmm_contact_tags_tag ON nmm_contact_tags(tag_id);
```

### 4. nmm_interactions — Etkileşim geçmişi (360° view'ın kalbi)

```sql
CREATE TABLE nmm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES nmm_contacts(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'note',           -- Manuel not
    'call',           -- Telefon görüşmesi
    'whatsapp',       -- WhatsApp mesajı
    'telegram',       -- Telegram mesajı
    'email',          -- Email
    'sms',            -- SMS
    'meeting',        -- Yüz yüze görüşme
    'presentation',   -- Sunum yapıldı
    'objection',      -- İtiraz belirtti
    'stage_change',   -- Aşama değişti (otomatik)
    'warmth_change',  -- Sıcaklık skoru değişti (otomatik)
    'system'          -- Sistem notu
  )),
  
  direction TEXT CHECK (direction IN ('inbound', 'outbound', NULL)),
  subject TEXT,
  content TEXT,
  
  -- Metadata (esnek)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Sıcaklık etkisi
  warmth_impact INTEGER DEFAULT 0,
  
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nmm_interactions_contact ON nmm_interactions(contact_id, occurred_at DESC);
CREATE INDEX idx_nmm_interactions_user_type ON nmm_interactions(user_id, type);
```

### 5. RLS Politikaları

```sql
-- nmm_contacts
ALTER TABLE nmm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts" ON nmm_contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- nmm_tags
ALTER TABLE nmm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tags" ON nmm_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- nmm_contact_tags
ALTER TABLE nmm_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contact tags" ON nmm_contact_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nmm_contacts 
      WHERE id = contact_id AND user_id = auth.uid()
    )
  );

-- nmm_interactions
ALTER TABLE nmm_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interactions" ON nmm_interactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 6. Otomatik Warmth Score Güncelleme Trigger'ı

```sql
-- Interaction eklenince kontağın last_contact_at ve warmth_score'unu güncelle
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

CREATE TRIGGER update_contact_on_interaction
  AFTER INSERT ON nmm_interactions
  FOR EACH ROW EXECUTE FUNCTION nmm_update_contact_on_interaction();
```

---

## 📱 SAYFALAR & AKIŞLAR

### Sayfa 1: Kontaklar Listesi — `/kontaklar`

**Layout:**
- Üst: Arama çubuğu + filtreler + "Yeni Kontak" butonu + "CSV İçe Aktar" dropdown
- Filtre çubuğu: Aşama, Etiket, Sıcaklık (soğuk/ılık/sıcak), Kaynak, Kontak türü
- Sıralama: İsim, Son temas, Sıcaklık, Eklenme tarihi
- Görünüm toggle: Tablo / Kart
- Alt: Sayfalama (20'şer)

**Tablo sütunları:**
1. ☑️ Checkbox (toplu işlem için)
2. İsim + soyisim (avatar + tıklanabilir → detay)
3. Kanallar (ikonlar: 📱 WhatsApp, 📞 telefon, ✉️ email)
4. Aşama (badge)
5. 🌡️ Sıcaklık (renkli progress bar)
6. Etiketler (chip'ler)
7. Son temas (relative: "3 gün önce")
8. Eylemler (⋯ dropdown: düzenle, arşivle, sil)

**Toplu işlemler:**
- Etiket ekle/kaldır
- Aşama değiştir
- Arşivle
- Sil

### Sayfa 2: Yeni Kontak / Düzenle — `/kontaklar/yeni` ve `/kontaklar/:id/duzenle`

**Form tabları:**
1. **Temel** (zorunlu): Tam ad, Nickname, Telefon, WhatsApp, Email, Telegram, Instagram
2. **Detay**: Şehir, Meslek, İlişki türü, Doğum günü, Çocuk sayısı
3. **Network Marketing**: Kaynak, Kontak türü, Aşama, Sıcaklık skoru
4. **Notlar & Etiketler**: Notlar (textarea), İlgi alanları, Hedefler, Sıkıntılar, Etiketler

**Tek "Kaydet" butonu**, form alt kısmında.

### Sayfa 3: Kontak Detay — `/kontaklar/:id`

**360° görünüm — 3 sütun:**

**Sol sütun (kontak bilgileri):**
- Avatar + tam ad + nickname
- Sıcaklık skoru (büyük görsel)
- Aşama badge
- Etiketler
- Kanal butonları (WhatsApp, telefon, email, Telegram)
- Temel bilgiler

**Orta sütun (zaman çizelgesi):**
- En üstte "Hızlı not ekle" input
- Aksiyon butonları: Arama kaydet, Mesaj gönder, Sunum kaydet
- Aşağıda zaman çizelgesi (interactions reverse chronological)
- Her interaction: tip ikonu, başlık, içerik, tarih, sıcaklık etkisi

**Sağ sütun (bağlam & eylemler):**
- "Hakkında" (meslek, şehir, doğum günü, vs.)
- İlgi alanları, hedefler, sıkıntılar (chip'ler)
- Bir sonraki takip (tarih + geri sayım)
- AI önerileri placeholder (Faz 4'te dolacak)
- "Düzenle" / "Arşivle" butonları

### Sayfa 4: CSV Import — Modal

1. Dosya yükle (drag & drop)
2. Sütun eşleştirme (ad → full_name, tel → phone, vs.)
3. Önizleme (ilk 5 satır)
4. İçe aktar butonu
5. İlerleme + sonuç raporu

---

## 🧩 BİLEŞEN YAPISI

```
src/
├── pages/dashboard/contacts/
│   ├── ContactsListPage.tsx
│   ├── ContactDetailPage.tsx
│   ├── ContactFormPage.tsx
│   └── ContactImportModal.tsx
├── components/contacts/
│   ├── ContactTable.tsx
│   ├── ContactCard.tsx
│   ├── ContactFilters.tsx
│   ├── ContactSearchBar.tsx
│   ├── ContactForm.tsx
│   ├── WarmthScoreBar.tsx
│   ├── WarmthScoreBadge.tsx
│   ├── StageBadge.tsx
│   ├── ChannelButtons.tsx
│   ├── InteractionTimeline.tsx
│   ├── InteractionItem.tsx
│   ├── QuickNoteInput.tsx
│   ├── TagChip.tsx
│   ├── TagSelector.tsx
│   └── BulkActionsBar.tsx
├── hooks/
│   ├── useContacts.ts        (TanStack Query)
│   ├── useContact.ts
│   ├── useInteractions.ts
│   ├── useTags.ts
│   └── useContactFilters.ts
├── lib/
│   └── contacts/
│       ├── queries.ts        (Supabase queries)
│       ├── mutations.ts
│       ├── types.ts
│       └── constants.ts      (aşama labels, kaynak labels, vs.)
```

---

## 🔤 SABITLER (Türkçe Etiketler)

```typescript
// lib/contacts/constants.ts

export const STAGE_LABELS = {
  new: 'Yeni',
  contacted: 'İletişim Kuruldu',
  interested: 'İlgileniyor',
  presenting: 'Sunum Yapıldı',
  thinking: 'Düşünüyor',
  joined: 'Katıldı',
  lost: 'Kaybedildi',
} as const;

export const STAGE_COLORS = {
  new: 'gray',
  contacted: 'blue',
  interested: 'purple',
  presenting: 'amber',
  thinking: 'orange',
  joined: 'emerald',
  lost: 'red',
} as const;

export const SOURCE_LABELS = {
  manual: 'Manuel',
  referral: 'Tavsiye',
  social_media: 'Sosyal Medya',
  event: 'Etkinlik',
  cold_outreach: 'Soğuk Temas',
  import: 'İçe Aktarma',
  other: 'Diğer',
} as const;

export const CONTACT_TYPE_LABELS = {
  prospect: 'Aday',
  customer: 'Müşteri',
  distributor: 'Distribütör',
  lost: 'Kayıp',
} as const;

export const INTERACTION_TYPE_LABELS = {
  note: 'Not',
  call: 'Telefon',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  email: 'Email',
  sms: 'SMS',
  meeting: 'Görüşme',
  presentation: 'Sunum',
  objection: 'İtiraz',
  stage_change: 'Aşama Değişimi',
  warmth_change: 'Sıcaklık Değişimi',
  system: 'Sistem',
} as const;

export const INTERACTION_TYPE_ICONS = {
  note: 'StickyNote',
  call: 'Phone',
  whatsapp: 'MessageCircle',
  telegram: 'Send',
  email: 'Mail',
  sms: 'MessageSquare',
  meeting: 'Coffee',
  presentation: 'Presentation',
  objection: 'AlertCircle',
  stage_change: 'ArrowRight',
  warmth_change: 'Thermometer',
  system: 'Settings',
} as const;

// Warmth score etiketleri
export function getWarmthLabel(score: number): string {
  if (score >= 80) return 'Çok Sıcak';
  if (score >= 60) return 'Sıcak';
  if (score >= 40) return 'Ilık';
  if (score >= 20) return 'Soğuk';
  return 'Çok Soğuk';
}

export function getWarmthColor(score: number): string {
  if (score >= 80) return 'red';
  if (score >= 60) return 'orange';
  if (score >= 40) return 'amber';
  if (score >= 20) return 'blue';
  return 'gray';
}
```

---

## 🎨 WARMTH SCORE GÖRSELLEŞTIRMESI

Soğuk → Sıcak gradient, 5 seviye:

```
0-19   ⚪ Çok Soğuk  (gri)
20-39  🔵 Soğuk      (mavi)
40-59  🟡 Ilık       (amber)
60-79  🟠 Sıcak      (turuncu)
80-100 🔴 Çok Sıcak  (kırmızı)
```

Progress bar + sayısal skor birlikte gösterilsin.

---

## 🔍 FİLTRE & ARAMA MANTIĞI

**Arama:** `full_name`, `nickname`, `phone`, `whatsapp`, `email`, `notes` içinde ILIKE.

**Filtreler (kombine):**
- Aşama (multi-select)
- Etiket (multi-select)
- Sıcaklık aralığı (slider: min-max)
- Kaynak (multi-select)
- Kontak türü (multi-select)
- "Takip bekleyenler" (next_follow_up_at <= bugün)
- "Son 7 günde temas kurulmayanlar"
- Arşivli mi (switch)

**URL senkronizasyonu:** Filtreler URL query params'a yazılsın, paylaşılabilir olsun.

---

## ✅ GÖREV LİSTESİ

### 1. Veritabanı
- [ ] SQL şemasını Supabase'de çalıştır (tablolar + RLS + trigger)
- [ ] `supabase gen types typescript` ile tipleri yeniden üret
- [ ] Test verisi ekle (10-15 demo kontak)

### 2. Veri Katmanı
- [ ] `lib/contacts/types.ts` — TypeScript tipleri
- [ ] `lib/contacts/queries.ts` — Supabase query fonksiyonları
- [ ] `lib/contacts/mutations.ts` — CRUD mutasyonları
- [ ] `lib/contacts/constants.ts` — Sabitler (labels, colors)
- [ ] `hooks/useContacts.ts` — Liste + filtreleme
- [ ] `hooks/useContact.ts` — Tekil kontak
- [ ] `hooks/useInteractions.ts` — Interaction işlemleri
- [ ] `hooks/useTags.ts` — Etiket yönetimi

### 3. Ortak Bileşenler
- [ ] `WarmthScoreBar.tsx` — Görsel gradient bar
- [ ] `WarmthScoreBadge.tsx` — Küçük badge
- [ ] `StageBadge.tsx` — Aşama rozeti
- [ ] `ChannelButtons.tsx` — WhatsApp/tel/email butonları
- [ ] `TagChip.tsx` + `TagSelector.tsx` — Etiket UI

### 4. Kontak Listesi Sayfası
- [ ] `ContactsListPage.tsx` — Ana layout
- [ ] `ContactSearchBar.tsx` — Debounced arama
- [ ] `ContactFilters.tsx` — Filtre çubuğu
- [ ] `ContactTable.tsx` — Tablo görünümü
- [ ] `ContactCard.tsx` — Kart görünümü
- [ ] `BulkActionsBar.tsx` — Toplu işlemler
- [ ] URL query params senkronizasyonu
- [ ] Sayfalama (20'şer)
- [ ] Boş durum (empty state)

### 5. Yeni Kontak / Düzenle
- [ ] `ContactFormPage.tsx` — Form sayfası
- [ ] `ContactForm.tsx` — Form bileşeni (tab'lı)
- [ ] Zod validation
- [ ] Etiket seçici entegrasyonu
- [ ] Hata handling + toast bildirimler

### 6. Kontak Detay Sayfası
- [ ] `ContactDetailPage.tsx` — 3 sütun layout
- [ ] `InteractionTimeline.tsx` — Zaman çizelgesi
- [ ] `InteractionItem.tsx` — Tek etkileşim kartı
- [ ] `QuickNoteInput.tsx` — Hızlı not ekleme
- [ ] Interaction ekleme modal'ı (tip seçimi + form)
- [ ] Aşama değiştirme (dropdown, otomatik interaction log)

### 7. CSV Import/Export
- [ ] `ContactImportModal.tsx`
- [ ] CSV parser (papaparse veya basit split)
- [ ] Sütun eşleştirme UI
- [ ] Önizleme + içe aktarma
- [ ] Hata raporu
- [ ] Export to CSV butonu

### 8. Pano Entegrasyonu
- [ ] Dashboard'daki "Toplam Kontak" kartı gerçek veriyi göstersin
- [ ] Son eklenen 5 kontak widget'ı
- [ ] Takip bekleyen kontaklar listesi

### 9. Test & Polish
- [ ] Manuel test: ekle, düzenle, sil, filtrele, ara
- [ ] Mobile responsive kontrol
- [ ] Dark mode kontrol
- [ ] Loading states
- [ ] Error boundaries

---

## 🚀 BAŞARI KRİTERLERİ

1. ✅ SQL şeması hatasız çalıştı, tablolar ve RLS aktif
2. ✅ `/kontaklar` sayfası boş liste ile açılıyor
3. ✅ "Yeni Kontak" butonu → form açılıyor → kayıt oluyor
4. ✅ Eklenen kontak listede görünüyor
5. ✅ Arama kutusuna isim yazınca filtreleniyor
6. ✅ Filtreler (aşama, etiket) çalışıyor
7. ✅ Kontağa tıklayınca detay sayfası açılıyor
8. ✅ Detay sayfasında 360° görünüm çalışıyor
9. ✅ Hızlı not ekleme çalışıyor, timeline'a düşüyor
10. ✅ Aşama değişimi otomatik interaction oluşturuyor
11. ✅ Etiket ekleme/kaldırma çalışıyor
12. ✅ Toplu işlemler çalışıyor
13. ✅ CSV import en az 10 satırlık dosyayı içe aktarıyor
14. ✅ Warmth score doğru renk ve etikette gösteriliyor
15. ✅ Mobilde kullanılabilir

---

## 🧭 SONRAKI SEANS (Faz 2 Önizleme)

Faz 2'de:
- `nmm_pipeline_stages` (özelleştirilebilir aşamalar)
- `nmm_deals` (kontak-aşama ilişkisi + değer + olasılık)
- Kanban görünümü (drag & drop)
- Pipeline detay & analiz

---

## 💡 ÖNEMLİ NOTLAR

- **TanStack Query cache** — her mutation sonrası invalidate et
- **Optimistic updates** — hızlı UX için (özellikle tag ekleme/kaldırma)
- **Debounced search** — 300ms
- **URL params** — filtreler için `?stage=new&tag=lead`
- **Toast bildirimler** — her başarılı işlem için kısa bilgi
- **Confirm dialogs** — silme, arşivleme öncesi
- **Türkçe formatlayıcılar** — tarih için date-fns tr locale
- **Telefon formatı** — +90 prefix'i otomatik ekleyen input mask

---

## 🆘 DEMO VERİ SCRIPT'İ

Test için Supabase SQL Editor'de çalıştır (kendi `user_id`'ni kullan):

```sql
-- Önce auth.users'dan kendi id'ni al
SELECT id, email FROM auth.users WHERE email = 'SENİN_EMAIL@gmail.com';

-- Sonra aşağıdaki script'te USER_ID'yi değiştir ve çalıştır
INSERT INTO nmm_contacts (user_id, full_name, phone, whatsapp, city, occupation, source, contact_type, stage, warmth_score, notes, relationship) VALUES
  ('USER_ID', 'Ahmet Yılmaz', '+905551234567', '+905551234567', 'İstanbul', 'Mühendis', 'referral', 'prospect', 'interested', 65, 'Spor salonunda tanıştık, sağlığa önem veriyor', 'tanıdık'),
  ('USER_ID', 'Zeynep Kaya', '+905557654321', '+905557654321', 'Ankara', 'Öğretmen', 'social_media', 'prospect', 'presenting', 75, 'Instagram''dan ulaştı, ek gelir arıyor', 'tanıdık'),
  ('USER_ID', 'Mehmet Demir', '+905552345678', NULL, 'İzmir', 'Esnaf', 'manual', 'customer', 'joined', 90, 'Ürünleri çok beğendi, düzenli sipariş veriyor', 'akraba'),
  ('USER_ID', 'Ayşe Şahin', '+905553456789', '+905553456789', 'Bursa', 'Muhasebeci', 'cold_outreach', 'prospect', 'thinking', 55, 'İtirazı var: zamanı olmadığını söylüyor', 'iş arkadaşı'),
  ('USER_ID', 'Fatma Öztürk', '+905554567890', NULL, 'Antalya', 'Ev hanımı', 'referral', 'prospect', 'contacted', 40, 'Henüz derinlemesine konuşmadık', 'arkadaş'),
  ('USER_ID', 'Ali Çelik', '+905555678901', '+905555678901', 'Adana', 'Taksici', 'event', 'prospect', 'new', 30, 'Etkinlikte tanıştık, kart değiştirdik', 'tanıdık'),
  ('USER_ID', 'Elif Arslan', '+905556789012', '+905556789012', 'Konya', 'Öğrenci', 'social_media', 'prospect', 'interested', 60, 'Ek iş arıyor', 'arkadaş'),
  ('USER_ID', 'Mustafa Koç', '+905557890123', NULL, 'Gaziantep', 'Serbest', 'referral', 'distributor', 'joined', 95, 'Ekibime katıldı, aktif çalışıyor', 'arkadaş'),
  ('USER_ID', 'Selin Aydın', '+905558901234', '+905558901234', 'Eskişehir', 'Hemşire', 'manual', 'prospect', 'thinking', 50, 'Çocuklarıyla vakit geçirmek istiyor', 'tanıdık'),
  ('USER_ID', 'Burak Yıldız', '+905559012345', '+905559012345', 'Samsun', 'Pazarlamacı', 'social_media', 'prospect', 'presenting', 70, 'Kariyerinden memnun değil', 'iş arkadaşı');

-- Demo etiketler
INSERT INTO nmm_tags (user_id, name, color) VALUES
  ('USER_ID', 'VIP', 'amber'),
  ('USER_ID', 'Yakın Çevre', 'emerald'),
  ('USER_ID', 'Yeni Tanışık', 'blue'),
  ('USER_ID', 'Ürün Odaklı', 'purple'),
  ('USER_ID', 'İş Odaklı', 'orange');
```

---

**Hazır mısın? Başlayalım.** 🚀
