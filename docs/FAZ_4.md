# FAZ_4.md — AI Mesaj Üretici + Akademi & İtiraz Bankası

## 🎯 BU FAZIN AMACI

Distribütörün **en zorlandığı 3 alanı** çözmek:

1. **Doğru mesajı yazamamak** → AI Mesaj Üretici (Claude API ile kişiselleştirilmiş)
2. **İtirazları yönetememek** → İtiraz Bankası (hazır cevaplar, video, örnekler)
3. **Eğitim eksikliği** → Akademi (script, eğitim, başarı hikayeleri)

**Felsefe:** Distribütörü "satışçı" değil, **değer sağlayıcı** yapmak. AI ile üretilen mesajlar manipülatif değil, ilişki odaklı, yardım eksenli olmalı.

---

## 🧠 NETWORK MARKETING DAVRANIŞ ANALİZİ

### Distribütörün 5 Büyük Hatası

1. **Soğuk teklif (cold pitch)** — Tanışıklık kurmadan link gönderme  
2. **Spam pattern** — Aynı mesajı 50 kişiye atma  
3. **Aşırı heyecan** — "MUHTEŞEM FIRSAT!!!" tarzı abartılı dil  
4. **Erken kapatma** — İlişki kurmadan ürün/iş anlatma  
5. **Reddedilince kaybetme** — "Hayır" sonrası ilişkiyi koparmak

### Doğru Mesajın 7 İlkesi

1. **Bağlam** — Kişinin mevcut durumuna referans (çocuğu, mesleği, son konuşma)  
2. **Değer önce** — Önce ver, sonra iste  
3. **Soru sor** — Açık uçlu, düşündürücü  
4. **Acele yok** — Karar baskısı uygulama  
5. **Doğal dil** — Robot/satış konuşması değil, arkadaş tonu  
6. **Tek aksiyon** — Mesaj başına tek bir CTA  
7. **Çıkış kapısı** — "İstemiyorsan sorun değil" rahatlığı

---

## 🗄️ VERİTABANI ŞEMASI (Faz 4)

### 1. nmm_message_templates — Şablonlar

```sql
CREATE TABLE nmm_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'first_contact',      -- İlk temas
    'warm_up',            -- Bağ kurma
    'value_share',        -- Değer paylaşımı
    'invitation',         -- Davet (sunum/etkinlik)
    'follow_up',          -- Takip
    'objection_handling', -- İtiraz yönetimi
    'closing',            -- Karar aşaması
    'after_no',           -- "Hayır" sonrası
    'reactivation',       -- Tekrar bağ kurma (ölü kontak)
    'birthday',           -- Doğum günü
    'thank_you',          -- Teşekkür
    'onboarding'          -- Yeni üye karşılama
  )),
  
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN (
    'whatsapp', 'telegram', 'sms', 'email', 'instagram_dm', 'any'
  )),
  
  tone TEXT DEFAULT 'friendly' CHECK (tone IN (
    'friendly',     -- Samimi
    'professional', -- Profesyonel
    'curious',      -- Meraklandıran
    'empathetic',   -- Empatik
    'confident',    -- Kendinden emin
    'humorous'      -- Esprili
  )),
  
  language TEXT DEFAULT 'tr',
  
  content TEXT NOT NULL,           -- Şablon içeriği (değişkenlerle)
  variables TEXT[],                -- Kullanılan değişkenler: {ad}, {meslek}, vb.
  
  goal TEXT,                       -- Amacı: "İlk teması başlat"
  use_case TEXT,                   -- Ne zaman kullanılır
  
  is_ai_generated BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false, -- Ekiple paylaşıldı mı
  
  -- Performans tracking
  use_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,  -- Yanıt aldıysa +1
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nmm_templates_user ON nmm_message_templates(user_id);
CREATE INDEX idx_nmm_templates_category ON nmm_message_templates(user_id, category);

CREATE TRIGGER update_nmm_templates_updated_at
  BEFORE UPDATE ON nmm_message_templates
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();
```

### 2. nmm_ai_messages — AI ile üretilen mesajlar

```sql
CREATE TABLE nmm_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES nmm_contacts(id) ON DELETE SET NULL,
  
  prompt TEXT NOT NULL,            -- Kullanıcının verdiği bağlam
  context JSONB DEFAULT '{}',      -- Kontak profili snapshot
  
  category TEXT NOT NULL,          -- first_contact, follow_up, vb.
  channel TEXT NOT NULL,
  tone TEXT NOT NULL,
  language TEXT DEFAULT 'tr',
  
  generated_content TEXT NOT NULL, -- AI çıktısı
  variants JSONB,                  -- Alternatif versiyonlar
  
  was_used BOOLEAN DEFAULT false,
  was_edited BOOLEAN DEFAULT false,
  final_content TEXT,              -- Kullanıcı düzenledikten sonra
  
  feedback TEXT CHECK (feedback IN ('great', 'good', 'meh', 'bad', NULL)),
  
  tokens_used INTEGER,
  model TEXT DEFAULT 'claude-sonnet-4-6',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nmm_ai_messages_user ON nmm_ai_messages(user_id, created_at DESC);
CREATE INDEX idx_nmm_ai_messages_contact ON nmm_ai_messages(contact_id);
```

### 3. nmm_objections — İtiraz Bankası

```sql
CREATE TABLE nmm_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = sistem itirazı
  
  category TEXT NOT NULL CHECK (category IN (
    'money',           -- Param yok
    'time',            -- Zamanım yok
    'trust',           -- Güvenmiyorum (Ponzi/piramit)
    'family',          -- Ailem izin vermez
    'fear',            -- Satışçı olmaktan korkuyorum
    'experience',      -- Daha önce denedim, olmadı
    'product',         -- Ürüne inanmıyorum
    'company',         -- Şirkete güvenmiyorum
    'pyramid',         -- Bu piramit/saadet zinciri
    'no_network',      -- Çevrem yok
    'introvert',       -- Ben içe dönüğüm
    'employed',        -- İşim var, gerek yok
    'wait',            -- Düşüneceğim
    'other'
  )),
  
  objection_text TEXT NOT NULL,    -- "Bu Ponzi şeması mı?"
  short_label TEXT,                -- Liste için kısa etiket
  
  -- Cevap stratejisi
  response_text TEXT NOT NULL,
  response_short TEXT,             -- 1-2 cümlelik özet
  
  approach TEXT,                   -- "Empati + soru + paylaşım"
  example_dialog TEXT,             -- Gerçek konuşma örneği
  
  -- Eğitim materyali
  video_url TEXT,
  reading_url TEXT,
  
  language TEXT DEFAULT 'tr',
  is_system BOOLEAN DEFAULT false, -- Sistem itirazı (silinmez)
  is_favorite BOOLEAN DEFAULT false,
  
  use_count INTEGER DEFAULT 0,
  
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nmm_objections_category ON nmm_objections(category);
CREATE INDEX idx_nmm_objections_user ON nmm_objections(user_id);

CREATE TRIGGER update_nmm_objections_updated_at
  BEFORE UPDATE ON nmm_objections
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();
```

### 4. nmm_academy_content — Akademi İçeriği

```sql
CREATE TABLE nmm_academy_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = sistem
  
  type TEXT NOT NULL CHECK (type IN (
    'script',         -- Konuşma metni
    'lesson',         -- Eğitim
    'success_story',  -- Başarı hikayesi
    'video',          -- Video eğitim
    'article',        -- Makale
    'cheat_sheet',    -- Hızlı referans
    'role_play'       -- Senaryo
  )),
  
  category TEXT NOT NULL CHECK (category IN (
    'mindset',          -- Zihinsel hazırlık
    'prospecting',      -- Aday bulma
    'inviting',         -- Davet etme
    'presenting',       -- Sunum
    'closing',          -- Kapanış
    'follow_up',        -- Takip
    'team_building',    -- Ekip kurma
    'leadership',       -- Liderlik
    'social_media',     -- Sosyal medya
    'product_knowledge',-- Ürün bilgisi
    'company_info',     -- Şirket bilgisi
    'compliance'        -- Yasal uyum (TR mevzuatı)
  )),
  
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,                    -- Markdown
  
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

CREATE INDEX idx_nmm_academy_category ON nmm_academy_content(category, level);
CREATE INDEX idx_nmm_academy_user ON nmm_academy_content(user_id);

CREATE TRIGGER update_nmm_academy_updated_at
  BEFORE UPDATE ON nmm_academy_content
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();
```

### 5. RLS Politikaları

```sql
-- Templates: kullanıcı kendi şablonlarını yönetir + ekip şablonlarını okur
ALTER TABLE nmm_message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON nmm_message_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI messages: sadece kullanıcı kendi mesajlarını
ALTER TABLE nmm_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai messages" ON nmm_ai_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Objections: sistem itirazları herkes okur, kullanıcı kendininkini yönetir
ALTER TABLE nmm_objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read system + own objections" ON nmm_objections
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Manage own objections" ON nmm_objections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own objections" ON nmm_objections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own objections" ON nmm_objections
  FOR DELETE USING (auth.uid() = user_id);

-- Academy: aynı pattern
ALTER TABLE nmm_academy_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read system + own academy" ON nmm_academy_content
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Manage own academy" ON nmm_academy_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own academy" ON nmm_academy_content
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🤖 AI MESAJ ÜRETİCİ — ÇALIŞMA MANTIĞI

### Akış

```
1. Kullanıcı kontak detayında "AI Mesaj Üret" butonuna basar
2. Modal açılır:
   - Kategori seç (ilk temas, takip, davet, vb.)
   - Kanal seç (WhatsApp, Telegram, Email, SMS)
   - Ton seç (samimi, profesyonel, meraklandıran, vb.)
   - Ek bağlam (opsiyonel, "şu konuyu ekle" gibi)
3. AI prompt'u oluşturulur (kontak profili + ek bağlam)
4. Claude API çağrılır
5. 2-3 versiyon döner
6. Kullanıcı: kullan, düzenle, yeniden üret, beğen/beğenme
7. Kullanırsa: clipboard'a kopyala VEYA direkt WhatsApp'a yönlendir
8. nmm_ai_messages'a kaydet (öğrenme için)
```

### AI Prompt Şablonu (Backend Edge Function)

```typescript
// Supabase Edge Function: generate-message
const systemPrompt = `Sen bir network marketing distribütörünün asistanısın. 
Görevin: Distribütörün, kontağına gönderebileceği DOĞAL, SAMIMI ve İLİŞKİ ODAKLI 
mesajlar yazmak.

ASLA şunları yapma:
- Manipülatif dil kullanma
- "Hayatını değiştirecek fırsat", "kaçırma" gibi spam ifadeler
- Aşırı heyecanlı ünlem (!!!)
- Direkt satış pitch'i atma
- Linkler ekleme (kullanıcı kendi ekleyecek)
- Acelecilik baskısı yapma

HER ZAMAN şunları yap:
- Kişinin durumuna referans ver (meslek, çocuk, hobiler)
- Bağ kur, sonra konuya gel
- Soru sor, monolog yapma
- Doğal Türkçe kullan
- Çıkış kapısı bırak ("istemezsen tamamen normal")
- Mesaj başına TEK bir aksiyon hedefle
- Kanal uzunluğuna uy: WhatsApp kısa, Email uzun olabilir`;

const userPrompt = `
Kontak bilgileri:
- Ad: ${contact.full_name}
- Meslek: ${contact.occupation || 'belirtilmemiş'}
- Şehir: ${contact.city || 'belirtilmemiş'}
- İlişki: ${contact.relationship || 'tanıdık'}
- Hedefler: ${contact.goals?.join(', ') || 'bilinmiyor'}
- Sıkıntılar: ${contact.pain_points?.join(', ') || 'bilinmiyor'}
- İlgi alanları: ${contact.interests?.join(', ') || 'bilinmiyor'}
- Son etkileşim notu: ${lastInteraction?.content || 'henüz yok'}
- Mevcut aşama: ${contact.stage}
- Sıcaklık skoru: ${contact.warmth_score}/100

Görev:
- Kategori: ${category} (${categoryDescriptions[category]})
- Kanal: ${channel}
- Ton: ${tone}
- Ek bağlam: ${userInput || 'yok'}

3 farklı versiyon üret. Her versiyon farklı bir yaklaşım kullansın 
(örn: 1. soru ile başla, 2. ortak referans ile başla, 3. değer paylaşımı ile başla).

JSON formatında dön:
{
  "variants": [
    { "approach": "soru ile başlat", "message": "..." },
    { "approach": "ortak referans", "message": "..." },
    { "approach": "değer paylaşımı", "message": "..." }
  ]
}`;
```

### Edge Function (Supabase)

```typescript
// supabase/functions/generate-message/index.ts
import Anthropic from "npm:@anthropic-ai/sdk";

Deno.serve(async (req) => {
  const { contact, category, channel, tone, userInput } = await req.json();
  
  const anthropic = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
  });
  
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  
  // Parse JSON response and return
  return new Response(JSON.stringify({ ... }));
});
```

**Not:** ANTHROPIC_API_KEY Supabase secrets'e eklenecek (kullanıcı manuel).

---

## 📱 SAYFALAR & MODALLAR

### Sayfa 1: AI Mesaj Üretici Modal

**Açılış noktaları:**
- Kontak detay sayfasında "✨ AI Mesaj" butonu
- Kontak listesinde toplu mesaj
- Mesajlar sayfasında "+ Yeni AI Mesaj"

**Modal içeriği:**
- Sol: Kontak özet kartı (kim için yazıyoruz)
- Sağ: Form
  - Kategori (büyük ikonlu kartlar)
  - Kanal (WhatsApp/Telegram/Email/SMS)
  - Ton (chip seçici)
  - Ek bağlam (textarea, opsiyonel)
  - "✨ Üret" butonu
- Sonuç: 3 versiyon, tab'lı veya kart halinde
  - Her versiyonun altında: Kullan, Düzenle, Beğen/Beğenme
  - "Yeniden Üret" butonu (farklı versiyonlar için)

### Sayfa 2: Şablon Kütüphanesi — `/mesajlar/sablonlar`

- Sol: Kategori filtreleri
- Orta: Şablon kartları (grid)
- Her kart: kategori badge, başlık, içerik önizleme, kullanım sayısı
- Sağ üst: "+ Yeni Şablon", "AI ile Şablon Üret"

**Şablon detay modal:**
- İçerik
- Değişkenler ({ad}, {meslek} gibi)
- Hangi kanal/ton için
- "Bu şablonu kullan" butonu (kontak seç → mesajı doldur)

### Sayfa 3: Akademi — `/akademi`

**Layout:**
- Üst: Arama çubuğu + "Bana yardım et" AI butonu
- Sol sidebar: Kategoriler
- Orta: İçerik kartları
  - Eğitimler (lesson)
  - Scriptler (script)
  - Başarı hikayeleri (success_story)
  - Hızlı referanslar (cheat_sheet)
- Sağ: "Önerilenler" (AI personalize)

**İçerik detay:**
- Markdown render
- Video embed (varsa)
- "Tamamlandı" butonu
- "Favoriye ekle"

### Sayfa 4: İtiraz Bankası — `/akademi/itirazlar`

**Layout:**
- Üst: Arama ("Müşteri 'Ponzi şeması mı?' dedi" → arar, bulur)
- Sol: Kategori filtreleri (12 kategori)
- Orta: İtiraz kartları
  - İtiraz başlığı
  - Kategori badge
  - Kısa cevap önizleme
  - "Cevabı Gör" butonu

**İtiraz detay:**
- Tam itiraz metni
- Yaklaşım stratejisi (örn: "Empati + soru + paylaşım")
- Tam cevap
- Kısa cevap (1-2 cümle, hızlı kullanım için)
- Örnek diyalog
- Video varsa embed
- "Cevabı kopyala" + "AI ile kişiselleştir" butonları

### Sayfa 5: Mesajlar Ana Sayfa — `/mesajlar`

- Tab'lar: Üretilen Mesajlar, Şablonlar, Geçmiş
- Üretilen mesajlar: Son 50 AI çıktısı, hangi kontak için
- Filtre: kategori, ton, kanal

---

## 🧩 BİLEŞEN YAPISI

```
src/
├── pages/dashboard/
│   ├── messages/
│   │   ├── MessagesPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   └── AIMessagesPage.tsx
│   └── academy/
│       ├── AcademyPage.tsx
│       ├── AcademyContentDetailPage.tsx
│       └── ObjectionsPage.tsx
├── components/messages/
│   ├── AIMessageGeneratorModal.tsx   ⭐ ANA BİLEŞEN
│   ├── MessageVariantCard.tsx
│   ├── CategoryPicker.tsx
│   ├── ChannelPicker.tsx
│   ├── TonePicker.tsx
│   ├── TemplateCard.tsx
│   ├── TemplateForm.tsx
│   └── MessagePreview.tsx
├── components/academy/
│   ├── ContentCard.tsx
│   ├── ObjectionCard.tsx
│   ├── ObjectionDetail.tsx
│   ├── AcademyCategorySidebar.tsx
│   └── ContentMarkdown.tsx
├── hooks/
│   ├── useTemplates.ts
│   ├── useAIMessage.ts          (Edge function call)
│   ├── useObjections.ts
│   └── useAcademy.ts
├── lib/
│   ├── messages/
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── types.ts
│   │   └── prompts.ts            (AI prompt şablonları)
│   └── academy/
│       ├── queries.ts
│       ├── seedData.ts           (sistem itirazları, eğitimler)
│       └── types.ts
```

---

## 📚 SİSTEM İTİRAZ BANKASI (SEED DATA)

20 kritik itiraz, hazır cevaplarıyla. SQL seed olarak gelmeli (`user_id = NULL` = sistem).

### Örnek 5 itiraz (gerisi seed dosyasında):

```sql
INSERT INTO nmm_objections (user_id, category, objection_text, short_label, response_text, response_short, approach, example_dialog, is_system, language) VALUES

-- 1. Para yok
(NULL, 'money', 'Şu an param yok, başlayamam.', 'Param yok', 
'Anlıyorum, bu çok yaygın bir endişe. Aslında ben de aynı durumda başladım. 
Önemli olan büyük yatırım değil, küçük adımlar. Bu işin güzel yanı, başlangıçta 
ürünleri kendin kullanarak başlayabilmen — yani harcadığın para zaten ihtiyacın 
olan şeylere gidiyor. İstersen, yatırım gerektirmeden başlayabileceğin yolları 
sana göstereyim, sonra karar verirsin. Sadece bilgi, baskı yok.',
'Para gerektiren başlangıç değil, küçük ürün denemesi. Kararın senin.',
'Empati + ortak deneyim + alternatif yol + baskısız çıkış',
'A: Param yok şu an. 
B: Anlıyorum, ben de aynı yerden başladım. Aslında başlangıçta zaten kullandığın 
ürünleri seçerek girebiliyorsun. Yani harcamak değil, yönlendirmek oluyor. 
İstersen 5 dakika anlatayım, sonra "bu bana göre değil" dersen tamamen normal.', 
true, 'tr'),

-- 2. Ponzi şeması
(NULL, 'pyramid', 'Bu Ponzi şeması mı? Saadet zinciri mi?', 'Ponzi/Piramit',
'Bu çok yerinde bir soru, sormaya hakkın var. Aslında network marketing ile 
piramit/Ponzi arasında çok net farklar var. Ponzi şemasında ürün yok, sadece 
para dolaşımı var. Network marketingde ise gerçek bir ürün var, müşteriye 
satılıyor, gelir oradan geliyor. {şirket_adı} 2003''ten beri Türkiye''de yasal 
olarak faaliyette ve TİTCK denetiminden geçiyor. İstersen ürünleri sana 
göstereyim, kendin değerlendirirsin.',
'Ponzi ürünsüzdür, NM gerçek ürünle yapılır. Şirket yasaldır, denetlenir.',
'Soruya saygı + net bilgi + somut kanıt + ürün önerisi',
'A: Bu Ponzi mi yani?
B: Çok haklısın sormaya hakkın var. Ponzi''de ürün yok, sadece para dolaşır. 
Bizde gerçek ürünler var, ben bile aile için kullanıyorum. Şirket de Türkiye''de 
2003''ten beri TİTCK denetimli. İstersen göstereyim, sen karar ver.',
true, 'tr'),

-- 3. Zamanım yok
(NULL, 'time', 'Çok meşgulüm, zamanım yok bu işlere.', 'Zamanım yok',
'Tamamen anlıyorum, çoğu insan ilk başta aynı şeyi söylüyor. Ben de aynı 
durumdaydım. İşin güzel yanı, bu tam zamanlı bir iş değil — günde 1-2 saat 
ayırarak başlayabiliyorsun, kendi tempoda. Aslında zamanı olmayan insanlar 
için tasarlanmış bir sistem. Sana bir teklifim var: 15 dakikalık bir konuşma 
yapalım, sonra "bana göre değil" dersen sıfır baskı, normal devam ederiz.',
'Tam zamanlı değil, günde 1-2 saat. 15 dk dinle, sonra karar ver.',
'Empati + zaman beklentisini düşür + küçük commitment iste',
'A: Boş zamanım yok ki.
B: Anlıyorum, ben de öyle başladım. Aslında bu işin güzelliği günde 1 saat de 
yapılabilmesi. Sana 15 dakika ayır, dinle, sonra "bana göre değil" dersen tamamen 
normal.',
true, 'tr');

-- ... 17 itiraz daha
```

**Tam liste seed.sql dosyasında olacak:** 20 sistem itirazı (TR), her biri 
gerçek NM senaryolarına göre yazılmış.

---

## 🎓 SİSTEM AKADEMİ İÇERİĞİ (SEED DATA)

15 kritik içerik, sistem tarafından hazır gelir:

1. **Mindset:** "Reddedilmenin sırrı: 'Hayır' ne demek?"
2. **Prospecting:** "Soğuk listeyi nasıl oluşturursun?"
3. **Inviting:** "Davet sanatı: Tekliften önce merak"
4. **Inviting:** "WhatsApp ilk mesaj scriptleri (5 farklı senaryo)"
5. **Presenting:** "20 dakikada etkili sunum yapısı"
6. **Closing:** "Kapanışın 3 altın kuralı"
7. **Follow-up:** "48 saat kuralı: Sunum sonrası takip"
8. **Follow-up:** "'Düşüneceğim' diyene ne yazacaksın?"
9. **Team building:** "İlk 5 ekip üyeni nasıl seçersin"
10. **Leadership:** "Duplikasyon sistemi nedir?"
11. **Social media:** "Instagram'da kişisel marka kurmak"
12. **Social media:** "Sosyal medyada YAPILMAYACAKLAR"
13. **Compliance:** "Türkiye'de NM yasal çerçevesi (TİTCK)"
14. **Compliance:** "Sağlık ürünleri için söylenebilen/söylenemeyen şeyler"
15. **Mindset:** "Motivasyon düştüğünde ne yaparsın?"

---

## 🔤 İ18N ANAHTARLARI

```json
{
  "messages": {
    "title": "Mesajlar",
    "aiGenerator": "AI Mesaj Üretici",
    "templates": "Şablonlar",
    "history": "Geçmiş",
    "categories": {
      "first_contact": "İlk Temas",
      "warm_up": "Bağ Kurma",
      "value_share": "Değer Paylaşımı",
      "invitation": "Davet",
      "follow_up": "Takip",
      "objection_handling": "İtiraz Yönetimi",
      "closing": "Karar Aşaması",
      "after_no": "Hayır Sonrası",
      "reactivation": "Yeniden Bağ",
      "birthday": "Doğum Günü",
      "thank_you": "Teşekkür",
      "onboarding": "Yeni Üye Karşılama"
    },
    "tones": {
      "friendly": "Samimi",
      "professional": "Profesyonel",
      "curious": "Meraklandıran",
      "empathetic": "Empatik",
      "confident": "Kendinden Emin",
      "humorous": "Esprili"
    },
    "ai": {
      "generate": "AI ile Üret",
      "regenerate": "Yeniden Üret",
      "useThis": "Bunu Kullan",
      "edit": "Düzenle",
      "copyToClipboard": "Kopyala",
      "openInWhatsapp": "WhatsApp'ta Aç",
      "context": "Ek Bağlam (opsiyonel)",
      "contextPlaceholder": "Örn: Geçen hafta sunuma katılmıştı, şimdi takip ediyorum"
    }
  },
  "academy": {
    "title": "Akademi",
    "objections": "İtiraz Bankası",
    "scripts": "Konuşma Scriptleri",
    "lessons": "Eğitimler",
    "successStories": "Başarı Hikayeleri",
    "categories": {
      "mindset": "Zihinsel Hazırlık",
      "prospecting": "Aday Bulma",
      "inviting": "Davet Etme",
      "presenting": "Sunum",
      "closing": "Kapanış",
      "follow_up": "Takip",
      "team_building": "Ekip Kurma",
      "leadership": "Liderlik",
      "social_media": "Sosyal Medya",
      "compliance": "Yasal Uyum"
    }
  }
}
```

(EN versiyonu ayrı, aynı yapıda.)

---

## ✅ GÖREV LİSTESİ

### 1. Veritabanı
- [ ] supabase-schema-faz4.sql (4 tablo + RLS)
- [ ] seed-objections.sql (20 sistem itirazı)
- [ ] seed-academy.sql (15 sistem içeriği)
- [ ] Kullanıcı manuel çalıştıracak

### 2. Edge Function (Claude API)
- [ ] supabase/functions/generate-message/index.ts
- [ ] System prompt + user prompt yapısı
- [ ] JSON response parser
- [ ] Error handling
- [ ] **Not: ANTHROPIC_API_KEY Supabase secrets'e elle eklenecek**

### 3. Veri Katmanı
- [ ] lib/messages/ (queries, mutations, types, prompts)
- [ ] lib/academy/ (queries, seedData, types)
- [ ] hooks/useTemplates, useAIMessage, useObjections, useAcademy

### 4. AI Mesaj Üretici Modal (ANA BİLEŞEN)
- [ ] AIMessageGeneratorModal.tsx
- [ ] CategoryPicker, ChannelPicker, TonePicker
- [ ] MessageVariantCard (3 versiyon)
- [ ] Loading state (AI çağrısı süresince)
- [ ] Edit modu
- [ ] WhatsApp deep link (wa.me)
- [ ] Clipboard copy
- [ ] Feedback (beğen/beğenme)

### 5. Şablon Kütüphanesi
- [ ] TemplatesPage
- [ ] TemplateCard, TemplateForm
- [ ] Kategori filtreleme
- [ ] AI ile şablon üretme

### 6. Akademi Sayfası
- [ ] AcademyPage (kategori sidebar + content grid)
- [ ] AcademyContentDetailPage (markdown render)
- [ ] Favoriye ekleme
- [ ] Arama

### 7. İtiraz Bankası
- [ ] ObjectionsPage
- [ ] ObjectionCard, ObjectionDetail
- [ ] Arama (semantic, "Ponzi mi?" yazınca bulur)
- [ ] AI ile kişiselleştirme

### 8. Kontak Detay Entegrasyonu
- [ ] Kontak detay sayfasına "✨ AI Mesaj Üret" butonu
- [ ] Kontak detayında "İtiraz öner" (kontağın etiketleri/notlarına göre)

### 9. Sidebar Menü
- [ ] "Mesajlar" linki çalışsın (zaten var, sayfa yok)
- [ ] "Akademi" linki çalışsın (zaten var, sayfa yok)

### 10. Dashboard Entegrasyonu
- [ ] "Bu hafta üretilen AI mesaj sayısı" widget
- [ ] "Önerilen eğitim" kartı (kullanıcı seviyesine göre)

### 11. İ18N
- [ ] tr.json + en.json güncelleme

### 12. Test
- [ ] Manuel test: AI mesaj üret, kullan, kopyala
- [ ] İtiraz bankası: ara, bul, oku
- [ ] Akademi: kategoriye göre gez
- [ ] Mobile responsive
- [ ] Regression check (login, contacts, pipeline, calendar)

---

## 🚀 BAŞARI KRİTERLERİ

1. ✅ SQL şema + seed data çalıştı
2. ✅ Edge function deploy edildi (kullanıcı manuel)
3. ✅ ANTHROPIC_API_KEY secret eklendi (kullanıcı manuel)
4. ✅ Kontak detayında "AI Mesaj Üret" butonu çalışıyor
5. ✅ AI 3 farklı versiyon üretiyor
6. ✅ Üretilen mesaj WhatsApp'ta açılabiliyor
7. ✅ Şablon kütüphanesi çalışıyor
8. ✅ Akademi sayfası açılıyor, 15 sistem içeriği görünüyor
9. ✅ İtiraz Bankası açılıyor, 20 itiraz aranabiliyor
10. ✅ TR/EN i18n eksiksiz
11. ✅ Eski özellikler bozulmadı

---

## 🆘 EDGE FUNCTION DEPLOY (Kullanıcı Yapacak)

```bash
# 1. Supabase CLI kur (ilk kez)
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Proje linkle
cd network-marketing-master
supabase link --project-ref xikdoilfjggkeagiuuv

# 4. Edge function deploy
supabase functions deploy generate-message

# 5. Secret ekle (Anthropic API key)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## 💡 ÖNEMLİ NOTLAR

- AI mesajları kullanıcıya manipülatif gelmemeli — sade, samimi, gerçek
- Edge function'da rate limiting önemli (Supabase free tier sınırlı)
- AI çıktıları her zaman editable olmalı, kullanıcı son sözü
- Şablonlar zamanla kullanıcı bazlı öğrenmeli (success_count tracking)
- Akademi içeriği Türkiye'ye özel: TİTCK, vergi, GreenLeaf gibi şirket bilgisi
- İtiraz bankasında "yasal" ifadeler kullanırken dikkat (sağlık iddiaları yok)

---

**Aktif Faz:** Faz 4 — AI Mesaj + Akademi
