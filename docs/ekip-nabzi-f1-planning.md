# Ekip Nabzı — Planlama Paketi (v2 — kararlar kilitli)

> **Durum:** Planlama — **onay bekleniyor**, kod yok.  
> **v2:** Ürün sahibi cevapları + harici araştırma raporu sentezlendi (2026-06-01).

---

## v2 — Kilitli ürün kararları

| # | Karar |
|---|--------|
| 1 | **Yerleşim:** Ayrı sayfa yok → `/istatistikler` içinde, sayfanın **en altında** (veya ekip tablosundan sonra) **「Ekip Nabzı」** bölümü. |
| 2 | **Lider detay:** F1’de yalnızca **% + özet sayılar + uyarı rozetleri**; madde adı listesi F2 sheet. |
| 3 | **Randevu:** `next_follow_up_at` takvime işlendi = **randevu alındı**; tamamlanma = kullanıcı **「Tamamla」** veya o adayda **call/whatsapp** aksiyonu (otomatik gece yok, varsayılan). |
| 4 | **Video:** F3; ara dönem **YouTube embed** + manuel/iframe ilerleme (API anahtarı üretici değil, Google embed API). |
| 5 | **Lisans:** **「Benim nabzım」** tüm giriş yapmış kullanıcılar; **「Ekip nabzı」tablosu yalnızca Pro** (+ süper admin). Landing + ödeme Pro kartına madde eklenir. Plus’a ekip nabzı **açılmaz** (gerekçe aşağıda). |

---

## 1. F1 kapsam özeti (hatırlatma)

F1, sosyal medyadaki “team pulse” demosunun **~%60–70**’ini hedefler: mevcut veriyi birleştirir, yeni video / olay tablosu **F2+**’ya kalır.

| F1’de var | F1’de yok (sonraki faz) |
|-----------|-------------------------|
| Eğitim % (30 madde) | Video izleme / saniye |
| İtiraz % (34 madde) | `learning_events` tablosu |
| Favori sayıları (özet) | Madde bazlı “ne zaman okudu” |
| Onboarding % (9 adım) | Sunum materyali gönderim sayacı |
| Saha: aday sayıları, son aktivite | Randevu sayacı (tanım gerekli) |
| Dönem: Bugün / 7g / 30g / Yıl | Platform kohort (süper admin) |
| Lider → doğrudan downline | Gerçek zamanlı WebSocket |

**Lisans (v2):** Yeni `hasTeamPulseAccess()` → **yalnızca `pro`** (+ `isSuperAdmin`). Plus (`master`) mevcut ekip tablosunu kullanmaya devam eder; **öğrenme nabzı tablosu** Pro upsell. Basic/Leader: yalnızca kendi özet kartları.

**Yerleşim (kilitli):** `IstatistiklerContent` içinde `TeamPerformanceTable` sonrası → `PulseSection` bileşeni (nav’da yeni menü yok).

---

## 2. Kullanıcı hikâyeleri (F1)

Format: **As a / I want / So that** + kabul kriterleri (Given-When-Then).

### 2.1 Dağıtıcı (kendi ilerlemesi)

#### US-D1 — Kendi öğrenme özeti
**As a** dağıtıcı  
**I want** tek ekranda eğitim ve itiraz ilerlememi görmek  
**So that** ne eksik kaldığını bilip tamamlayabileyim.

**Kabul kriterleri:**
- Given giriş yapmış kullanıcı, When `/ekip-nabzi` “Benim” sekmesine girer, Then eğitim **X/30** ve itiraz **Y/34** sayıları görünür.
- And favori eğitim / favori itiraz sayıları ayrı mini KPI olarak gösterilir.
- And yüzdeler yuvarlanmış tam sayıdır (ör. %67).
- And veri kaynağı `nmm_user_progress` + mevcut `useProgressSync` ile uyumludur (kendi satırım).

#### US-D2 — Onboarding hizası
**As a** yeni dağıtıcı  
**I want** 4 haftalık checklist ilerlememin nabız ekranında görünmesini  
**So that** sponsorumla aynı dili konuşabileyim.

**Kabul kriterleri:**
- Given onboarding kayıtlarım var, When “Benim” sekmesine bakarım, Then **9 adımdan kaçını** tamamladığım (ör. 4/9) ve yüzde çubuğu görünür.
- And tamamlanan adımlar Ekip sayfasındaki checklist ile aynı `step_id` listesinden gelir.

#### US-D3 — Dönem filtresi (sınırlı)
**As a** dağıtıcı  
**I want** saha metriklerinde dönem seçebilmek  
**So that** “bu hafta ne yaptım” sorusuna cevap alabileyim.

**Kabul kriterleri:**
- Given “Benim” sekmesi, When **7 gün** seçerim, Then yalnızca **saha KPI’ları** (yeni aday, aşama geçişi, arama/WA sayısı — `nmm_daily_actions` üzerinden) filtrelenir.
- And eğitim/itiraz % **dönemden bağımsız** “tüm zamanlar” kalır (F1’de `user_progress` zaman damgası yok — bilinçli sınırlama; UI’da “Tüm zamanlar” etiketi).

---

### 2.2 Lider (doğrudan downline)

#### US-L1 — Ekip nabız tablosu
**As a** workspace lideri (Master/Pro)  
**I want** doğrudan ekibimin öğrenme + saha özetini tek tabloda görmek  
**So that** kime koçluk yapacağımı hızlı seçebileyim.

**Kabul kriterleri:**
- Given Pro/Master lisans ve en az bir downline, When “Ekibim” sekmesine girerim, Then her üye için bir satır: ad, eğitim %, itiraz %, onboarding %, toplam aday, sunum aşaması sayısı, son aktivite.
- And sıralama varsayılan: en düşük eğitim % veya en uzun süredir inaktif (TBD — ürün tercihi).
- And downline olmayan lider boş durum mesajı görür.
- And Basic/free lider kilit overlay + plan yükseltme linki görür (`hasTeamPageAccess`).

#### US-L2 — Downline öğrenme verisi (F1 seviyesi)
**As a** lider  
**I want** ekibimin eğitim/itiraz tamamlama oranlarını görmek  
**So that** “itiraz modülü” onboarding adımını işaretleyip okumayanları fark edeyim.

**Kabul kriterleri:**
- Given downline üyesi U, When tabloda U satırına bakarım, Then eğitim % = `read_trainings.length / 30` (kanonik madde sayısı sabit F1).
- And itiraz % = `read_objections.length / 34`.
- And **madde adı listesi F1’de gösterilmez** (yalnızca % — karar 2’ye bağlı genişleme).
- And RLS: yalnızca `parent_id = auth.uid()` olan workspace owner’larının progress satırları okunabilir.

#### US-L3 — Satıra tıklayınca mevcut akış
**As a** lider  
**I want** üye satırından mevcut ekip detayına gitmek  
**So that** nabız → aksiyon kopuk olmasın.

**Kabul kriterleri:**
- Given uygulama kullanıcısı downline, When satıra tıklarım, Then `/pipeline/[id]` veya mevcut ekip detay URL’sine giderim (bugünkü `TeamPerformanceTable` davranışı ile aynı).
- And saha dışı partner (NMM kullanıcısı değil) satırı tıklanamaz veya pipeline’a gitmez.

#### US-L4 — “Dikkat gerektirir” rozeti (kural tabanlı)
**As a** lider  
**I want** riskli üyelerin satırında görsel uyarı  
**So that** önce onlara odaklanayım.

**Kabul kriterleri (F1 basit kurallar):**
- When eğitim % &lt; 20 **ve** katılım &gt; 14 gün önce, Then satırda “Eğitime başlamadı” rozeti.
- When son aktivite &gt; 7 gün, Then “İnaktif” rozeti (mevcut ekip koçu mantığı ile uyumlu).
- When onboarding’de `step_objections` tamam ama itiraz % = 0, Then “İtiraz modülü eksik” rozeti.

---

### 2.3 Süper admin (platform — F1 minimal)

#### US-SA1 — Kendi workspace’i gerçek veri
**As a** süper admin (Focus Team lideri)  
**I want** kendi ekibimde diğer liderlerle aynı nabız ekranını kullanmak  
**So that** ayrı “test” modu olmasın (CLAUDE.md dualite kuralı).

**Kabul kriterleri:**
- Given süper admin kendi workspace’inde, When Ekibim sekmesi, Then gerçek aday/onboarding/progress verisi; sahte veya sabit demo yok.

#### US-SA2 — Platform özeti yok (F1)
**As a** süper admin  
**I want** F1’de platform geneli kohort görmeyi  
**So that** — **F1 kapsam dışı**; yalnızca mevcut Platform Yönetimi + İstatistikler SA bölümleri kalır.

**Not:** US-SA2 bilinçli olarak **F4**’e ertelendi; F1 PRD’sinde “won’t have” olarak işaretlendi.

---

### 2.4 Teknik / sistem

#### US-T1 — Performans
**As a** kullanıcı  
**I want** nabız sayfasının 2 sn altında açılması  
**So that** günlük kontrol rahatsız etmesin.

**Kabul kriterleri:**
- Given 20 downline, When sayfa açılır, Then tek RPC veya birleşik server action (mevcut `fetch_team_bundle` genişletmesi tercih edilir).
- And N+1 sorgu yok (üye başına ayrı progress çağrısı yapılmaz).

#### US-T2 — Gizlilik
**As a** downline üyesi  
**I want** liderimin aday notlarımı nabızda görmemesini  
**So that** güvenim korunsun.

**Kabul kriterleri:**
- Nabızda yalnızca **sayısal özet** ve %; aday isimleri downline pipeline RLS ile sınırlı (lider zaten aday sayarını görüyor — mevcut davranış).
- And `nmm_user_progress` için yeni policy yalnızca **SELECT**, INSERT/UPDATE yalnızca kendi `user_id`.

#### US-T3 — i18n
**As a** İngilizce kullanıcı  
**I want** tüm nabız etiketlerinin çevrilmiş olmasını  
**So that** `t('pulse.*')` kullanılsın; bileşende `lang ===` dallanması olmasın.

---

## 3. Wireframe metni

Aşağıdaki metin, geliştiriciye veya tasarımcıya “ekran böyle davranır” diye aktarılacak **düşük sadakat** wireframe’dir (piksel tasarım değil).

### 3.1 Bilgi mimarisi

```
Dashboard
├── … (mevcut)
├── İstatistikler          ← aday hunı (mevcut)
├── Ekibim                 ← onboarding checklist (mevcut)
└── Ekip Nabzı  [YENİ]     ← F1: öğrenme + saha birleşik
    ├── Sekme: Benim
    └── Sekme: Ekibim (lider+, lisans kilitli değilse)
```

**Navigasyon önerisi:** Sidebar’da “Ekip Nabzı” — ikon: `Activity` veya `Gauge`. Master/Pro’da her zaman; Basic’de tıklanınca upgrade gate.

---

### 3.2 Ekran: `/ekip-nabzi` — üst bölüm (her iki sekme)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Ekip Nabzı                                                              │
│  Öğrenme ve saha özetin — ekibini desteklemek için                       │
├──────────────────────────────────────────────────────────────────────────┤
│  [ Benim ]  [ Ekibim ]          Dönem: ( Bugün | 7 gün | 30 gün | Bu yıl )│
└──────────────────────────────────────────────────────────────────────────┘
```

- **Dönem filtresi:** Sadece saha KPI kartlarını etkiler (US-D3).
- Sekme “Ekibim” yalnızca lider rolünde ve `hasTeamPageAccess` true ise aktif; değilse disabled + kilit tooltip.

---

### 3.3 Sekme: Benim

```
┌─ Öğrenme (tüm zamanlar) ────────────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Eğitim      │ │ İtirazlar   │ │ Favori      │ │ Favori      │          │
│  │ 18 / 30     │ │ 12 / 34     │ │ eğitim: 3   │ │ itiraz: 2   │          │
│  │ ██████░░ 60%│ │ ████░░░ 35% │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│  Alt not: "Okuma ilerlemesi anlık senkronize edilir." (küçük, text-3)     │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Doğru Başlangıç ────────────────────────────────────────────────────────┐
│  4 / 9 adım  ████████░░░░  44%                                            │
│  [ Ekip sayfasında checklist'i aç → ]  (link /ekip)                     │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Saha aktivitesi (dönem: Son 7 gün) ──────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ Yeni     │ │ Sunum    │ │ Arama    │ │ WhatsApp │                      │
│  │ aday: 2  │ │ aşama:1 │ │ : 4      │ │ : 6      │                      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobil:** KPI kartları 2×2 grid; tablo yok.

---

### 3.4 Sekme: Ekibim (lider)

```
┌─ Ekip özeti ─────────────────────────────────────────────────────────────┐
│  Aktif (7g): 3/5    Ort. eğitim: %42    Ort. itiraz: %28                 │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Tablo (yatay kaydırma, TeamPerformanceTable stili) ─────────────────────┐
│ Ortak │ Eğitim │ İtiraz │ DQSG │ Aday │ Sunum │ Takip │ Son aktivite      │
│───────┼────────┼────────┼──────┼──────┼───────┼───────┼──────────────────│
│ Ayşe  │ 80%    │ 50%    │ 78%  │ 12   │ 3     │ 2     │ 2 saat önce       │
│ ⚠ İnaktif                                                                 │
│ Mehmet│ 10%    │ 0%     │ 22%  │ 4    │ 0     │ 1     │ 9 gün önce        │
│ ⚠ Eğitime başlamadı · ⚠ İtiraz modülü eksik                               │
└──────────────────────────────────────────────────────────────────────────┘

Satır tıklama → mevcut pipeline / üye detay (US-L3).

Boş durum: "Henüz doğrudan ekip üyeniz yok. Davet kodu ile ekleyin." + /ekip linki.

Kilit (Basic): FeatureUpgradeGate — "Master veya Pro ile ekip nabzını açın."
```

**Drill-down (F1 hayır / F2 evet):** Satıra tıklayınca alttan sheet: “Hangi eğitimler okunmadı?” — karar 2’ye bağlı.

---

### 3.5 Bileşen yeniden kullanımı

| Wireframe parçası | Mevcut kod referansı |
|-------------------|----------------------|
| Dönem pill | `IstatistiklerContent` period selector |
| Ekip tablosu | `TeamPerformanceTable` + yeni sütunlar |
| Lisans kilidi | `FeatureUpgradeGate` / `teamStatsLocked` |
| Progress sayıları | `useProgressSync` + server aggregate |

---

## 4. Migration taslağı

> **Dosya adı önerisi:** `039_team_pulse_f1.sql`  
> **Uygulama:** Onay sonrası; `database.types.ts` güncellenir.

### 4.1 F1 — Zorunlu: Lider read policy (`nmm_user_progress`)

```sql
-- 039_team_pulse_f1.sql (TASLAK — uygulanmadı)

-- Lider, doğrudan downline'ların öğrenme özetini okuyabilir (SELECT only).
DROP POLICY IF EXISTS "nmm_progress_read_downlines" ON public.nmm_user_progress;
CREATE POLICY "nmm_progress_read_downlines" ON public.nmm_user_progress
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT w.owner_id
      FROM public.nmm_workspaces w
      WHERE w.parent_id = auth.uid()
        AND w.owner_id IS NOT NULL
    )
  );

COMMENT ON POLICY "nmm_progress_read_downlines" ON public.nmm_user_progress IS
  'Sponsor reads direct downline training/objection progress (F1 Ekip Nabzı).';
```

**Not:** INSERT/UPDATE yalnızca mevcut `"own progress"` policy ile kalır.

---

### 4.2 F1 — Önerilen: Birleşik RPC (performans)

Mevcut `nmm_fetch_team_bundle` genişletmesi veya yeni fonksiyon:

```sql
-- Örnek imza (TASLAK)
CREATE OR REPLACE FUNCTION public.nmm_fetch_team_pulse(
  p_workspace_id uuid,
  p_period_start timestamptz DEFAULT (now() - interval '30 days')
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Pseudocode:
-- 1) Yetki: workspace owner veya member; lider downline için parent_id kontrolü
-- 2) Üye listesi (mevcut team bundle ile aynı dedup)
-- 3) Her user_id için:
--    - jsonb_array_length(read_trainings), fav_trainings, read_objections, fav_objections
--    - onboarding step count / 9
--    - candidate stage counts (period-filtered created_at / actions)
--    - last_activity_at, period action counts (call, whatsapp, stage_change sunum)
-- 4) jsonb_agg satırlar
$$;
```

**Güvenlik:** `SECURITY DEFINER` + içeride `auth.uid()` workspace üyeliği doğrulaması (020/025 migration’larındaki kalıp).

**Alternatif (daha az iş):** F1’de RPC yok — server action’da mevcut team members + batch `nmm_user_progress` `.in('user_id', ids)`; 20 üyeye kadar yeterli.

---

### 4.3 F1 — Opsiyonel: Sabit içerik sayıları

```sql
-- Platform sabitleri; ileride admin panelden değişebilir
-- Şimdilik app layer'da const TRAINING_COUNT = 30, OBJECTION_COUNT = 34 yeterli.
-- DB'ye taşımak F4.
```

---

### 4.4 F2+ için ertelenmiş şema (referans — F1’de UYGULANMAZ)

```sql
-- ─── F2: learning_events ───
CREATE TABLE public.nmm_learning_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  uuid REFERENCES public.nmm_workspaces(id) ON DELETE SET NULL,
  content_type  text NOT NULL CHECK (content_type IN ('training', 'objection', 'video')),
  content_id    text NOT NULL,
  event         text NOT NULL CHECK (event IN (
    'open', 'complete', 'favorite', 'unfavorite', 'video_progress'
  )),
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_events_user_day
  ON public.nmm_learning_events (user_id, created_at DESC);

-- ─── F2: engagement events (sunum materyali tıklama vb.) ───
-- nmm_daily_actions genişletmesi VEYA ayrı nmm_engagement_events

-- ─── F3: video_progress payload örneği ───
-- {"position_sec": 142, "duration_sec": 600, "percent": 24}

-- ─── F4: günlük rollup ───
CREATE TABLE public.nmm_team_pulse_daily (
  user_id uuid NOT NULL,
  day date NOT NULL,
  metrics jsonb NOT NULL,
  PRIMARY KEY (user_id, day)
);
```

---

## 5. API / uygulama katmanı (F1 taslak — kod değil)

```
src/app/(dashboard)/ekip-nabzi/
  page.tsx
  actions.ts          ← getMyPulseAction, getTeamPulseAction
  _components/
    PulsePage.tsx
    PulseMyTab.tsx
    PulseTeamTab.tsx
    PulseKpiGrid.tsx
    PulseTeamTable.tsx
```

**Server action kuralları:** Supabase yalnızca `actions.ts`; `.tsx` içinde client yok (AGENTS.md).

**Çeviri bölümü:** `src/lib/translations/sections/pulse.ts` → `tr.ts` / `en.ts` export.

---

## 6. Kararlar — yanıtlandı (v2)

Bkz. üst tablo. Plus vs Pro gerekçesi: Bölüm 10.

---

## 9. Harici rapor ile sentez (2026-06-01)

### Ortak (zaten uyumlu — uygulanacak)
- Altyapının ~%60’ı hazır (`nmm_user_progress`, onboarding, team RPC, bildirimler).
- `nmm_learning_events` append-only (F2) — trend ve dönem filtreleri için şart.
- Video için `nmm_video_progress` (F3).
- Sunum gönderimi / randevu için olay log (F2).
- F1’de **polling** (TanStack `staleTime` ~30s), Realtime F5.
- İstatistikler sayfasına gömme (ürün sahibi + harici rapor).

### Harici rapordan ithal edilenler
- **KVKK / şeffaflık:** Üyeye “Liderin, eğitim ilerlemeni ve özet saha metriklerini görebilir” bilgisi (ayarlar veya nabız üstü not).
- **Gösterim granülaritesi:** Lidere saniye-saniye değil % / tamamlandı / son aktivite.
- **Streak + kişisel hedef** (F2), leaderboard değil.
- **Modül bitince lidere bildirim** (F2, mevcut `nmm_notifications`).
- **AI haftalık özet / risk uyarısı** (F4, cron + rollup).

### Bilinçli olarak alınmayan / ertelenen
- Ayrı “Gelişim Nabzı” mega menü.
- F1’de Realtime.
- Leaderboard / rekabetçi sıralama (kültürünüze aykırı).
- Plus’a tam ekip nabzı (Pro upsell — aşağıda).

### Randevu tamamlanma (teknik öneri — onaylı çizgi)
1. **Sayılır (appointment_set):** Aday için `next_follow_up_at` kullanıcı tarafından set edildiğinde (pipeline tarih, takvim ertele, toplu ertele).
2. **Sayılmaz:** Yalnızca aşama formülünden otomatik hesaplanan takip günü (opsiyonel: ayrı KPI “planlı takip”).
3. **Tamamlandı (appointment_done):** Takvimde **Tamamla** veya randevu gününde/sonrasında `call` / `whatsapp` daily_action.
4. **Otomatik gece tamamlama:** Varsayılan **kapalı**; ileride `notification_preferences` altında opt-in.

---

## 10. Plus’a açılmalı mı? (Öneri: Hayır — sadece Pro)

| | Plus (`master`) | Pro |
|---|-----------------|-----|
| Zaten var | Alt ekip (max 50), onboarding bildirimleri, ekip performans **tablosu** (aday aşamaları) | Sınırsız ekip, daha yüksek AI kotası |
| Ekip Nabzı ekler | — | Eğitim/itiraz %, favori, DQSG, randevu/materyal (F2), koçluk rozetleri |
| Upgrade hikâyesi | “Ekibimin **öğrenme ve disiplin** nabzını görmek istiyorum” → Pro | |

Plus kullanıcısı ekip tablosunda kalmaya devam eder; nabız bölümünde **Pro’ya yükselt** kartı görür. Basic/Leader yalnızca **kendi** özet kartlarını görür.

---

## 11. Video (YouTube, API yok) — teknik yol

1. **F3 öncesi:** Eğitim modülünde harici link / embed alanı; her video için sabit `video_key` (YouTube ID).
2. **Embed:** `youtube-nocookie.com/embed/{id}` — KVKK için daha iyi; creator API gerekmez.
3. **İlerleme (API olmadan):** “İzlemeye başladım” / “Tamamladım” + isteğe bağlı süre kutusu; olay `nmm_learning_events`.
4. **İlerleme (API ile, opsiyonel):** Uygulama sahibi **Google Cloud YouTube Data API** veya **IFrame Player API** anahtarı (içerik üreticisinin değil) → `onStateChange` ile yaklaşık %; F3.1.
5. **Uzun vadede:** İzinli içerikleri Supabase Storage / Bunny’e kopyalayıp tam kontrol (üretici izni varsa).

---

## 12. Sinerjik aksiyon planı (onay sonrası)

### Faz 1 — Uygulama paketi (ilk PR, ~1 sprint)
- [ ] `039_team_pulse_f1.sql` — downline SELECT `nmm_user_progress`
- [ ] `hasTeamPulseAccess(license, isSuperAdmin)` → yalnızca `pro`
- [ ] `istatistikler/_components/PulseSection.tsx` — Benim KPI + (Pro) Ekip tablosu
- [ ] Server action: `getPulseSummaryAction(workspaceId, period)`
- [ ] i18n `pulse.*` + landing `planProFeat*` + ödeme sayfası Pro maddesi
- [ ] Üst bilgi metni: lider görünürlüğü şeffaflığı (1 cümle)
- [ ] Pro olmayan lider: `FeatureUpgradeGate` (Pro plana yönlendir)

**F1 bilinçli dışı:** `learning_events`, randevu/materyal sayacı, video, AI özet.

### Faz 2 — Olay log + metrikler (2. PR)
- [ ] `040_learning_events.sql`
- [ ] `appointment_set` / `appointment_done` / `presentation_sent` loglama
- [ ] Dönem: Bugün | 7g | 30g | Yıl (öğrenme trendleri dahil)
- [ ] Streak, modül tamamlanınca sponsor bildirimi

### Faz 3 — Video
- [ ] Embed + `nmm_video_progress` + drop-off özeti (agrega)

### Faz 4 — AI nabız özeti (cron)

### Faz 5 — Realtime (yalnızca ihtiyaç halinde)

---

## 7. F1 teslim checklist (güncel)

- [ ] Migration 039
- [ ] `PulseSection` → İstatistikler (nav yok)
- [ ] Benim özet: tüm kullanıcılar
- [ ] Ekip tablosu: Pro + SA; Plus/Basic gate
- [ ] Landing + ödeme Pro feature satırı
- [ ] i18n TR/EN
- [ ] `hot.md` + commit

---

## 8. Terimler sözlüğü (önceki rapordaki teknik kelimeler)

| Terim | Anlamı (bu projede) |
|-------|---------------------|
| **LXP / LMS** | Öğrenme deneyimi platformu; bizde Eğitim + İtirazlar + (gelecek) video |
| **Downline** | `nmm_workspaces.parent_id` = sponsorun `user_id` olan doğrudan alt ekip |
| **RLS** | Supabase satır güvenliği — kim hangi satırı okuyabilir |
| **RPC** | Veritabanında tek çağrıyla ekip verisini toplayan fonksiyon |
| **KPI** | Tek sayı özet kartı (ör. 18/30 eğitim) |
| **DQSG** | 9 adımlı “Doğru Başlangıç” onboarding checklist |
| **Olay (event)** | “Materyal gönder’e tıklandı” gibi tek seferlik kayıt (F2) |
| **Rollup** | Günlük özet tablo — ham olayları her seferinde saymamak için (F4) |

---

*Belge sürümü: 2026-06-01 — F1 planlama paketi v1*
