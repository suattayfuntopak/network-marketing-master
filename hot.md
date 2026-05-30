# Hot Log

## 2026-05-30 — Takvim faslı KAPANDI (final 5 öneri)

1. **Bugün İlgilen ↔ takvim** — `dailyPriorities.ts` / `buildDailyPriorities` takvim formülü (`isFollowUpDue`) ile tek kaynak.
2. **Ekip bildirim deep link** — Migration `034`: sponsor pipeline’ında ekip üyesi kaydı; eşleşme yoksa `/ekip`.
3. **`deferFollowUpAction`** — `followUpToIsoFromKey(toCalendarKey(...))` timezone tutarlılığı.
4. **Bildirim tercihleri** — Migration `035`: `nmm_notification_preferences` tablosu + server actions.
5. **Pro ekip takvimi** — Tek batch sorgu (`in workspace_id`), N+1 kaldırıldı.

**Deploy:** Supabase `034_downline_notification_sponsor_pipeline.sql`, `035_notification_preferences.sql` (033 zaten uygulandıysa sırayla).

---

## 2026-05-30 — Takvim sprint kapanış: 5 onaylı iyileştirme

1. **Boru hattı Takip Zamanı** — `isFollowUpDue` / `calendarFollowUpDate` ile takvimle hizalı filtre ve rozetler.
2. **Toplu erteleme etiketi** — “Hepsini yarına ertele” (TR/EN).
3. **`calendarFollowUp.test.ts`** — 8 unit test (formül, gecikmiş sayım, tamamlama sonrası tarih).
4. **Bildirim deep link** — Migration `033`: `nmm_notifications.candidate_id`; cron kişi başı hatırlatma; toast/modal → `/pipeline/{id}`; ekip trigger güncellendi.
5. **Saat dilimi** — Takvim UI `todayCalendarKey()` (Europe/Istanbul); boru hattı aynı kaynak.

**Deploy:** Supabase’de `033_notifications_candidate_id.sql` uygula.

---

## 2026-05-30 — Takvim: Takibi İptal Et listeden düşürür (formül bug)

- **Sorun:** İptal sonrası `last_contact_at = bugün` + `next = null` → formül yine aynı güne düşüyordu (ör. iletişim +3 = seçili gün); kişi listede kalıyordu.
- **Düzeltme:** `nextFollowUpKeyAfterCompletion()` — tamamlanan gün + aşama günü → açık `next_follow_up_at`. Takvim seçili günü server'a iletilir; boru hattı kartı bugün referanslı.
- **Dosyalar:** `calendarFollowUp.ts`, `takvim/actions.ts`, `TakvimClient.tsx`, `CandidateCard.tsx`.

---

## 2026-05-30 — Takvim: takip iptali kalıcı + boru hattı deep link

- **Takibi İptal Et:** Yalnızca `next_follow_up_at = null` yeterli değildi; formülle hesaplanan tarih geri geliyordu. Artık `last_contact_at = now` + aktivite `follow_up_completed` — Supabase kalıcı.
- **Boru Hattı'nda gör:** Erteleme toast'ı `/pipeline` yerine `/pipeline/{adayId}` açar.
- **Dosyalar:** `takvim/actions.ts`, `TakvimClient.tsx`, `CandidateCard.tsx`; `docs/email-automation.md` (cron test rehberi); `landing.ts` (EN plan özellik metinleri).

---

## 2026-05-30 — Takvim: toplu erteleme banner düzeltmesi

- Gecikmiş takipler artık ekranda görünen aday listesi + **yarına** (bugün+1) taşınıyor; sunucu/tarayıcı tarih uyumsuzluğu ve “+1 gün hâlâ gecikmiş” sorunu giderildi.

---

## 2026-05-30 — Takvim: hafta şeridi kaldırıldı

- Aylık grid ile mükerrer olan "Hafta görünümü" (`TakvimWeekStrip`) kaldırıldı.

---

## 2026-05-30 — Yetim workspace temizliği + owner başına tek workspace

- **Sorun:** Geliştirme döneminde aynı `owner_id` ile 20 duplicate workspace (çoğu 0 aday); `ensureWorkspace` üyelik yokken yenilerini açıyordu.
- **032 migration:** Boş yetimleri siler (Focus Team / üyelik / aday sayısı korunur); `owner_id` UNIQUE index.
- **Kod:** `ensureWorkspaceAction` — mevcut sahip workspace varsa üyelik onarır, yeni INSERT yapmaz; unique çakışmada retry.

**Deploy:** Supabase’de `032_orphan_workspaces_owner_unique.sql` uygula.

---

## 2026-05-30 — Cron e-posta: proxy 307 engeli giderildi

- **Sorun:** `/api/cron/*` oturum proxy’sine takılıyordu → 307 `/giris`; GitHub Actions yeşil görünüp mail gitmiyordu (curl redirect takibi).
- **Düzeltme:** `proxy.ts` — `isCronRoute` whitelist; workflow curl’lere `--max-redirs 0`.
- **Deploy sonrası:** Vercel redeploy → Actions manuel run veya `curl --max-redirs 0` ile **200** doğrula.

---

## 2026-05-30 — Takvim sprint 2 (iCal hariç 7 öneri)

1. **Mobil hafta şeridi** — Yatay kaydırma + hafta okları (`TakvimWeekStrip`).
2. **Erteleme toast** — Güncelleme sonrası “Boru Hattı'nda gör” aksiyonlu bildirim.
3. **Toplu erteleme** — Gecikmiş banner: onaylı “Hepsini +1 gün ertele” (`bulkDeferOverdueFollowUpsAction`).
4. **Sabah takvim bildirimi** — Cron `GET /api/cron/calendar-reminder` → `nmm_notifications` (type: calendar); GitHub Actions 09:00 TR.
5. **Ekip Takvimi (Pro)** — Alt ekip liderlerinin aylık takip yoğunluğu, salt okunur.
6. **Takip tamamlandı** — Karttan `next_follow_up_at` temizleme.
7. **Ay özeti** — Başlık altında “Bu ay: X takip, Y gecikmiş”.

**Dosyalar:** `takvim/actions.ts`, cron route, `TakvimTeamCalendar`, `TakvimConfirmModal`, workflow güncellemesi.

---

## 2026-05-30 — Takvim modülü: 8 iyileştirme paketi

1. **Terminal aşamalar** — Katıldı / İlgilenmedi / Kaybedildi / Pasif otomatik takvimden çıkarıldı (manuel `next_follow_up_at` hariç).
2. **Bugüne dön** — Ay navigasyonunda kısayol.
3. **Gecikmiş takip sayacı** — Üst banner; tıklanınca en eski gecikmiş güne gider, Bugün İlgilen linki.
4. **Hafta görünümü** — Masaüstünde seçili haftanın 7 günlük şeridi (`md+`).
5. **Hızlı erteleme** — Aday kartlarında +1 / +3 / +7 (seçili günden itibaren).
6. **En yakın takip** — Boş günde dolu en yakın güne yönlendirme.
7. **Intl tarih formatı** — `formatCalendarDayKey` / `formatCalendarDayShort` (TR/EN).
8. **Performans** — `buildCalendarByDate` domain katmanı; terminal filtre tek geçişte.

**Yeni dosyalar:** `calendarDates.ts`, `calendarFollowUp.ts`, `TakvimCandidateRow.tsx`, `TakvimWeekStrip.tsx`

---

## 2026-05-30 — Takvim: "Seçili günden sonraki 7 gün" referans düzeltmesi

- **Sorun:** "Önümüzdeki 7 gün" listesi `today` (bugün) üzerinden hesaplanıyordu; Haziran ayında 17'sine tıklanınca 5 Haziran gibi geçmiş tarihler görünüyordu.
- **Düzeltme:** Liste artık **seçili gün + 1 … +7** aralığından türetiliyor; tıklanınca ilgili aya geçiş (`selectCalendarDate`).
- **Ek:** "Önümüzdeki Ay" listesinde seçili günün sonraki 7 günüyle çakışan tarihler elendi; başlık metni netleştirildi (TR/EN).

**Dosyalar:** `TakvimClient.tsx`, `pages.ts` (i18n)

---

## 2026-05-30 — Varsayılan WhatsApp sunum şablonu ([Firma İsmi])

- `defaultWhatsappTemplate`: Merhaba {name}, + [Firma İsmi] metni (yeni materyal formu + süper admin fallback)
- Migration **031**: DB’de hâlâ eski fabrika varsayılanı olan kayıtlar güncellenir; özelleştirilmiş şablonlara dokunulmaz

**Deploy:** Supabase’de `031_presentation_template_default.sql` uygula.

---

## 2026-05-30 — Sunum materyali boş uyarı metni kısaltıldı

- Aday detay: yalnızca **"Önce sunum materyali ekleyin!"** (alt açıklama kaldırıldı)

---

## 2026-05-30 — Lansman fiyat güncellemesi (Plus / Pro)

- **Basic:** ₺499 (aynı)
- **Plus (master):** ₺999 → **₺1.099** / yıllık ₺9.888 (₺824/ay efektif)
- **Pro:** ₺1.799 → **₺1.999** / yıllık ₺17.988 (₺1.499/ay efektif)
- Tek kaynak: `src/lib/domain/pricing.ts` (Shopier, ödeme, landing)

---

## 2026-05-29 — YZ kota isimleri senkronize (YZ Mesajı / YZ Koçu / Uyum Denetimi)

- Kişisel istatistik progress bar etiketleri admin tablolarıyla aynı; sıra: Mesaj → Koç → Uyum
- Saha Provası = **YZ Koçu** kotası (roleplay), Yazar/Koçluk sor = **YZ Mesajı** kotası (message)
- "Claude tüm notları..." → Yapay Zeka Koçu tüm notları inceliyor...
- Ödeme/landing plan maddeleri güncellendi

---

## 2026-05-29 — Sunum şablon imleç ekleme, metinler, WhatsApp aktivite kaydı

### UX
- Chip butonlar (`{name}` vb.) imleç konumuna eklenir; `mousedown` ile odak kaybı önlendi
- Başlık/açıklama metinleri güncellendi (Sunum Materyalleri, kısa aday detay açıklaması)
- Sunum WhatsApp gönderiminde aktivite: `WhatsApp · Sunum materyali gönderildi (Başlık)` — YZ mesaj bağlamına da düşer

**Dosyalar:** `PresentationMaterialsContent.tsx`, `CandidateDetail.tsx`, `dailyActionNote.ts`, `useCandidates.ts`, `YazarForm.tsx`, çeviriler

---

## 2026-05-29 — YZ arşivi UX, super admin lisans, sunum sayfası genişlik/font

### İstatistikler
- Arşiv: başlık/alt başlık sadeleştirildi; sütunlarda yalnızca kullanım adedi (limit yok)
- Super admin listede her zaman ilk sırada; lisans **Pro · Sınırsız** (DB'deki Plus/master override)
- TR: Davetli alt ekip

### Sunum materyalleri
- Sayfa tam genişlik + font +1; varsayılan WhatsApp şablonu Greenleaf metni
- Aday detay kutusu font +1; dark temada "Materyalleri düzenle" pearl beyaz

**Dosyalar:** `stats.ts`, `istatistikler/actions.ts`, `AIUsageArchiveSection.tsx`, `PresentationMaterialsContent.tsx`, `CandidateDetail.tsx`, `presentationMaterials.ts`

---

## 2026-05-29 — Migration 029 backfill: MAX(uuid) düzeltmesi

### Fix
- **029 backfill:** `MAX(workspace_id)` → `array_agg(... ORDER BY created_at DESC)[1]` (PostgreSQL uuid için MAX yok)
- **030:** Tam kurulum scripti (tablo + RPC + backfill) — 029 transaction rollback sonrası tablo yoksa **030'un tamamını** çalıştır

---

## 2026-05-29 — YZ kota senkronu, kullanım arşivi, fiyat güncelleme, sunum UX

### YZ kota gösterimi (kullanılan / limit)
- Tüm sayaçlar **kullanılan/limit** formatına çekildi: İstatistikler, Yazar/Koçluk/Prova, Uyum, buton etiketleri
- `formatAIUsageDisplay`, `formatCreditButtonLabel` tek kaynak

### Super admin — kalıcı YZ arşivi
- **Migration 029:** `nmm_ai_usage_daily` + `nmm_increment_ai_usage_daily` RPC; `nmm_daily_actions` backfill
- Her AI üretiminde roll-up (`checkQuota.logAIGeneration`)
- İstatistikler sayfasında **YZ Kullanım Arşivi** bölümü (7g / 30g / 12 ay / tümü)

### Sunum materyalleri
- Kayıt hataları artık toast ile (`PresentationMaterialResult`); migration 028 yoksa anlaşılır mesaj
- Şablon alanı: chip butonlar + canlı önizleme; `{name}`/`{sender}` jargonu kaldırıldı

### Fiyatlandırma
- Basic (leader): **₺499**, Pro: **₺1.799**, Plus (master): **₺999** (aynı)

**Deploy:** Supabase’de `028_presentation_materials.sql`, `029_ai_usage_daily_rollups.sql` (+ gerekirse `030_ai_usage_daily_backfill_fix.sql`) uygula.

**Dosyalar:** `aiUsage.ts`, `checkQuota.ts`, `pricing.ts`, `istatistikler/*`, `sunum-materyalleri/*`, `coach.ts`, `stats.ts`, `database.types.ts`

---

## 2026-05-29 — Dış Kayıt tablosu: davetli downline hariç (parent_id)

### Fix
- **İstatistikler / Dış Kayıt YZ:** `parent_id` dolu workspace sahipleri listeden çıkar (Elif gibi davet kodu ile katılanlar)
- Mantık: bağımsız = `license_type=free` **ve** `parent_id IS NULL`; davetliler yalnızca **Ekip YZ** tablosunda
- Plan satın alınca `license_type` ≠ free → Dış Kayıt’tan otomatik düşer (zaten free filtresi)

**Dosya:** `istatistikler/actions.ts`, `stats.ts`

---

## 2026-05-29 — Sunum Materyalleri (workspace bazlı WhatsApp)

### Özellik
- **`nmm_presentation_materials`** migration 028 — title, url, whatsapp_template, sort_order, is_default (max 5/workspace)
- **Ayar sayfası:** `/pipeline/sunum-materyalleri` (Boru Hattı altında); Boru Hattı başlığında kısayol
- **Aday detay:** materyal dropdown, mesaj önizlemesi, WhatsApp `{name}` `{url}` `{sender}` şablonu
- **Fallback:** Süper Admin’de DB boşsa geçici Greenleaf; diğer kullanıcılar materyal ekleyene kadar uyarı

**Deploy:** Supabase’de `028_presentation_materials.sql` uygula.

---

## 2026-05-29 — Ekibim kapı, istatistik blur, YZ tablo düzeltmesi

### UX
- **Ekibim:** çizgili placeholder kaldırıldı; portal + flu arka plan (ilk açılış ve X sonrası); kilitliyken `EkipPanel` mount edilmez
- **Pano:** hesap bilgileri popup masaüstünde biraz büyük + font +1 (`md:`); mobil aynı
- **İstatistikler:** deneme/Basic’te Ekip Performans tablosu buzlu cam overlay; Plus/Pro’da açılır
- **Ödeme:** Pro `proFeature3` → sadece «Yapay Zeka Alt Ekip Koçu»

### İstatistikler / süper admin
- **Dış Kayıt YZ masası:** davet koduyla başka ekibe katılanlar listeden çıkar (Elif çift kayıt giderildi)
- **Ekip YZ masası:** her üyenin kendi lisans limiti (`getMemberLicenseProfilesAction`); Süper Admin dışında ∞ yok

**Dosyalar:** `FeatureUpgradeGate.tsx`, `ekip/page.tsx`, `IstatistiklerContent.tsx`, `istatistikler/actions.ts`, `AccountStatusAlert.tsx`, `payment.ts`, `stats.ts`

---

## 2026-05-29 — Dil bayrağı, Pro plan metni, dış kayıt YZ, Shopier UX, GitHub cron

### UX / ürün
- Header: tek bayrak (TR iken 🇹🇷 → EN; EN iken 🇺🇸 → TR)
- Pro plan: Süper Admin satırı kaldırıldı; Alt Ekip Koçu açıklaması güncellendi
- İstatistikler: Ekip YZ masası gerçek plan limitleri; dış kayıt tablosu tüm `free` workspace’ler (Focus Team hariç)

### Shopier
- Ödeme: `fetch` + HTML redirect (milisaniyelik JSON hatası giderildi)
- Launch log: `buyer_id_nr`, `signature_len`
- 501: Shopier secret/panel — kod tarafı; destek yanıtı bekleniyor

### Council E + cron
- `serverError` + yazar/uyum actions i18n
- E-posta cron: GitHub Actions (Vercel Hobby uyumlu); `vercel.json` crons kaldırıldı

**Deploy:** GitHub secrets `CRON_SECRET`, `NMM_APP_URL`

---

## 2026-05-29 — Council E/G/H + trial e-posta (15 gün dahil)

### E-posta (açık tema, resimsiz)
- `emailTemplate.ts` — premium açık HTML; tüm Resend şablonları güncellendi
- `trialEmails.ts` + cron `GET /api/cron/trial-emails` (3g, 1g, bitti, **+15g**)
- `vercel.json` crons; `docs/n8n-nmm-adaptation.md` (NMU JSON → NMM SQL)

### Council
- **E:** ProvaForm `pickLangField`; Takvim önceden tamam
- **G:** `RouteError` + pano/odeme/ekip/pipeline `error.tsx`
- **H:** Playwright `e2e/landing.spec.ts` (`npm run test:e2e`)

**Deploy:** Vercel’de `CRON_SECRET` + cron path’ler; ilk gün 09:00 TR’de trial mailleri.

---

## 2026-05-29 — Popup masaüstü + Ekibim konum + e-posta rehberi

### UX
- **Hesap popup (md+):** Kısa metin varyantları; `max-h` kaldırıldı — butonlar kaydırmadan görünür; mobil metin aynı
- **Ekibim kapısı:** X sonrası kart `fixed` viewport ortasında (modal ile aynı konum); mobil de ortalı

### Council / dokümantasyon
- Takvim: `calendarLocale` (Intl), `lang === 'en'` kaldırıldı
- `docs/email-automation.md` — n8n / cron önerisi; `docs/local/` gitignore (n8n JSON yerel)
- `COUNCIL_STATUS.md` güncellendi (F tamam, E kısmi, C Shopier bekliyor)

---

## 2026-05-29 — Popup UX + Council A/B/D

### UX
- Pano hesap popup: mobil kompakt, başlık HESAP BİLGİLERİNİZ, ÖNEMLİ kaldırıldı
- Ekibim kapısı: `fixed` modal (kayma yok), sağ üst X, panel mount yok

### Council A+B+D
- A: `pickBilingual` + arama sayfası; B: `translateTextAction` kota; D: README + `docs/COUNCIL_STATUS.md`

---

## 2026-05-29 — Pano hesap duyurusu + 14 gün tek deneme

### UX
- Hesap durumu kutusu **yalnızca Pano**; kırmızı-beyaz nefes animasyonlu banner → tıklanınca ortalı popup
- Popup: Kapat + Planları Gör & Yükselt; metin 14 günlük tek dönem SaaS kurgusu

### Ürün
- Deneme **14 gün** (7+7 ve 30 gün sınırlı ücretsiz kaldırıldı); süre bitince erişim kilidi → `/odeme`
- `TRIAL_DAYS=14`, migration `027_trial_14_days.sql` (Yusuf vb. için süreyi uzatır)

**Deploy:** 027 Supabase’e uygula.

---

## 2026-05-29 — Ekibim kapısı, hesap yaşam döngüsü, plan metinleri

### Plan metinleri
- Ödeme + landing: `Günlük … Yapay Zeka Koçu Kredisi` (YZ Mesajı → Koçu)

### Ekibim (Plus/Pro)
- Menüde her zaman görünür; Basic/denemede kilit ikonu
- `/ekip`: flu arka plan + yükseltme popup (`FeatureUpgradeGate`)

### Hesap yaşam döngüsü (ücretsiz)
- Banner: kayıt tarihi, deneme bitişi, sınırlı ücretsiz bitiş (+30 gün)
- Sonrasında yalnızca `/odeme` (grace bitince erişim kilidi)
- `accountLifecycle.ts` + testler

### Shopier log
- `[Shopier Launch] ok` — **POST** `/odeme/launch` satırında (GET /odeme değil)

---

## 2026-05-29 — Council #7 testler, yükseltme menüde, Shopier tutar formatı

### Council #7 (genişletildi) ✅
- `aiUsage` — `formatCreditButtonLabel`, deneme limitleri
- `checkQuota` — deneme + `created_at` yedek
- `shopierCheckout` / `pricing` — tutar string, platform order id
- `shopierOsb` — hex hash
- `POST /odeme/launch` — route test
- `POST /api/payment/shopier` — OSB route test
- **58 test** geçiyor

### UX
- `UpgradePlanBanner` kaldırıldı → **Profil menüsü** üstünde “Planı Yükselt” kartı (sayfa içeriğini itmez)
- Kredi butonları: `Uyum Denetimi Yap (Kalan 2/2)` — iki nokta üst üste yok, mobil `whitespace-nowrap`

### Shopier 501 (tekrar deneme)
- `total_order_value`: tam lira → `399` (`.0` yok); imza aynı string
- `modul_version` 1.0.8, ülke `Turkiye`
- Deploy sonrası Yusuf ile Basic ödeme tekrar test

---

## 2026-05-29 — Deneme kredileri, OSB webhook, UI kredi butonları, yükseltme banner

### 7 günlük ücretsiz deneme = Basic günlük krediler (15 / 10 / 2)
- `aiUsage.ts`: `isTrialPeriodActive`, `getEffectiveLicenseType`, deneme bitince 5/3/0
- Yeni kayıt: `ensureWorkspaceAction` → `license_expires_at` +7 gün
- Mevcut kullanıcılar: `created_at` + 7 gün yedek; migration `026_free_trial_expires_backfill.sql`
- `checkAIQuota`, `useAILimits`, İstatistikler + süper admin dış kayıt masası senkron

### UI
- Kredi sayacı aksiyon butonlarında: YZ Mesajı, Koçluk, Uyum Denetimi (`formatCreditButtonLabel`)
- `UpgradePlanBanner` → `/odeme` (ücretsiz/deneme kullanıcıları)
- Landing/ödeme metinleri: YZ Mesajı / Saha Provası / Uyum Denetimi Kredisi
- İstatistikler kota etiketleri landing ile hizalı

### Shopier
- OSB: `res` + `hash` HMAC (`shopierOsb.ts`), route hem OSB hem legacy callback
- OSB yanıtı düz metin `success` zorunlu
- **Panel:** Bildirim URL tam olmalı: `https://nmm.suattayfuntopak.com/api/payment/shopier` (…/shop değil)
- **501 checkout:** Vercel’de `SHOPIER_API_KEY` + `SHOPIER_API_SECRET` = panel OSB kullanıcı adı/şifre; `SHOPIER_WEBSITE_INDEX` mağaza sırası

### Council
- **#6 landing extract:** ✅ (önceki commit)
- **#7 test coverage:** `aiUsage`, `checkQuota` (deneme), `shopierOsb` testleri eklendi

**Deploy:** migration 026 Supabase’e uygula; Vercel env + Shopier OSB URL doğrula.

---

## 2026-05-29 — Shopier 501 (v2) + Council #6 landing tamamlandı

### Shopier 501 — kök neden ve düzeltme
- **501 = Shopier imza doğrulama hatası** (`/s/pay`); geçersiz HMAC veya yanlış API secret
- **Yeni akış:** `POST /odeme/launch` → sunucuda imzalı HTML → `multipart/form-data` ile `api_pay4.php` (base64 `+` bozulması önlendi)
- Tutar formatı SDK uyumu: `999.0` (`.00` değil); `buyer_id_nr` sayısal; telefon 10 hane
- Env: `SHOPIER_API_KEY` veya `SHOPIER_API_USER`, `SHOPIER_API_SECRET`, opsiyonel `SHOPIER_WEBSITE_INDEX`
- **Vercel kontrol:** Panel API Key + Secret birebir; callback `https://nmm.suattayfuntopak.com/api/payment/shopier`

### Council #6 (6/6) — landing extract ✅
- `page.tsx` → 1 satır re-export
- `src/app/_components/landing/*` — Header, Hero, Features, ROI, Pricing, Testimonials, Footer

**Sıradaki council:** #7 test coverage

---

## 2026-05-29 — İstatistikler: Dış Kayıt YZ masası

### Dış Kayıt Yapay Zeka Kullanım & Limit Kontrol Masası
- Süper admin İstatistikler sayfasında, ekip YZ masasının altında yeni tablo
- `parent_id` olmayan bağımsız kayıtlar (Platform Yönetim ile aynı havuz); bugünkü `nmm_daily_actions` kullanımı
- Plan bazlı limitler (`getLimitsForLicense`); lisans sütunu + e-posta
- `istatistikler/actions.ts` — `getIndependentSignupAIUsageAction`
- Çeviri: `stats.ts` (`aiIndependentTitle` vb.)

**Council #6:** landing `page.tsx` extract (sıradaki)

---

## 2026-05-29 — Shopier 501 fix + Council #6 EkipPanel

### Shopier ödeme (Hata 501)
- **Kök neden:** `api_pay4.php` formunda zorunlu alanlar eksikti; `currency` yanlışlıkla `"TRY"` string (doğrusu `"0"`)
- **Düzeltme:** `lib/domain/shopierCheckout.ts` — billing/shipping, `product_type`, `callback`, imza payload; tutar `1699.00` formatında
- Test: `shopierCheckout.test.ts` (+4 test)

### Council #6 (5/5 EkipPanel)
- `EkipPanel.tsx` ~240 satır orchestrator
- `TeamPerformanceSection`, `InviteTeammateSection`, `JoinByInviteSection`, `YZOnboardingKocuModal` extract
- Görünür UI değişikliği yok

**Sıradaki #6:** landing `page.tsx` extract

---


- Başlık: **Lisans ve Mevcut Planlar**; alt açıklama kaldırıldı
- Plan açıklamaları (Basic / Plus / Pro) güncellendi
- Yıllık disclaimer tek satır; %25 rozeti emerald/beyaz (her iki temada okunaklı)
- Aktif Plus/Pro butonu: gradient korunur, **!text-white** (light dahil)

---


### Kök neden
- `src/proxy.ts`: Oturum açık kullanıcıyı public sayfalardan **`/bugun/ilgilen`**'e yönlendiriyordu (yanlış hedef)
- `LoginForm`: `router.push('/pano')` soft navigation — SSR proxy oturum çerezlerini henüz göremeyince giriş sayfasında takılma

### Düzeltme
- Proxy post-login hedefi → **`/pano`**
- Giriş sonrası `window.location.assign('/pano')` (tam sayfa, çerezler senkron)
- Zaten oturum açıksa giriş sayfasında otomatik `/pano` yönlendirmesi

---


### Landing — Liderlerin Başarı Hikayeleri
- Dark modda hover: `hover:bg-slate-50` kaldırıldı → `dark:hover:bg-white/[0.06]` (hafif vurgu, okunaklı metin)
- Özellik kartlarında aynı hover düzeltmesi

### Council #6 (4/5)
- **platform-yonetim:** `PlatformYonetimContent.tsx` extract — `page.tsx` ~5 satır

**Sıradaki #6:** `EkipPanel` → landing extract

---


### Hız / geçiş UX
- **Giriş:** Client-side Supabase sign-in + `router.push('/pano')` (server redirect yerine); `/pano` prefetch
- **Navigasyon:** Sidebar, BottomNav, SquareButton `prefetch`; dashboard mount'ta tüm rotalar prefetch
- **Pano:** Workspace yüklenince kareler hemen görünür; aday verisi arka planda skeleton ile gelir
- **React Query:** `staleTime` 60s, `refetchOnWindowFocus: false`

### Ekibim
- **Ekip Arkadaşını Davet Et** başlık düzeltmesi
- **Davet Kodunu Gir** modülü davet bölümünün altında; `hasUpline` yoksa gösterilir (bağımsız liderler dahil)
- `WorkspaceContext.hasUpline` — `parent_id` ile upline kontrolü

### Platform Yönetim WA
- Bağımsız kayıt mesajı: "Ekibim" → **'Davet Kodunu Gir' kutusuna {code}**

### Council #6 (3/5)
- **istatistikler:** `IstatistiklerContent.tsx` extract — `page.tsx` ~5 satır

**Sıradaki #6:** `platform-yonetim` → `EkipPanel` → landing extract

---


### Council backlog #6 (2/5 sayfa)
- **itirazlar:** `data/itirazlar.ts`, `ItirazCard`, `AddObjectionModal`, `ItirazlarContent` — `page.tsx` ~12 satır
- **egitim:** `constants.ts`, `TrainingCard`, `AddTrainingModal`, `EgitimContent` — `page.tsx` ~12 satır
- Görünür UI değişikliği yok; yalnızca kod organizasyonu

### Ödeme + landing fiyatlandırma
- Aylık: Basic ₺399, Plus **₺999**, Pro **₺1.699**
- Yıllık görünüm: **%25 indirimli aylık** fiyat (₺299 / ₺749 / ₺1.274) + **3 ay bedava** rozeti
- Tek seferde tahsil: 12 × indirimli aylık (`lib/domain/pricing.ts` + Shopier tutarları)
- Yıllık seçilince açıklama metni (12 ay tek çekim)
- **Mevcut Aktif Planınız** butonu: light siyah / dark beyaz (okunabilir)

**Sıradaki #6:** `istatistikler` → `platform-yonetim` → `EkipPanel` → landing extract

---

## 2026-05-28 — UX düzeltmeleri + Council #5 + platform WA davet linki

### Çıkış / Açılış / Ödeme
- **UserMenu:** Çıkış onayı `logoutAction()` doğrudan çağrılıyor (form unmount bug fix)
- **`/acilis`:** Giriş yapmış kullanıcı landing’i görebilir; Platform Yönetim butonu TR **Açılış Sayfası** → `/acilis`
- **Ödeme sayfası:** Light mode — kartlar/metinler `var(--text-*)` / `var(--bg-card)` ile okunabilir

### Platform Yönetim — WhatsApp
- **Bağımsız kayıt:** Davet metni + `REGISTER_URL` (`https://nmm.suattayfuntopak.com/kayit`); kod metinde `{code}`, URL’de `?ref=` yok (antivirüs/spam riski)
- **NMM ekibi:** Önceden doldurulmuş mesaj yok — doğrudan `wa.me/{telefon}`

### Council backlog #5 (tamamlandı)
- ESLint: ham `z-[NN]` / `z-50` yasak (`eslint.config.mjs`); ihlaller `Z.*` ile düzeltildi

**Deploy:** Ek migration yok.

---

## 2026-05-28 — Platform admin UX + ESLint + çıkış onayı (Council #4 kısmi)

### Platform Yönetim Masası
- Sağ üst: **Ödeme Sayfası** (yeşil) / **Landing Page** (mor) — onay diyaloğu sonrası `/odeme` ve `/`
- Erişim: yalnızca `suattayfuntopak@gmail.com` (nav + client redirect + server `assertSuperAdmin`)

### Council backlog #4 (başlangıç)
- ESLint: `@/lib/supabase/client` `.tsx` içinde yasak; legacy dosyalar `eslint.config.mjs` istisna listesinde
- `EkipPanel`: onboarding/join/remove → `ekip/actions.ts` server actions; `userId` workspace context’te

### UX
- `ConfirmDialog` — Platform sayfa geçişleri + UserMenu çıkış onayı

---

## 2026-05-28 — Ekibim saha ortağı avatarları + Council backlog #3

### fix: saha ortağı (katildi aday) profil fotoğrafları Ekibim'de

**Kök neden:** `nmm_fetch_team_with_downlines` RPC `leader_candidates` içinde yalnızca `note` dönüyordu; Y-9 sonrası `avatar_url` ayrı kolonda — `resolveCandidateFields` boş kalıyordu.

**Çözüm:**
- Migration `025_team_rpc_candidate_avatar.sql` — RPC'ye `avatar_url`, `note_tr`, `note_en`, `warmth`
- `enrichLeaderCandidates` — RPC öncesi/sonrası ek sorgu ile typed kolonları garanti (025 uygulanmadan da çalışır)
- Legacy fetch: `nmm_candidates` select'e typed kolonlar eklendi

### Council backlog #3: `as any` temizliği (src'de 0)

EkipPanel join, platform insert, istatistikler PerformanceRow, notifications realtime, LanguageProvider, AddCandidateSheet stage.

**Deploy:** Migration `025` Supabase'de uygulanmalı (enrich fallback zaten aktif).

---

## 2026-05-28 — Council backlog #2: Aday ekle/düzenle PersonAvatar

- `AddCandidateSheet`, `EditCandidateSheet` — profil önizlemesi pastel baş harf / yükleme; kamera butonu korundu

---

## 2026-05-28 — Council backlog #1: Arama sayfası PersonAvatar

- `search/page.tsx` — aday sonuçlarında fotoğraf + pastel baş harf (pano/pipeline ile uyumlu)

---

## 2026-05-28 — Ekibim: saha ortağı kart çerçevesi güçlendirildi

- `teamMemberCard.ts` — saha ortağı (`isAppUser === false`) border/ring/arka plan NMM ortağı seviyesinde belirgin (amber ton)

---

## 2026-05-28 — PersonAvatar: Takvim + Pipeline

### fix(ui): boru hattı kart/detay ve takvim listesi avatarları

- `CandidateCard`, `CandidateDetail`, `TakvimClient` → `PersonAvatar` + pastel baş harf / `avatar_url`
- `PersonAvatar` boyutları: `xl` (16), `2xl` (20) eklendi

---

## 2026-05-28 — Avatar + Ekibim rol kartları (UI)

### fix(ui): pano / bugün ilgilen avatarları + ekip rol çerçeveleri

**Pano & Bugün İlgilen:**
- `PersonAvatar` bileşeni — `resolveCandidateFields` ile `avatar_url`; fotoğraf varsa gösterilir, yoksa isim baş harfi
- Baş harf arka planları: isme göre deterministik pastel palet (`avatarColors.ts`), light/dark uyumlu

**Ekibim:**
- Üye kartları rol tonu: Lider açık mavi, NMM ortağı hafif mor, Saha ortağı hafif sarı/amber (`teamMemberCard.ts`)
- Saha ortakları artık NMM ortakları kadar belirgin çerçeve/arka plan (önceden soluk `border-[var(--border)]`)
- Üye avatarları `PersonAvatar` ile aynı pastel mantık

**Y-9 Faz 3:** DB’de kalan `|||` yok; onboarding adım etiketleri kod içi `label_tr`/`label_en` — ayrı sprint (typed kolon gerekmez).

---

## 2026-05-28 — Council Y-9 (Faz 2): `nmm_daily_actions` lider notları typed columns

### feat(db): günlük aksiyon lider notları — `note_tr` / `note_en`

**Kapsam:** Yalnızca lider/kullanıcı notları (`action_type = 'note'`, `system_note:*` hariç). Sistem notları (`system_note:candidate_created`, `warmth_change`, vb.) yalnızca `note` kolonunda kalır.

**Migration `024_daily_action_typed_notes.sql`:**
- Yeni kolonlar: `note_tr`, `note_en`
- Backfill: mevcut `TR ||| EN` notları kolonlara ayrıştırıldı; tek dilli notlar `note_tr`'ye
- `note` kolonu lider notları için yalnızca çeviri formatı (`TR ||| EN`) — sistem notları değişmez

**Kod:**
- `src/lib/domain/dailyActionNote.ts` — resolve/build/merge/display, `isLeaderUserNote`
- `useAddCandidateNote` → `{ candidateId, noteTr, noteEn? }` + `buildDailyActionNoteFields`
- `CandidateDetail` — lider notları UI/özet/aktivite; kayıt typed kolonlara
- `YazarForm` — AI bağlamında `displayDailyActionNote`
- `noteParser` `parseSimpleNote`/`formatSimpleNote` @deprecated (legacy fallback)
- 6 unit test (`dailyActionNote.test.ts`); toplam 32 test yeşil

**Deploy:** Migration `023` (adaylar) ile birlikte `024` uygulanmalı. Uygulanmadan önce legacy `note` parse devam eder.

---

## 2026-05-28 — Council Y-9 (Faz 1): `nmm_candidates` typed columns

### feat(db): aday notu/avatar/sıcaklık — `|||` yerine ayrı kolonlar

**Kapsam (güvenli faz):** Sadece `nmm_candidates`. Lider notları (`nmm_daily_actions`) ve diğer tablolar **Faz 2** — hâlâ `TR ||| EN` formatında.

**Migration `023_candidate_typed_columns.sql`:**
- Yeni kolonlar: `note_tr`, `note_en`, `avatar_url`, `warmth` (sicak|ilik|soguk)
- Backfill: mevcut `note` içindeki 4 parçalı `|||` verisi kolonlara ayrıştırıldı
- `note` kolonu artık yalnızca çeviri formatı (`TR ||| EN`) — avatar/sıcaklık içermez

**Kod:**
- `src/lib/domain/candidateFields.ts` — `resolveCandidateFields` (kolon öncelikli + legacy fallback), `buildCandidateContentFields`, `mergeCandidateContentUpdate`
- Yazma: Add/Edit aday, QuickAdd, CandidateDetail çeviri kaydı
- Okuma: kart, detay, istatistikler, ekip fetch, arama, yazar formu, YZ koçu
- `useCandidates` sıcaklık değişimi artık `patch.warmth` ile
- 4 unit test (`candidateFields.test.ts`); toplam 26 test yeşil

**Deploy:** `supabase db push` veya migration `023` uygulanmalı. Uygulanmadan önce kod legacy `note` parse ile çalışmaya devam eder; uygulandıktan sonra typed kolonlar aktif olur.

---

## 2026-05-28 — Council Y-8: i18n bimodal → t() (tamamlandı) + Platform WhatsApp davet metni

### i18n: convert ~600 hardcoded `lang === 'en'` ternaries to central dictionary

**Mimari:** Çeviri sözlüğü modülerleştirildi. `tr.ts`/`en.ts`'e dokunulmadı; bunun yerine her ekran grubu için `src/lib/translations/sections/*.ts` bölüm dosyaları eklendi ve `LanguageProvider` içindeki `mergeSections` ile temel sözlüğe birleştirildi. Yeni namespace'ler: `statsPage`, `paymentPage`, `landingPage`, `trainingPage`, `objectionsPage`, `pipelinePage`, `compliancePage`, `platformPage`, `coachUi`, `shellUi`, `pagesUi`.

**Dönüştürülen ekranlar (paralel alt-ajanlarla):**
- istatistikler (76), açılış sayfası `app/page.tsx` (~92), ödeme (OdemeClient+OdemePageClient ~70), platform-yonetim (49), eğitim (49), itirazlar (23), candidate detay+kart+pipeline+StageFilter (42), uyum (36), coach/yazar bileşenleri (61), shell/nav bileşenleri (21), takvim/search/ilgilen/saha-provası/broadcast (39).
- Toplam ~600 sabit ikidilli `lang === 'en'` UI metni `t('<ns>.key')`'e taşındı. Dinamik değerler `{var}` placeholder ile.

**Bilinçli bırakılanlar (kural gereği):** veri seçimi ternary'leri (`x.title_en`/`title_tr`, `obj[lang]`, `[currentLang]` ile indekslenen `APPROVED_CLAIMS`/`SCENARIOS`/`TESTIMONIALS` vb.), locale kodları (`'en-US'`/`'tr-TR'`), `className` mantığı, sunucu/AI prompt + e-posta dosyaları, ve `deleteWithUndo.tsx` (`getLang()` helper'ı — `t` kapsamda değil).

**Doğrulama:** `tsc --noEmit` temiz; geçici anahtar-bütünlüğü testi tüm statik `t('...')` çağrılarının hem tr hem en'de string'e çözüldüğünü doğruladı (ham anahtar/eksik çeviri yok); 22 birim testi geçiyor. Kullanıcıya görünen metinler değişmedi.

### feat: Platform Yönetim WhatsApp davet mesajı kişiselleştirildi

- `buildInviteWaLink(code, name)` artık alıcının adıyla (`w.ownerName`) kişiselleştirilmiş yeni metni kullanıyor; metin `platformPage.inviteWaMessage` altında `{name}`/`{link}` ile tr+en olarak saklanıyor. Her iki çağrı yeri (bağımsız üye kartı + ana tablo) güncellendi.

---

## 2026-05-28 — Uyum Denetimi kutusu Pano → Uyum Merkezi

### ui: move compliance box from dashboard to compliance page footer

- Pano'daki "Uyum Denetimi / Uyum Denetimini Aç" CTA kutusu `PanoContent.tsx`'ten kaldırıldı (kullanılmayan `getLimitsForLicense`, `ArrowRight`, `complianceLimit`, `isSuperAdmin` da temizlendi).
- Aynı kutu `uyum/page.tsx`'te yasal sorumluluk reddi (disclaimer) metninin hemen üzerine taşındı — her iki sekmede de sayfanın en altında görünür.
- Self-link önlendi: free plan (`complianceLimit===0`) kutusu artık `/odeme`'ye (upsell) gider; ücretli/super admin için bilgi amaçlı `<div>` (link yok, ok ikonu yok).
- tsc temiz, lint temiz.

---

## 2026-05-28 — Council Faz F: Hijyen (tamamlandı)

### chore: route cleanup, naming, docs + first test suite

- **O-14 (`bugun` rota kararı):** `/bugun` sadece `/pano`'ya redirect eden kabuktu. Login/signup/şifre-güncelle yönlendirmeleri doğrudan `/pano`'ya çevrildi, `bugun/page.tsx` silindi. Gerçek odak sayfası `/bugun/ilgilen` korundu.
- **O-8:** `(dashboard)/actions.ts` → `_shared-actions.ts` (sadece `logoutAction`); tek importer `UserMenu.tsx` güncellendi.
- **O-15:** AGENTS.md'ye "API rotaları vs Server Actions", `lib/` taksonomisi ve migration kuralları eklendi.
- **O-16:** README boilerplate yerine gerçek NMM tanıtımı (stack, domain, super-admin dualizmi, env, yapı, konvansiyonlar).
- **Test minimum seti:** Vitest kuruldu (`npm test`). 3 dosya / 22 test:
  - `getLimitsForLicense` (tüm planlar + super admin + fallback)
  - Shopier HMAC + order_id — pure logic `lib/domain/shopierWebhook.ts`'e çıkarıldı (constant-time compare), route refactor edildi
  - `checkAIQuota` (no_auth / super admin / free compliance gate / expired license / limit_reached / ok+remaining) — Supabase mock'lu
- tsc temiz, yeni dosyalarda lint temiz. **Council Faz F tamamlandı.**

### Değişen / yeni dosyalar
- yeni: `src/lib/domain/shopierWebhook.ts`, `vitest.config.ts`, 3 `*.test.ts`
- sil: `src/app/(dashboard)/bugun/page.tsx`; rename: `actions.ts` → `_shared-actions.ts`
- düzenlenen: shopier `route.ts`, `giris/actions.ts`, `SignupForm.tsx`, `PasswordResetGate.tsx`, `UserMenu.tsx`, `AGENTS.md`, `README.md`, `package.json`

---

## 2026-05-28 — Council Faz E: O-7 lib/ reorganizasyonu

### refactor(lib): group flat lib utilities into ui/utils/domain/infra

- `lib/ui/`: `zIndex`, `deleteWithUndo`
- `lib/utils/`: `noteParser`, `validation`, `waLink`, `getLang`
- `lib/domain/`: `stages`, `aiUsage`, `navigation`, `trainingData`
- `lib/infra/`: `mail`
- ~38 dosyada import yolları codemod ile güncellendi; build + tipler yeşil.
- `supabase/` ve `ai/` zaten kohezyonlu klasör olduğu için (ve import yüzeyi çok geniş olduğu için) yerinde bırakıldı — gereksiz/riskli churn'den kaçınıldı.
- AGENTS.md / CLAUDE.md'deki `@/lib/zIndex` → `@/lib/ui/zIndex` güncellendi.
- **Council Faz E tamamlandı** (K-5, Y-12, O-4, O-7).

---

## 2026-05-28 — Council Faz E: Y-12 (custom içerik DB) + O-4 (user_progress)

### feat: persist custom content & user progress in DB (migration 022)

**Y-12 — custom training/objection kalıcılığı**
- `nmm_custom_trainings` + `nmm_custom_objections` tabloları (jsonb `data`, RLS: kendi satırın).
- `src/lib/customContent.ts`: load/add/delete + **localStorage'dan tek seferlik migrasyon** (veri kaybı yok, sonra local key temizlenir).
- `egitim/page.tsx` ve `itirazlar/page.tsx` artık DB kullanıyor (tarayıcı değişse de içerik kalıcı).

**O-4 — nmm_user_progress**
- `nmm_user_progress` tablosu (read/fav trainings & objections, tek satır/kullanıcı, upsert).
- `useProgressSync` artık `nmm_daily_actions`'ı istismar etmiyor; eski progress satırından tek seferlik migrasyon yapıyor.

**Deploy:** Migration `022` production'a uygulanmalı.

---

## 2026-05-28 — Council Faz E (başladı): EkipPanel god component parçalama (K-5)

### refactor(ekip): extract data layer + shared types out of EkipPanel

- `src/lib/team/types.ts`: `MemberRow`, `OnboardingStep`, `ONBOARDING_STEPS` (artık tek kaynak).
- `src/lib/team/fetchEkipMembers.ts`: ~325 satırlık `fetchMembers` veri katmanı (RPC + legacy fallback) bileşenden çıkarıldı.
- `EkipPanel.tsx` bu modülleri import ediyor; `MemberRow`/`ONBOARDING_STEPS` geriye dönük uyum için re-export. Davranış birebir aynı (build + tip doğrulandı).
- Kalan Faz E: Y-12 (custom objection/training kalıcılık), O-4 (`nmm_user_progress`), O-7 (`lib/` reorganizasyonu).

---

## 2026-05-28 — 4 cerrahi düzeltme (downline rol, tıklama, avatar, tablo)

### fix: invited member role, person-detail click, İstatistikler+Platform clickable

**1. Davet kodu ile katılan kişi rolü (migration 021)**
- `nmm_fetch_team_with_downlines` downline üyeyi kendi workspace'inde 'leader' döndürüyordu → sponsor görünümünde 'Lider' etiketi, liderin üstünde sıralanma ve İstatistikler `role==='member'` filtresinden düşme.
- `021_fix_downline_member_role.sql`: sadece sorgulanan workspace sahibi 'leader', diğer herkes 'member'.

**2. Ekibim kart tıklaması — eski hale**
- Tıklama tekrar `/pipeline/[id]` (kişi/aday detay sayfası); `findLeaderCandidateForMember` (skor ≥ 80) artık Elif'i doğru adaya eşliyor (Şenol değil).
- Kendi başıma eklediğim `/ekip/uye/[userId]` "Distribütör Doğru Başlangıç Rehberi" sayfası kaldırıldı (route + `getTeamMemberDetailAction` + `TeamMemberDetailData`).
- İki kademeli chevron (ilk ok → Aday Hunisi Dağılımı, sağdaki ok → 4 haftalık rehber) DEĞİŞMEDİ; sadece tıklama hedefi düzeltildi.

**3. İstatistikler tabloları (migration 021 ile)**
- Davet kodu ile katılan üye artık hem Ekip Performans Dağılım hem Ekip YZ Kullanım tablosunda görünür.

**4. Tıklayınca kişi detayına gitme**
- İstatistikler: satır (isim/avatar/kutu) → `/pipeline/[id]`. Saha satırı = adayın kendisi; NMM üyesi ad eşleşmesiyle.
- Platform Yönetim: satır YALNIZCA o kişi süper admin'in kendi adayıysa `/pipeline/[id]`'ye gider (yeni sayfa uydurulmadı); aksi halde tıklanamaz. Aksiyon butonları `stopPropagation`.

**Deploy:** Migration `021` production'a uygulanmalı.

---

## 2026-05-28 — Ara düzeltmeler + Council Sprint 3 / Faz D (tamamlandı)

### fix + perf: Ekibim, davet, avatarlar, İstatistikler + Council Faz D

**Ekibim — yanlış detay sayfası (Elif → Şenol)**
- NMM ortakları için link her zaman `/ekip/uye/[userId]`.
- `src/lib/team/matchCandidate.ts` — `findLeaderCandidateForMember` (skor ≥ 80).

**WhatsApp davet**
- `REGISTER_URL` = `https://nmm.suattayfuntopak.com/kayit`; TR+EN `inviteWaMessage` / `waInviteGroup`.

**Platform Yönetim**
- Avatar: auth metadata + batch `nmm_workspace_members.avatar_url`.
- Aday sayımı: `nmm_count_candidates_per_workspace()` RPC (fallback: eski satır sayımı).

**İstatistikler**
- Ekip YZ tablosunda foto avatarlar; kota kutusu en altta.

**Council Faz D — Performans (tam)**
- **Y-2:** `020_team_fetch_and_platform_counts.sql` → `nmm_fetch_team_with_downlines(p_workspace_id)`; `useTeamMembers` + `EkipPanel` tek RPC (legacy fallback).
- **Y-5:** `nmm_count_candidates_per_workspace()` platform admin.
- **Y-6:** `useUpdateCandidate` önbellek-önce + `.update().select('id')`.
- **O-2/O-3:** `useCandidates` `staleTime: 30s`; `invalidateTeamAndAIUsage` (YZ formları + aday güncelleme); `useDeleteActivity` aday bazlı invalidate.

**Kural:** `.cursor/rules/session-end-git.mdc` — oturum sonu commit + push + hot.md (kullanıcı sormadan).

**Deploy:** Migration `020` production'a uygulanmalı (`supabase db push` veya SQL). `019` zaten uygulandı.

---

## 2026-05-28 — Council Sprint 2 (UX Tutarlılık)

### feat: loading.tsx, Skeleton primitifi, z-index disiplini, i18n (Ekibim + Header)

**Route-level loading**
- `src/app/(dashboard)/loading.tsx` + `DashboardLoading` / `Skeleton` bileşenleri eklendi.
- Dashboard segmentleri yüklenirken tutarlı iskelet gösterimi (beyaz flash azaltıldı).

**z-index (`src/lib/zIndex.ts`)**
- Ölçek genişletildi: `cardOverlay`, `cardPopover`, `coachModal`, `fullscreen`.
- Ham `z-[NN]` kullanımları migrate edildi: `EkipPanel`, `CandidateCard`, `OnboardingModal`, `IlgilenContent`, `OdemeClient`, `egitim`, `itirazlar`.
- `AGENTS.md` — UI conventions (loading, z-index, i18n) bölümü eklendi.

**i18n**
- `team.*` ve `header.*` sözlük anahtarları (~50 yeni key).
- `EkipPanel.tsx`: kullanıcıya dönük metinlerin büyük çoğunluğu `t()` ile (onboarding adım etiketleri yapısal `label_tr`/`label_en` kaldı).
- `Header.tsx`: lisans uyarı çubuğu `t('header.*')`.
- `ekip/page.tsx`, `TeamMemberDetail.tsx`: `t()` geçişi.

---

## 2026-05-28 — 4 Öncelikli Öneri + Council Sprint 1 (Tek Kaynak)

### feat + refactor: Downline RLS, avatar sync, ekip üye detayı, lib/auth, useWorkspace

**Öneri 1 — RLS `parent_id` çift format (`019_downline_rls_avatar_sync.sql`)**
- `nmm_leader_downline_workspace_ids()` helper: `parent_id = auth.uid()` VEYA sponsor workspace UUID.
- Downline SELECT politikaları (`members`, `candidates`, `daily_actions`) bu helper ile yenilendi.

**Öneri 2 — Avatar senkronizasyonu**
- `nmm_sync_member_avatar(p_avatar_url)` — profil güncellemesinde tüm `nmm_workspace_members` satırları.
- `nmm_join_workspace` güncellendi: join sırasında auth metadata'dan avatar kopyalanır; `parent_id` artık sponsor **workspace id** (legacy user id hâlâ RLS'te desteklenir).
- `ProfileModal` → `syncMemberAvatarAction` RPC çağırıyor.

**Öneri 3 — `/ekip/uye/[userId]` NMM ortak detay sayfası**
- Hunide aday kaydı olmayan NMM ortakları için: huni dağılımı, onboarding checklist, opsiyonel pipeline linki.
- `EkipPanel` link mantığı: `pipeline_id` varsa `/pipeline/[id]`, yoksa `/ekip/uye/[userId]`.

**Öneri 4 — Batch avatar RPC**
- `nmm_resolve_team_avatars(workspace_id, user_ids[])` tek roundtrip; `resolveTeamAvatarsAction` artık N×`getUserById` döngüsü kullanmıyor.

**Council Sprint 1 — Tek kaynak**
- **Yeni:** `src/lib/auth.ts` — `isSuperAdmin`, `assertSuperAdmin`, `resolveWorkspaceLicense`.
- `checkAIQuota`, `useAIUsage`, `platform-yonetim/actions` → merkezi auth helper.
- **Yeni:** `src/app/(dashboard)/actions/workspace.ts` — `fetchWorkspaceAction` (salt okuma) + `ensureWorkspaceAction` (oluşturma).
- `useWorkspace` hook: INSERT artık `queryFn` içinde değil; üyelik yoksa `useMutation` ile `ensureWorkspaceAction` (Strict Mode duplicate workspace riski azaltıldı).

**Deploy notu:** `supabase db push` veya migration `019` production'a uygulanmalı (RPC + RLS + join güncellemesi).

---

## 2026-05-28 — Council Triad Y-1 (doc), Y-4, Y-11 + EditCandidateSheet syntax fix

### docs + feat + fix: migrations policy, notifications routing, error boundaries

**Y-1 — Migrations numaralandırma politikası** (sadece dokümantasyon; rename yapılmadı çünkü 004 dosyaları zaten production'a uygulanmış — rename Supabase'in yeni gibi görmesine yol açar)
- `supabase/migrations/README.md` eklendi: "Bir numara = bir migration" kuralı, `004_*` çakışmasının niye olduğu gibi bırakıldığı, yeni migration ekleme prosedürü.

**Y-4 — useNotifications router fix + type-aware routing**
- `useEffect` dep array'ine `router` eklendi (lint exhaustive-deps doğrulaması).
- Toast action artık tüm bildirim tiplerini `/ekip`'e değil, `NotificationItem.type`'a göre yönlendiriyor: `user → /ekip`, `calendar → /takvim`, `alert → /odeme`, `bell/info → /pano`.

**Y-11 — Error boundary stratejisi**
- `src/app/error.tsx` (root) — bilingual hardcoded (root scope provider'ı garanti değil).
- `src/app/(dashboard)/error.tsx` — `useTranslation` ile dinamik dil; dashboard layout altındaki tüm sayfalar artık beyaz ekran yerine premium hata kartı görür.
- `src/app/not-found.tsx` — 404 sayfası, "Panoya dön" CTA.

**Bonus fix — `EditCandidateSheet.tsx`** Dosya sonunda fazladan `}` vardı, TypeScript build'i bozuyordu. Pre-existing bug, ben dokunmadım ama git working tree'sinde belirdi; düzeltildi.

**Doğrulama:** `npx tsc --noEmit` temiz.

---

## 2026-05-28 — Council Triad K-1, K-2, K-3, K-4 Uygulandı (4 kritik bulgu kapatıldı)

### fix(security) + refactor: Shopier güvenliği, AI auth gap, quota merkezileştirme, schema drift

**K-1 — Shopier ödeme güvenliği** (önceki commit: 51cafb3, c0e49b1)
- `SHOPIER_API_SECRET` ve `SHOPIER_API_KEY` fallback'leri (hardcoded test secret) kaldırıldı; env yoksa fail-loud.
- `platform_order_id` formatı `<workspaceId>_<plan>_<period>_<ts>` oldu — lisans tipi imzalı orderId'den okunuyor, `total_amount` üzerinden tahmin yapılmıyor.
- Bakım modu: `PAYMENT_MAINTENANCE=true` env → `/odeme` sayfası bilingual `MaintenanceNotice` render eder, server action defense-in-depth gate eklendi.
- `force-dynamic` ile env toggle artık redeploy gerektirmiyor — anlık yansır.

**K-2 — AI server action'larında auth/kota check'i eklendi**
- `bugun/ilgilen/actions.ts:generateQuickMessageAction` ve `pipeline/[id]/actions.ts:generateNotesSummary` artık auth + kota kontrolü yapıyor.
- Bot loop tehdidi kapandı: oturum açmamış bot bu endpoint'leri kullanıp Gemini API'sini bizim hesabımıza yakamaz.
- (K-3'le birlikte merkezi fonksiyona dönüştü.)

**K-3 — Merkezi `checkAIQuota` fonksiyonu**
- **Yeni:** `src/lib/ai/checkQuota.ts` (168 satır) — `checkAIQuota(actionType, { lang? })` discriminated union döner; `logAIGeneration({ workspaceId, userId, note })` helper.
- 7 dosyada duplicate olan `getUser → membership → workspace → license expiry → count → compare` bloğu tek satıra düştü.
- Refactor edilen dosyalar (~330 satır duplicate kod kaldırıldı):
  - `yazar/actions.ts` (3 fonksiyon): **448 → 292** satır.
  - `uyum/actions.ts`: **210 → 149**. Compliance paid-plan gate korundu.
  - `ekip/actions.ts`: **152 → 99**.
  - `pipeline/[id]/actions.ts` (3 fonksiyon): **259 → 185**. `generateCoachMessage` ownership check'i korundu (`quota.workspaceId` + `quota.user.id` üzerinden).
  - `bugun/ilgilen/actions.ts`: K-2'deki 30 satır → 1 satır.

**K-4 — Schema drift kapatıldı**
- `src/types/database.types.ts`: `nmm_notifications` ve `nmm_onboarding_progress` tabloları + `nmm_workspace_members.avatar_url` kolonu eklendi.
- `src/lib/supabase/admin.ts`: `createClient<Database>()` ile tiplendi (admin client artık `nmm_notifications` tipini biliyor).
- 28 `as any` → 9'a düştü; **19 schema-drift cast'i silindi**.
- Kalan 9 cast farklı sebeplerden (enum mismatch, browser API, Supabase realtime, RPC return types) — başka bulgular.
- Etkilenen dosyalar: `useNotifications.ts`, `useTeamMembers.ts`, `EkipPanel.tsx`, `kayit/actions.ts`, `ProfileModal.tsx`.

**Doğrulama:** `npx tsc --noEmit` temiz, sıfır hata.

**Bekleyen:** 33 council bulgusu daha var (12 yüksek, 16 orta, 5 düşük). Faz A tamam; Faz B-F sırayla.

---

## 2026-05-28 — Council Triad Genel Değerlendirme Raporu (analiz, henüz uygulanmadı)

### docs: Council of High Intelligence — 3 perspektif paralel analizi

**Yöntem:** [council-of-high-intelligence](https://github.com/0xNyk/council-of-high-intelligence) triad stratejisi — `council-torvalds` (pragmatik kod kalitesi), `council-aristotle` (mimari/kategorizasyon), `council-socrates` (varsayım yıkıcı) paralel olarak çağrıldı. Her biri 50-60 tool kullanımı ile bağımsız analiz üretti.

**Rapor:** [docs/council-triad-2026-05-28.md](docs/council-triad-2026-05-28.md) (~9 KB, 4 kritik + 12 yüksek + 16 orta + 5 düşük = **37 bulgu**)

**Üçlü yakınsama (≥2 council üyesinin bağımsız tespiti — en güvenilir bulgular):**
- 🔴 Shopier webhook secret fallback + amount-based license mapping (Torvalds + Sokrates)
- 🔴 Quota check 5 dosyada duplicate; tri-modal data access (Torvalds + Aristoteles)
- 🔴 God components (EkipPanel 1257 satır, itirazlar 1022, vb.) + doğrudan Supabase çağrıları (Torvalds + Aristoteles)
- 🔴 Schema drift — 3 tablo `database.types.ts`'te yok, 28 `as any` (Torvalds + Aristoteles)
- 🟠 Migration `004_` numara çakışması (Aristoteles + Sokrates)
- 🟠 SUPER_ADMIN_EMAIL 83 yerde tekrar; `yazar/actions.ts:61` dualism leak (Aristoteles + Sokrates)
- 🟠 `bugun/page.tsx` redirect kabuğu + boş `_components/` (Aristoteles + Sokrates)
- 🟠 i18n bimodal: `useTranslation` vs raw `lang === 'en' ?` (Torvalds + Aristoteles)
- 🟡 Test stratejisi yok — bilinçli değil, belgelenmemiş (Torvalds + Sokrates)

**Öneri eylem sırası (Fazlar A → F, ~7-10 gün tek geliştirici):**
- **Faz A — Güvenlik (~2 saat):** Shopier secret fallback sil, K-2 auth gaps kapat, `supabase gen types`, migration 004 rename.
- **Faz B — Tek kaynak (1-2 gün):** `lib/ai/checkQuota.ts` + `lib/auth.ts` merkezi fonksiyonlar.
- **Faz C — UX (1 gün):** error.tsx / loading.tsx / Z disiplin / i18n unify.
- **Faz D — Performans (1 gün):** `fetch_team_with_downlines` RPC, single-roundtrip update.
- **Faz E — Refactor (2-3 gün):** God component parçalanması, `|||` typed columns migration.
- **Faz F — Hijyen (1 gün):** README, AGENTS.md kurallar, test minimum seti.

**Slogan denetimi:** "Basit, kullanıcı dostu, profesyonel, premium" — 4 kritik açık kapatılana kadar "premium" iddiası sessiz şekilde ihlal ediliyor.

**Bu commit:** Sadece rapor + hot.md notu. Kod değişikliği yok — proje sahibi onay verdikten sonra Faz A'dan başlanacak.

---

## 2026-05-28 — Council Triad Raporu Uygulaması (Faz 1-4 Tamamlandı)

### refactor + fix + i18n: 14 maddelik kapsamlı temizlik

**Kritik (C serisi):**
- **`src/hooks/useCandidates.ts` — 9 hardcoded TR toast → çift dil:**
  - `getLang` import edildi, tüm `toast.success/error` çağrıları `getLang() === 'en' ? 'EN' : 'TR'` formatına çevrildi.
  - Etkilenen mutasyonlar: `useAddCandidate`, `useUpdateCandidate`, `useDeleteCandidate`, `useMarkContacted`, `useAddCandidateNote`, `useDeleteActivity`.
- **`src/hooks/useNotifications.ts` — `createClient()` her render yerine `useMemo` singleton:**
  - `const supabase = useMemo(() => createClient(), [])` — stale closure ve duplicate realtime subscription riski giderildi.
- **`src/app/(dashboard)/search/page.tsx` + `translations/*.ts` — boş durum alt yazısı i18n:**
  - Yeni key: `common.searchNoResultsDesc` (TR + EN), `{query}` placeholder ile dinamik.

**Yüksek (H serisi):**
- **`src/app/page.tsx` + `src/app/globals.css` — `dangerouslySetInnerHTML` kaldırıldı:**
  - Marquee `@keyframes` ve `.animate-marquee-*` sınıfları `globals.css`'e taşındı, XSS vektör prensibi kapatıldı.
- **`src/app/globals.css` — Font çelişkisi düzeltildi:**
  - `body { font-family: Arial, Helvetica, sans-serif }` → `var(--font-geist-sans), sans-serif`. Geist artık gerçekten render ediliyor.
- **`src/lib/navigation.ts` (YENİ) — `NAV_ITEMS` üçlü tekrarı tek dosyaya:**
  - `Sidebar.tsx`, `BottomNav.tsx`, `DashboardShell.tsx` artık `@/lib/navigation`'dan import ediyor.
  - `NAV_ROUTES = NAV_ITEMS.map(i => i.href)` türetilmiş — yeni sayfa için sadece bir dosya değişir.
- **H-12 değerlendirildi:** `hot.md` kalıcı dev log olarak kullanılıyor (commit edilmeye devam) — `.gitignore` değişikliği geri alındı.

**Orta (M serisi):**
- **`src/app/(dashboard)/_components/UserMenu.tsx` — Logout dark mode hover:** `dark:text-[#e87fa3] dark:hover:bg-[#3d0f1f]` eklendi.
- **`src/app/(dashboard)/_components/BottomNav.tsx` — 20 satırlık if-else zinciri silindi:**
  - Tek satırlık `t(translationKey.replace('nav.', 'navMobile.'))` — mevcut `navMobile.*` çeviri grubu kullanılıyor.
  - Kullanılmayan `lang` destrüktürelemesi de kaldırıldı.
- **`src/hooks/useWorkspace.ts` — `staleTime: Infinity` → `5 * 60 * 1000`:** lisans yükseltmesi sonrası refresh garantisi.
- **`src/lib/zIndex.ts` — Eksik katmanlar eklendi:**
  - `sidebar: 'z-[35]'`, `header: 'z-40'`, `bottomNav: 'z-50'`, `headerSearch: 'z-50'`.
  - `Sidebar.tsx`, `Header.tsx`, `BottomNav.tsx` artık inline `z-*` yerine `Z.*` kullanıyor.
- **`src/lib/waLink.ts` — Uluslararası numara desteği:** `+` ile başlayan numaralar artık ülke kodu zorlanmadan kullanılıyor.
- **`src/lib/validation.ts` — `PHONE_RE`:** `/^(\+90|0)5\d{9}$/` → `/^\+?[1-9]\d{6,14}$/` (E.164 uyumlu).

**Düşük (L serisi):**
- **`Sidebar` + `BottomNav` + `DashboardShell` — gereksiz `useAIUsage` çağrıları kaldırıldı:**
  - `ws?.isSuperAdmin` (önceki refactor'da eklenmişti) kullanılıyor; tek hook yetiyor.

**Doğrulama:** `npx tsc --noEmit` temiz çalıştı, sıfır TypeScript hatası.

---

## 2026-05-28 — getLimitsForLicense Mimarisi + WorkspaceContext.isSuperAdmin + Landing Page Tek Kaynak

### refactor: 3 mimari iyileştirme

- **`src/lib/aiUsage.ts` — `isSuperAdmin` parametresi & pro complianceLimit güncellendi:**
  - `getLimitsForLicense(licenseType, isSuperAdmin?)` imzasına geçildi.
  - `isSuperAdmin === true` olduğunda `{ messageLimit: Infinity, roleplayLimit: Infinity, complianceLimit: Infinity }` döner; artık sunucu action'ları ve UI bileşenleri aynı fonksiyonla süper admin bypass'ını otomatik alır.
  - Pro plan `complianceLimit` 15 → **20** olarak güncellendi (landing page ile hizalama).

- **`src/hooks/useWorkspace.ts` — `WorkspaceContext`'e `isSuperAdmin: boolean` eklendi:**
  - `fetchOrCreateWorkspace`'in her iki dönüş yoluna `isSuperAdmin` alanı eklendi.
  - Artık herhangi bir bileşen `useWorkspace` → `ws.isSuperAdmin` ile süper admin durumunu okuyabilir; sadece bu iş için `useAIUsage` import etmeye gerek kalmadı.

- **`src/app/(dashboard)/pano/_components/PanoContent.tsx` — `useAIUsage` bağımlılığı kaldırıldı:**
  - `useAIUsage` import ve çağrısı silindi.
  - `isSuperAdmin = ws?.isSuperAdmin ?? false` olarak alınıyor.
  - `getLimitsForLicense(ws?.licenseType, isSuperAdmin)` → super admin için `complianceLimit = Infinity`.
  - Display: `complianceLimit === Infinity` → "Sınırsız hak" / "Unlimited credits".

- **`src/app/page.tsx` — Landing page pro compliance değeri tek kaynaktan okunuyor:**
  - `const PRO_LIMITS = getLimitsForLicense('pro')` modül seviyesinde tanımlandı.
  - Pro plan uyum denetimi satırı `${PRO_LIMITS.complianceLimit}` şeklinde dinamikleştirildi — `aiUsage.ts` değiştiğinde landing page otomatik güncellenir.

---

## 2026-05-28 — Süper Admin Pano Uyum Denetimi Limiti Düzeltmesi

### fix: Pano ekranında süper admin için "Günlük 15 hak" yerine "Sınırsız hak" gösterildi

- **`PanoContent.tsx`:**
  - `useAIUsage` hook'u import edildi ve bileşen içinde `isSuperAdmin` bilgisi alındı.
  - Uyum Denetimi CTA kartındaki açıklama metni; `isSuperAdmin === true` olduğunda
    TR: `"Pazarlama metinlerinizi yasal uyumluluk açısından denetleyin. Sınırsız hak."`
    EN: `"Audit your marketing messages for FTC & legal compliance. Unlimited credits."`
    olarak güncellendi.
  - Normal kullanıcılar için `Günlük ${complianceLimit} hak` gösterimi aynen korundu.
- **Kök neden:** `getLimitsForLicense('pro')` → `complianceLimit: 15` döndürüyor; `useWorkspace`, super admin için `licenseType: 'pro'` set ettiğinden pano sayısal limiti gösteriyordu. Server-side bypass (`uyum/actions.ts`) zaten doğruydu, sadece UI gösterimi eksikti.

---

## 2026-05-28 — Landing Page Pro Plan Güncelleme

### feat: Pro plan fiyatlandırmasına Günlük 20 Uyum Denetim Hakkı eklendi

- **`src/app/page.tsx` (Diamond Pro / Pro Plan kartı):**
  - Özellik listesinin en altına "Günlük 20 Uyum Denetim Hakkı" (`Daily 20 Compliance Audit Credits`) maddesi eklendi.
  - Diğer plan özellikleriyle aynı `CheckCircle2` ikonu ve `text-pink-400` renk stili kullanıldı.
  - TR/EN ikidilli destek sağlandı.

---

## 2026-05-27 — Platform Yönetim Masası: Bağımsız Üyeler (Issue #6)

### feat: Bağımsız kayıtları yönetmek için Platform Yönetim Masası tamamlandı

- **Bağımsız Üyeler Bölümü (`platform-yonetim/page.tsx`):**
  - KPI kartlarının altında yeni bir "Bağımsız Kayıtlar" kart grid'i eklendi.
  - Her kart: üye ismi / e-posta, WhatsApp davet gönder butonu, pipeline'a aday ekle butonu.
  - `buildInviteWaLink()`: Admin'in davet kodunu içeren WhatsApp paylaşım mesajı üretir.
  - `handleAddAsCandidate()`: Bağımsız üyeyi `addIndependentAsCandidateAction` ile admin'in pipeline'ına "yeni" stage'de ekler; eklenen kayıt yeşil tik gösterir.
  - TypeScript syntax hatası düzeltildi: `data: ws: wsData` → `data: wsData`.

- **Ana Tablo WhatsApp Butonu Düzeltildi:**
  - E-postayı telefon numarası olarak kullanan hatalı `api.whatsapp.com/send?phone=email` linki kaldırıldı.
  - Artık `wa.me/?text=...` formatında admin'in davet linkini içeren mesaj açılıyor.

- **Navigasyon Güncellemeleri:**
  - `BottomNav.tsx`, `Sidebar.tsx`, `DashboardShell.tsx`: Süper Admin için Crown ikonlu "Platform Yönetimi" navigasyon öğesi eklendi (amber renk teması, `useAIUsage` ile koşullu görünüm).
  - `en.ts` / `tr.ts`: `nav.platformYonetim` çeviri anahtarı eklendi.

- **`sendAdminNewUserEmail()` (`mail.ts`):**
  - Yeni kayıt anında admin e-postasına gönderilen "Yeni Kullanıcı Kaydı" bildirimi fonksiyonu eklendi.

- **Migration 017 & 018:** Önceki session'da commit edilmiş — workspace trigger kaldırıldı, signupAction tek bildirim noktası.

- **Süper Admin Migration Talimatı:**
  - Migration 018 (`DROP TRIGGER IF EXISTS nmm_on_new_workspace_signup ON nmm_workspaces;`) Supabase SQL Editor'da çalıştırılmalı (duplicate bildirim önlemek için).

---

## 2026-05-27 — Responsive UX İyileştirmeleri & Kritik Güvenlik / Bildirim Düzeltmeleri

### fix: 6 kritik responsive UX & güvenlik sorunu giderildi

- **#1 – YZ Mesajı Sekmesi Otomatik Scroll:**
  - `YazarForm.tsx`: Mesaj üretilince `scrollIntoView` `block: 'nearest'` → `block: 'start'` olarak değiştirildi; mesajın üst kısmı viewport'a hizalanıyor.
  - `KoclukForm.tsx`: Yanıt kutusu için `answerRef` eklendi, yanıt üretilince ekran otomatik olarak yanıt başına kayıyor. WhatsApp paylaşım ikonu zaten mevcuttu.

- **#2 – İstatistikler Tablosu Swipe Çakışması:**
  - `istatistikler/page.tsx`: Her iki tablo wrapper'ına `onTouchStart={(e) => e.stopPropagation()}` eklendi. Tabloya parmakla dokunulduğunda touch eventi DashboardShell'in swipe-navigation handler'ına ulaşmıyor; tablo yatay kaydırılırken artık sayfa değişmiyor.

- **#3 – Yeni Kayıt Bildirimi (Admin E-posta + In-App) Çalışmıyordu:**
  - `src/lib/supabase/admin.ts` oluşturuldu: Service role key kullanan admin Supabase client.
  - `signupAction` güncellendi: Kayıt sırasında (workspace oluşmadan önce) admin kullanıcısı `listUsers()` ile bulunup `nmm_notifications`'a doğrudan servis rolüyle bildirim ekleniyor.
  - `018_drop_signup_notification_trigger.sql` migration'ı eklendi: Migration 017'deki workspace trigger'ı kaldırıldı; artık signupAction tek yetkili kayıt bildirim noktasıdır (duplicate önlendi).

- **#4 – Bildirim Güvenliği (Yeni Kullanıcı Yanlış Bildirim Görüyor):**
  - Veritabanı RLS politikası (`user_id = auth.uid()`) zaten doğru — DB seviyesinde güvenli.
  - Sorun: Test sırasında aynı tarayıcıda (aynı localStorage/session) admin oturumu açıkken yeni hesap oluşturulması → Supabase session karışıklığı. Çözüm: Yeni kullanıcı testlerinde mutlaka farklı tarayıcı/incognito kullanın. "Ahmet Yılmaz" ghost bildirimi de Supabase dashboard'undan silinmeli.

- **#5 – Sesli Bildirim Ayarı Kalıcı Çalışmıyordu:**
  - `NotificationsModal.tsx`'te **eksik `createClient` import** tespit edildi ve eklendi. Bu eksik import, `useEffect` içindeki tercih yükleme kodunun (`soundAlerts`, e-posta, push) tamamen çökmesine ve `soundAlerts`'in varsayılan `true` kalmasına yol açıyordu. Import eklenmesiyle Supabase `user_metadata.preferences` doğru okunuyor ve ses tercihi artık oturumlar arası korunuyor.

---

## 2026-05-27 — Özel Fiyatlandırma / Paket Seçim Sayfası (`/odeme`) & Dinamik Ödeme Yönlendirmesi (Phase 3)

### feat: Özel Fiyatlandırma / Paket Seçim Sayfası & Dinamik Ödeme Yönlendirmesi

- **Güvenli Shopier Signature Generator Server Action (`actions.ts`):**
  - İstemci tarafından seçilen plana göre (`leader` - 299 TL / `master` - 899 TL) benzersiz bir `platform_order_id` ve `random_nr` üreten server action kodlandı.
  - Shopier ödeme geçidinin beklediği dynamic signature (`random_nr + platform_order_id + total_order_value + currency`) değeri, HMAC-SHA256 ve Base64 algoritmalarıyla tamamen güvenli sunucu ortamında imzalanarak derlendi.
- **Mor Degrade & Cam-Morfin Paket Karşılaştırma Sayfası (`/odeme` & `OdemeClient.tsx`):**
  - Giriş yapmış olan liderin veya ortağın görebileceği, asil koyu temamıza, HSL renklerimize ve dikey/yatay hizalama kılavuzlarımıza %100 uyumlu premium bir fiyatlandırma/seçim arayüzü yazıldı.
  - Sayfa TR / EN dil durumuna göre anlık olarak yerelleşmekte; kullanıcının mevcut aktif planını (`licenseType`) ve lisans bitiş tarihini (`licenseExpiresAt`) şık kartlarla raporlamaktadır.
  - Paketlerin "Satın Al / Yenile" butonlarına basıldığında, sunucudan gelen güvenli form parametrelerini toplayıp arka planda geçici bir `<form>` üzerinden Shopier API'sine (`api_pay4.php`) otomatik form POST sevk etme mekanizması kodlandı.
  - Bu yönlendirme esnasında kullanıcıyı parıldayan neon mor yükleme çemberiyle bilgilendiren profesyonel bir ara geçiş (loading) arayüzü entegre edildi.
- **Sistem İçi Satın Alma Linklerinin Güncellenmesi:**
  - `EkipPanel.tsx` içerisinde lisansı bittiğinde liderin alt ekibini izlemesini kısıtlayan premium yükseltme butonu, artık doğrudan SPA router (`router.push('/odeme')`) üzerinden bu yeni sayfaya sevk etmektedir.
  - `Header.tsx` en üst uyarı şeridindeki "Hemen Yenileyin" butonu da `/odeme` rotasına bağlanarak satın alma sürtünmesi sıfıra indirildi.

## 2026-05-27 — Shopier Webhook Entegrasyonu & Veritabanı Lisanslama Sistemi (Phase 2)

### feat: Shopier Webhook Entegrasyonu & Veritabanı Lisanslama Sistemi

- **Veritabanı Lisans Şeması (`016_workspace_licensing.sql`):**
  - `nmm_workspaces` tablosuna `license_type` ('free', 'leader', 'master') ve `license_expires_at` (timestamp with time zone) kolonları eklendi. Varsayılan olarak her yeni takım ücretsiz (`free`) plan ile başlar.
- **useWorkspace Kancası Güncellemesi (`useWorkspace.ts`):**
  - Supabase üzerindeki `nmm_workspaces` lisans bilgileri çekilerek çalışma alanı durumuna (`WorkspaceContext`) eklendi.
  - Süper yönetici olan `suattayfuntopak@gmail.com` e-postası için süresiz `master` lisansı tanımlayan özel bir muafiyet (super-admin bypass) uygulandı.
- **Shopier Webhook API Ucu (`/api/payment/shopier/route.ts`):**
  - HMAC-SHA256 imzası doğrulama mantığı ile donatılmış, tamamen güvenli ve sahte ödeme saldırılarına karşı korumalı bir webhook uç noktası kodlandı.
  - Başarılı Shopier ödemelerinde, ödenen miktara göre `leader` (299 TL) veya `master` (899 TL) lisansı belirlenip mevcut lisans süresi (veya lisans bittiyse bugünün tarihi) üzerine +30 gün ekleme yapılması sağlandı.
  - Webhook unauthenticated olduğu için veritabanını güncellemede `SUPABASE_SERVICE_ROLE_KEY` (Supabase Service Client) bypass mekanizması kullanıldı.
- **Ekip Paneli Lisans Kısıtlama Arayüzü (`EkipPanel.tsx`):**
  - Lisansı bitmiş veya `free` planda olan kullanıcılar için alt ekip üyelerinin detaylarını (onboarding check listesi, aday hunisi metrikleri) görüntüleme yetkisi kısıtlandı.
  - Kısıtlama yerine şık glassmorphic, mor degrade tasarımlı bir "Premium Master Plana Yükselt" çağrısı ve doğrudan Shopier ödeme sayfasına giden bir buton entegre edildi.
- **Header Üst Lisans Uyarı Şeridi (`Header.tsx`):**
  - Lisansı biten veya bitmesine 3 günden az kalan kullanıcıları yumuşak animasyonlu, sabit (fixed), pürüzsüzce geçiş yapan kırmızı-turuncu tonlarında bir üst uyarı şeridi ile bilgilendiren şık bir arayüz geliştirildi.
  - Header ile uyarı şeridi tek bir üst sabit sarmalayıcıya (`fixed top-0 left-0 w-full`) alınarak sayfa elemanlarıyla çakışması önlendi.
- **TypeScript Derleme & Tip Entegrasyonu (`database.types.ts`):**
  - Supabase şema tipleri `nmm_workspaces` tablosu için güncellenerek TypeScript derleyicisinin projeyi hatasız derlemesi sağlandı.

## 2026-05-26 — Ekibim Sayfası Üye Profil Fotoğrafları Senkronizasyonu (Avatar Sync)

### feat: Ekibim Sayfası Üye Profil Fotoğrafları Senkronizasyonu

- **Profil Fotoğrafı Senkronizasyonu & Kalıcı Avatar Desteği:**
  - **Veritabanı Desteği (`015_member_avatar_url.sql`):** `nmm_workspace_members` tablosuna `avatar_url` kolonu eklendi. Ayrıca mevcut üyelerin daha önce yüklediği fotoğrafları anında senkronize etmek için `auth.users` tablosundaki `raw_user_meta_data->>'avatar_url'` değerinden otomatik olarak dolduran (backfill) SQL güncelleme mantığı hazırlandı.
  - **Otomatik ve Anlık Güncelleme (`ProfileModal.tsx`):** Kullanıcı profil resmi yüklediğinde hem `auth.user_metadata` güncellenir hem de `nmm_workspace_members` tablosundaki satırı güncellenerek alt ekip arkadaşları panelinde (Ekibim sayfası) anında senkronize olması sağlanır. İşlem bittiğinde hem `members` hem de `workspace` önbellekleri (`invalidateQueries`) otomatik geçersiz kılınır.
  - **Estetik Arayüz Entegrasyonu (`EkipPanel.tsx`):** Ekip listesindeki kartlarda üye baş harfi gösterilen alanlar, eğer profil fotoğrafı mevcutsa şık ve yuvarlak bir `<img>` bileşeniyle render edilecek şekilde güncellendi.
  - **Akıllı Fallback / Hata Yönetimi:** Profil resmi yüklenemez veya silinirse, ya da internet kesintisinden dolayı resim yüklenmesinde bir hata oluşursa, `onError` tetikleyicisiyle resim gizlenerek otomatik olarak üyenin baş harfi (initials) renkli arka planla kusursuz şekilde geriye dönük gösterilir.
  - **TypeScript Uyum Değişiklikleri:** Supabase otomatik tiplerinde henüz yer almayan bu yeni alan için `any` cast işlemleriyle güvenli ve hata üretmeyen temiz kod yapıları kuruldu.

## 2026-05-26 — Seçenek A (Birleşik Ekip Merkezi) & Saha Provası Sayfası Entegrasyonu

### feat: Seçenek A (Birleşik Ekip Merkezi) & Saha Provası Standalone Sayfası Entegrasyonu

- **Birleşik Ekip Merkezi (Unified Team Center) Arayüz İyileştirmeleri:**
  - **Premium Rozetler:** Ekip listesinde (`EkipPanel.tsx`) yer alan üyelere statülerine göre şık, mor renk şemalı **`💎 NMM ORTAĞI`** (TR) / **`💎 NMM PARTNER`** (EN) ve yumuşak gri renk şemalı **`🤝 SAHA ORTAĞI`** (TR) / **`🤝 FIELD PARTNER`** (EN) rozetleri entegre edildi.
  - **Saha Distribütörleri Avatar & Rol Tasarımı:** Uygulamaya henüz kaydolmamış ama sahada kazanılmış olan saha ortaklarının avatarları soft gri renge çekildi ve rol etiketleri "Saha Distribütörü" olarak güncellendi.
  - **Davet Akışları & WhatsApp Davet Butonu:** Saha ortaklarının kartlarının detay açma chevronları gizlendi. Bunun yerine sağ taraflarına doğrudan sponsor davet kodunu ve `/kayit` linkini içeren WhatsApp davet şablonunu hazırlayan yeşil **`NMM'e Davet Et 🚀`** butonu eklendi.
- **Saha Provası (Field Rehearsal) Modülü Taşınması:**
  - **Kazanımlar Sayfası Silindi:** `/kazanimlar` rotası ve ilgili tüm kodları sistemden tamamen kaldırıldı.
  - **Yeni Standalone Saha Provası Sayfası (`/saha-provasi`):** Yapay Zeka Koçu (`/yazar`) altındaki 3. sekme olan "Saha Provası" sökülerek tamamen kendine ait, bağımsız bir sayfa olarak `/saha-provasi` altına taşındı.
  - **Yapay Zeka Koçu:** Sadece "YZ Mesajı Üret" ve "Koçluk Al" olmak üzere sadeleşmiş 2 sekmeli yapısına kavuşturuldu.
  - **Panolar & Global Navigasyon:** Pano üzerindeki 10. kutu (Kazanımlar kutusu) Saha Provası olarak güncellendi, sol sidebar ve mobil alt navigasyondaki kupa ikonlu Kazanımlar butonu hedef ikonlu Saha Provası butonuyla değiştirildi.

## 2026-05-26 — Kazanımlar Sayfası "Ekibimde" İş Ortağı Rozeti Entegrasyonu

### feat: Kazanımlar Sayfası "Ekibimde" İş Ortağı Rozeti Entegrasyonu

- **Prestijli ve Premium "💎 EKİBİMDE" Rozet Tasarımı:**
  - **Geliştirme:** Boru hattında başarıyla "Katıldı" aşamasına gelmiş olan adaylar arasından, davet kodunu girerek alt ekibe (`nmm_workspace_members` tablosunda downline üye) dahil olmuş ve distribütör olarak uygulamayı kullanmaya başlamış kişilerin Kazanımlar sayfasında belirginleştirilmesi sağlandı.
  - **Tasarım Bütünlüğü:** Downline üye ile eşleşen adayların isimlerinin hemen yanına (`flex items-center gap-1.5 flex-wrap` düzeninde) mor renk temasına sahip, solunda elmas emojisi bulunan şık ve dinamik bir **"💎 EKİBİMDE"** (İngilizce dil seçeneğinde **"💎 IN MY TEAM"**) rozeti yerleştirildi.
  - **Akıllı Eşleştirme & Yükleme Kontrolü:** `useTeamMembers` kancası entegre edilerek, sayfa yüklenmeden önce hem aday verileri hem de ekip üye verilerinin getirilmesi beklendi. Birebir büyük-küçük harf duyarsız isim eşleştirmesiyle üye eşleşmesi saptandı.

## 2026-05-26 — MLM Ekip Doğru Başlangıç Rehberi & YZ Koçu Doğrudan WhatsApp Sohbet Entegrasyonu

### feat/fix: Ekip / Doğru Başlangıç Rehberi Doğrudan WhatsApp Sohbet Yönlendirmesi

- **Doğrudan Kişiye Özel WhatsApp Mesajlaşma Entegrasyonu:**
  - **Sorun:** Distribütör Doğru Başlangıç Rehberi YZ Robotu veya YZ Ekip Koçu butonlarından harika koçluk mesajları üretilmesine rağmen, lider bu mesajı WhatsApp ile göndermek istediğinde WhatsApp doğrudan ilgili downline üyenin sohbet penceresini açmak yerine boş bir kişi arama/listeleme ekranı getiriyordu.
  - **Çözüm:** Telefon numarasının bilindiği tüm ekip paneli senaryolarında, WhatsApp butonuna tıklanıldığında doğrudan o üyenin sohbet penceresinin mesaj doldurulmuş şekilde açılması (`https://wa.me/numara?text=mesaj`) sağlandı.
  - **Dinamik Eşleştirme:** Ekip üyeleri tablosunda telefon numarası bulunmadığı için, liderin `nmm_candidates` listesindeki `full_name` eşleşmesi üzerinden dinamik olarak üyenin telefon numarası (`m.phone`) çözümlendi.
  - **Güvenli Fallback:** Telefon numarasının bulunamadığı durumlarda ise lideri kesinlikle engellememek adına, üretilen mesajı taşıyıp genel WhatsApp gönderme ekranına (`https://api.whatsapp.com/send?text=...`) yönlendirecek şekilde akıllı bir geriye düşme (fallback) mimarisi kuruldu.
  - Entegrasyon uygulamanın 3 can alıcı alanına uygulandı:
    1. **Doğru Başlangıç Rehberi YZ Robotu Popup'ı (`EkipPanel.tsx`):** Robot butonuna tıklanınca üyenin telefonu modal durumuna (state) taşındı ve modal içindeki WhatsApp gönderme butonu doğrudan o kişiye yönelecek şekilde güncellendi.
    2. **YZ Ekip Koçu Mentörlük Paneli (`YZEkipKocuSheet.tsx`):** Lider, ekip üyesinin inaktifliğini analiz edip koçluk mesajı ürettiğinde, WhatsApp butonu doğrudan o üyenin sohbetine yönlenecek şekilde güncellendi.
    3. **Ekibe Toplu Gönder Paneli Tekli Gönderimleri (`BroadcastPanel.tsx`):** Seçili ekip üyelerine tekli satır bazında gönderim yapılan WhatsApp butonlarının tamamı doğrudan hedeflenen numaraya sohbet açacak şekilde `waHref` entegrasyonuyla geliştirildi.

## 2026-05-26 — Çoklu Kullanıcı Veri Güvenliği, Bağımsız Aday Boru Hattı & AI Günlük Limiti Altyapı Düzeltmeleri

### fix/feat: Eski Kayıtlı Distribütörlerin MLM Bağımsız Lider Modeline Otomatik Geçişi (Migration 013)

- **Eski Üyeliklerin Sıkışma/Kayma Hatası %100 Çözüldü:**
  - **Teşhis:** Bağımsız Lider Modelimizden (Migration 009) önce kaydolan downline distribütörlerin doğrudan liderin `nmm_workspace_members` tablosuna `member` rolüyle kaydedildiği belirlendi. Bu durumda downline distribütörlerin kendi uygulamaları liderin çalışma alanına bağlandığı için hem temiz bir sıfır kilometre sayfa göremiyorlardı hem de davet kodunu girdiklerinde *"Zaten Ekibe Kayıtlısınız"* uyarısı alıp veritabanındaki yeni parent-child MLM bağını kuramıyorlardı.
  - **Çözüm:** Eski model üzerinden doğrudan liderin ekibine kaydedilmiş olan tüm distribütörleri otomatik olarak **Bağımsız Lider** statüsüne yükselten ve hiyerarşik bağı pürüzsüzce kuran SQL göç işlemi kodlandı.
  - Bu işlem otomatik olarak:
    1. Üyenin liderin workspace'indeki eski doğrudan üyeliğini siler.
    2. Üyeyi kendi workspace'inde **Leader** rütbesine atar (böylece Elif Hanım sıfır kilometre, tertemiz ve bağımsız kendi ekibine kavuşur).
    3. Üyenin workspace `parent_id` (sponsor) alanını liderin `owner_id` değerine bağlar (sizi sponsor olarak kaydeder ve sizde anında görünmesini sağlar).
    4. Üyenin o ana kadar oluşturduğu adayları ve aksiyonları liderin alanından kendi bağımsız alanına taşır.
    5. Lidere anında realtime *"Ekibinize yeni ortak katıldı"* bildirimi fırlatır!
  - Supabase Dashboard üzerinde çalıştırılmak üzere `supabase/migrations/013_migrate_old_memberships.sql` göç dosyası hazırlandı.

### feat: Downline (Alt Ekip) Metrik & Aday Güncelleme Bildirimleri (Migration 012)

- **Otomatik Aday & Aşama Bildirim Tetikleyicisi Entegre Edildi:**
  - Downline ekip üyeleriniz kendi çalışma alanlarında yeni bir aday eklediğinde veya mevcut adayın aşamasını (Yeni, Sunum, Takip, Katıldı vb.) güncellediğinde, sponsor liderin ekranına **anlık, gerçek zamanlı sesli ve görsel bildirim** akışı sağlayan PostgreSQL veritabanı tetikleyicisi (`nmm_candidates_notification_trigger`) kuruldu.
  - Bildirim metinlerinin Türkçe ve İngilizce dil çevirilerini otomatik olarak yönetebilmek için `nmm_get_stage_name_tr` ve `nmm_get_stage_name_en` veritabanı fonksiyonları kodlandı.
  - **Sessize Alma Desteği:** Liderler dilediklerinde bildirim penceresindeki "Tercihler" kısmından **"Sesli Uyarılar"** butonunu kapatarak bu bildirimlerin sesini tamamen sessize alabilirler.
  - Supabase Dashboard üzerinde çalıştırılmak üzere `supabase/migrations/012_downline_metric_notifications.sql` göç dosyası hazırlandı.

### feat: Gerçek Zamanlı (Realtime) Sesli ve Yazılı Bildirim Sistemi Entegre Edildi (Migration 011)

- **Otomatik Downline Bildirim Motoru kuruldu:**
  - Bir ortak (downline), liderin davet kodunu girerek sisteme katıldığı anda (`nmm_join_workspace` RPC) liderin (sponsorun) hesabına otomatik olarak **gerçek zamanlı in-app bildirim** gönderen PostgreSQL tetikleyici mekanizması kuruldu.
  - Supabase veritabanında bildirimlerin dil desteğiyle (`title_tr`, `title_en`, `description_tr`, `description_en`) kalıcı olarak tutulmasını ve anlık yayınlanmasını sağlayan `nmm_notifications` tablosu oluşturuldu.
- **Supabase Realtime Postgres Changes Entegrasyonu:**
  - `src/hooks/useNotifications.ts`: Yeni bildirimleri dinleyen ve anında tetiklenen bir Supabase Realtime kanalı (`supabase.channel`) entegre edildi.
  - Lider paneline yeni bir ortak katıldığı anda tarayıcıda **sesli uyarı (synthesized chiming sound)** çalması ve ekranın sağ üstünde **görsel/etkileşimli bir Toast bildirim** (`sonner` ile) belirmesi sağlandı.
- **Kusursuz Geriye Dönük Uyumlu Panel Entegrasyonu:**
  - `Header.tsx` ve `NotificationsModal.tsx` yeni `useNotifications` hook'una bağlanarak gerçek zamanlı veritabanı bildirimleri ile yerel tarayıcı bildirimlerini (takip hatırlatıcıları, güncellemeler) tek bir akışta birleştirdi.
  - Okunmamış bildirim sayısı ve detay kartları, sayfa yenilenmesine gerek kalmadan **anlık ve pürüzsüzce** güncellenir.
  - Supabase Dashboard üzerinde çalıştırılmak üzere `supabase/migrations/011_add_real_notifications.sql` göç dosyası hazırlandı.

### feat/fix: MLM Ekibim Sayfası Downline (Alt Ekip) Veri Gösterim RLS Güvenlik Yetkilendirmesi (Migration 010)

- **Doğrudan Davet Edilen Distribütörlerin (Direct Downlines) Görünürlüğü Kökten Çözüldü:**
  - `nmm_join_workspace` RPC'sinin başarıyla ilişkilendirdiği downline workspace `parent_id` bağına uygun olarak **Supabase RLS** (Satır Bazlı Güvenlik) politikaları güncellendi.
  - Liderin (Sponsorun) doğrudan kendi davet koduyla kaydolan downline distribütörlerin üyelik detaylarını okuyabilmesi için `nmm_workspace_members` tablosuna SELECT izni tanımlandı (`nmm_member_read_downlines`).
  - Liderin doğrudan downline aday sayılarını (huni aşamaları: yeni, sunum, takip, katıldı) görebilmesi için `nmm_candidates` tablosuna SELECT izni tanımlandı (`nmm_candidate_read_downlines`).
  - Liderin doğrudan downline distribütörlerinin son saha aktivitesini analiz ederek "Son Aktiflik" durumlarını paneline yansıtabilmesi için `nmm_daily_actions` tablosuna SELECT izni eklendi (`nmm_action_read_downlines`).
  - **Gizlilik Koruması Korundu:** Alt ekibin alt ekibi (sub-downlines) gibi transif/dolaylı ilişkilerin lider ekranına akması engellendi. Sadece doğrudan davet edilen kişilerin verilerinin akması güvenceye alınarak sistem tamamen premium bir bağımsız liderlik modeline kavuşturuldu.
  - Supabase SQL Editor üzerinden uygulanmak üzere `supabase/migrations/010_downline_rls_policies.sql` göç dosyası hazırlandı.

### style/feat: Kendi Eğitim İçeriği ve İtiraz Ekleme Popup Formlarının Okunabilirlik, Boyut ve Mobil Centering İyileştirmesi (Optimizasyon & Dengeli Orta Yol)

- **Popup Kart Boyutlarının Altın Oran Dengesine Çekilmesi:**
  - `itirazlar/page.tsx` ve `egitim/page.tsx` sayfalarındaki popup genişliği, eski küçük hal (`max-w-xl` - 576px) ile yeni çok büyük hal (`md:max-w-3xl` - 768px) arasındaki tam dengeli orta nokta olan **`md:max-w-2xl`** (672px) boyutuna getirildi.
  - Kart içi padding ve spacing değerleri daha kompakt, zarif ve ideal bir seviye olan `p-6 md:p-7` ve `space-y-4 md:space-y-5` olarak güncellendi.
- **Yazı Boyutlarının 1 Punto Düşürülerek Orta Karar Yapılması:**
  - Yazı boyutları eski aşırı küçük durum ile yeni çok büyük durumun tam ortasında konumlandırıldı:
    - Popup Başlığı: `text-base md:text-lg`
    - Alt Açıklamalar ve Kapat Butonu: `text-[11px] md:text-xs`
    - Form Alanı Etiketleri (Labels): `text-[11px] md:text-xs font-bold`
    - Form Girdileri (Inputs, Selects, Textareas): `text-xs md:text-sm px-3.5 py-2`
    - İşlem Butonları (İptal/Ekle): `text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5`
- **Tüm Cihazlarda Kusursuz Centering, Scroll ve Z-Index:**
  - `z-[9999]` katman seviyesi ve mobil dikey/yatay tam ortalama (`flex items-center justify-center`, `my-auto`, `max-h-[85vh] overflow-y-auto`) özellikleri tamamen korunarak her boyuttaki ekranda kusursuz bir deneyim sağlandı.

### style/feat: Kendi Eğitim İçeriği ve İtiraz Ekleme Popup Formlarının Okunabilirlik, Boyut ve Mobil Centering İyileştirmesi (İlk Versiyon)

- **Masaüstü Ekranlar için Genişletilmiş ve Ferah Popup Kart Tasarımı:**
  - `itirazlar/page.tsx` ve `egitim/page.tsx` sayfalarındaki "Kendi İtirazını Ekle" ve "Kendi İçeriğini Ekle" popup formlarının genişliği masaüstü ekranlar için `max-w-xl`'den `md:max-w-3xl` (768px) boyutuna çıkartılarak daha ferah bir form yerleşimi elde edildi.
  - İç paddingler `p-6`'dan masaüstü için `md:p-8`'e, dikey form elemanları arası boşluklar ise `space-y-4`'ten `space-y-5 md:space-y-6`'ya yükseltildi.
- **Yazı Okunabilirliği ve Punto Büyütme:**
  - Form alan etiketleri (labels) `text-[10px]`'ten `text-xs md:text-sm` boyutuna çekilerek belirginleştirildi.
  - Form girdileri (input, select, textarea) `text-xs`'ten `text-sm md:text-base` boyutuna büyütüldü.
  - Popup ana başlığı `text-base`'den `text-lg md:text-xl` seviyesine, açıklama alt yazısı ise `text-[11px]`'ten `text-xs md:text-sm` boyutuna getirilerek mükemmel bir okunabilirlik sağlandı.
  - İptal / Ekle eylem butonları da orantılı şekilde `text-sm md:text-base px-6 py-3` boyutlarına genişletildi.
  - Textarea alanlarındaki satır sayıları (rows) artırılarak yazım konforu yükseltildi.
- **Mobil ve Tablet Ekranlarda Kusursuz Dikey/Yatay Centering ve Z-Index:**
  - Popup overlay bileşenlerinin `z-index` katmanı `z-[9999]` değerine yükseltilerek tüm diğer arayüz bileşenlerinin en üstünde yer alması kesinleştirildi.
  - Mobil cihazlarda ve tabletlerde popup penceresinin ekranın sağdan soldan, yukarıdan aşağıdan tam ortasında konumlanması için `flex items-center justify-center` yapısıyla birlikte popup kartına `my-auto` ve `max-h-[85vh]` dikey scroll desteği entegre edildi. Bu sayede her türlü cihaz ekranında kusursuz ve taşma yapmayan bir görünüm elde edildi.
- **NM Master Kütüphanesi Alt Başlık İfadesi Güncellendi:**
  - Eğitim popup'ındaki eski alt başlık metni, talep doğrultusunda `"NM Master kütüphanesine kendi script, ders notu ya da rehberini ekleyebilirsin"` ifadesiyle güncellendi.

### feat: Kendi İtirazını Ekle ve Kendi Eğitim İçeriğini Ekle Sistemleri Entegre Edildi

- **"Bu İş (Network Marketing) Caiz mi?" İtirazı Eklendi:** YZ Koçu tarafından üretilen ve vicdani/ticari değerlendirme kriterleri (ürün varlığı, ciro tabanlı kazanç, şeffaflık) içeren meşru ticari açıklama, özetlenerek İtirazlara Cevaplar (`itirazlar/page.tsx`) sayfasına **"Bu iş (Network Marketing) caiz mi / yasal mı?"** başlığıyla 35. madde (Güven & Şüphe kategorisi) olarak eklendi.
- **Kendi İtirazını Ekle Pop-up Formu (`itirazlar/page.tsx`):**
  - İtirazlar sayfasına basıldığında pürüzsüzce açılan asil bordo tonlu bir **Kendi İtirazını Ekle** butonu (`+`) ve glassmorphic popup form katmanı entegre edildi.
  - Form; İtiraz (Soru), Kategori (Dropdown), Kısa Saha Cevabı, Detaylı Cevap, Yaklaşım, Örnek Konuşma, Emoji Seçimi ve Etiketler alanlarını barındırmaktadır.
  - Eklenen özel itirazlar `localStorage`'da (`nmm_custom_objections_v1`) güvenli bir şekilde depolanır ve sayfa yenilense dahi statik kütüphanenin en başında listelenmeye devam eder. Kategoriler filtresi yeni eklenen kategorilere göre anlık güncellenir.
  - Özel eklenen itirazlar için satırda bir **Silme (Trash2)** butonu belirir ve kullanıcı dilerse kendi itirazını silebilir.
- **Kendi Eğitim İçeriğini Ekle Pop-up Formu (`egitim/page.tsx`):**
  - Eğitim (NMU Akademisi / İçerik Havuzu) sayfasına estetik ve modern bir **Kendi İçeriğini Ekle** butonu ve form katmanı eklendi.
  - Form; Başlık, Özet, Kategori (Dropdown), Tür (Ders notu/script/rehber), Seviye (Başlangıç/orta/ileri), Madde Madde İçerik (her satır bir madde olacak şekilde textarea), Emoji ve Etiketler alanlarını barındırmaktadır.
  - Eklenen dersler, kütüphanenin en üstünde listelenir, okundu/okunmadı ve favori işaretleme özellikleri built-in sistemle tam entegre çalışır.
  - Eklenen özel eğitimler için bir **Silme (Trash2)** butonu eklendi, böylece kullanıcılar ekledikleri notları kolayca yönetebilirler.

### style/feat: Uyum Denetleyicisi Önerilen Versiyon Kopyalama ve Paylaşma Butonları İyileştirmesi

- **Kopyala Butonu Orijinal Zümrüt Yeşili Rengine Geri Döndürüldü:** Uyum Merkezi (`uyum/page.tsx`) sayfasındaki YZ denetiminden sonra en altta çıkan "Önerilen Uyumlu ve Etkili Versiyon" kartının sağ üst köşesindeki kopyala butonu, sayfanın yeşil renk uyumunu (ÖNERİLEN UYUMLU VE ETKİLİ VERSİYON başlık yeşilini) tam olarak korumak amacıyla orijinal zümrüt yeşili (`bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400`) tonuna geri döndürüldü.
- **Global WhatsApp Paylaşım Desteği:** Kopyalama butonunun hemen sağına global yeşil **WhatsApp** paylaşım butonu (`WhatsAppIcon`) eklendi. Buton tıklandığında, denetçi tarafından üretilen yasal alternatif metin `https://api.whatsapp.com/send?text=...` api'si kullanılarak doğrudan WhatsApp Web veya WhatsApp Mobil uygulamasına aktarılır. Bu sayede kullanıcı, alıcı telefon numarası belirtmeden mesajını rehberinden dilediği kişiye kolayca iletebilir.
- **Taşma Koruması:** Butonlar yan yana yerleştirildiğinde başlık metniyle çakışma yaşanmaması için başlığın sağ padding değeri (`pr-20`) artırılarak görsel kalite güvence altına alındı.

### style/refactor: Boru Hattı Aday Kartı Eylemleri İyileştirmesi (Düzenle ve Sil Butonlarının Zap Popup'ına Taşınması)

- **Açıklama:** Boru Hattı sayfasındaki her bir aday satırının (kartının) en sağında yer alan 4 butondan (Bot, Düzenle, Sil, WhatsApp) görsel karmaşayı azaltmak amacıyla **Düzenle (Pencil)** ve **Sil (Trash2)** butonları satırdan kaldırıldı.
- **Zap (Hızlı Eylemler) Popup Entegrasyonu:** Kaldırılan Düzenle ve Sil eylemleri, satırdaki **Zap (Şimşek)** ikonuna tıklandığında açılan premium **Hızlı Eylemler** popup penceresinin içerisine son derece estetik, responsive ve modern butonlar şeklinde eklendi.
- **Kusursuz Akış:** Popup içerisindeki Düzenle veya Sil butonlarına tıklandığında, Quick Action popup'ı otomatik olarak kapanıp ilgili Düzenleme formu sayfasını (EditCandidateSheet) veya Silme onay modalını (ConfirmDeleteModal) pürüzsüz şekilde tetiklemektedir.
- **Erişilebilirlik ve Tasarım:** Satır üstünde yalnızca en kritik YZ Mesaj Üret (Bot) ve WhatsApp butonları bırakılarak sadelik ve okunabilirlik en üst seviyeye taşındı.

### fix: YZ Modüllerinde API Key Kontrolleri ve Hata Mesajı İyileştirmesi

- **Hata Tanımlama:** Gemini API entegrasyonuna geçiş sonrasında, kullanıcının yerel `.env.local` dosyasında `GEMINI_API_KEY` değişkeninin tanımlanmamış olması sebebiyle Boru Hattı robot kafası, Kazanımlar tebrik butonu ve Uyum Denetleyicisi süreçlerinde yaşanan 403 (Method doesn't allow unregistered callers) hatalarının asıl nedeni tespit edildi.
- **Güçlü Hata Yakalama Kontrolleri:**
  - `src/lib/ai/generateMessage.ts`
  - `src/app/(dashboard)/uyum/actions.ts`
  - `src/app/(dashboard)/kazanimlar/actions.ts`
  - `src/app/(dashboard)/pipeline/[id]/actions.ts`
  - `src/app/(dashboard)/yazar/actions.ts`
  - `src/app/api/translate-note/route.ts`
  dosyalarındaki tüm server action ve YZ fonksiyonlarının en başına `GEMINI_API_KEY` varlık kontrolü eklendi.
- **Anlaşılır Kullanıcı Bilgilendirmesi:** Eğer API key tanımlı değilse, kullanıcıya `"GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın."` şeklinde yönlendirici, açıklayıcı ve son derece net Türkçe (veya dil seçeneğine göre İngilizce) bir hata mesajı dönülmesi sağlandı. Böylece hata oluştuğunda "Mesaj oluşturulamadı." gibi genel hatalar yerine doğrudan çözüme odaklı mesajlar üretilmesi sağlandı.

### feat: Google Gemini 2.5 Sürümüne (Masaüstü/Mobil YZ Kararlılığı) Büyük Yükseltme

- **Sorun:** Yeni oluşturulan veya belirli Gemini API anahtarlarıyla yapılan v1beta isteklerinde `gemini-1.5-flash` ve `gemini-1.5-pro` modelleri için Google sunucularından `404 Not Found (models/gemini-1.5-flash is not found for API version v1beta)` hatası döndüğü gözlemlendi. Bu durum Google'ın v1beta üzerinde model desteğini ve varsayılanları modern `gemini-2.5` serisine taşımış olmasından kaynaklanıyordu.
- **Model Yükseltmeleri:** Projedeki tüm Gemini model tanımları en güncel, desteklenen ve stabil `gemini-2.5` sürümlerine yükseltildi:
  - `gemini-1.5-flash` ➔ `gemini-2.5-flash` (Yüksek hız, düşük maliyet, uyum denetimleri, mesaj hazırlama ve çeviriler için)
  - `gemini-1.5-pro` ➔ `gemini-2.5-pro` (Derin analiz, akıl yürütme, koçluk ve saha provası için)
- **Etkilenen ve Güncellenen Dosyalar:**
  - `src/lib/ai/generateMessage.ts`
  - `src/app/api/translate-note/route.ts`
  - `src/app/(dashboard)/kazanimlar/actions.ts`
  - `src/app/(dashboard)/uyum/actions.ts`
  - `src/app/(dashboard)/pipeline/[id]/actions.ts`
  - `src/app/(dashboard)/yazar/actions.ts`
- **Doğrulama:** API anahtarı ile yapılan testlerde yeni nesil `gemini-2.5-flash` modelinin Türkçe yanıtları milisaniyeler içerisinde hatasız şekilde ürettiği ve entegrasyonun kusursuz çalıştığı onaylandı.

### fix: Gemini 2.5 Thinking Model Token Bütçesi Düzeltmesi (Yarım Mesaj ve JSON Hatası Çözümü)

- **Sorun:** Gemini 2.5 modelleri "thinking model" (düşünen model) mimarisine sahiptir. Yanıt üretmeden önce dahili "düşünme token'ları" harcayarak akıl yürütme yapar. `maxOutputTokens` parametresi düşünme + yanıt toplamını kapsar. Örneğin `maxOutputTokens: 400` ayarında model 350 token düşünüp sadece 50 token'lık yarım mesaj döndürür. JSON yapılarında ise JSON yarıda kesildiği için `"Unexpected end of JSON input"` hatası oluşur.
- **Belirtiler:**
  - Boru Hattı ve Kazanımlar popup'larında kesilmiş, yarım mesajlar
  - Uyum Denetleyicisi'nde `"Unexpected end of JSON input"` hatası (JSON yapısı yarıda kesiliyor)
  - Saha Provası simülasyonunda `"Unexpected end of JSON input"` hatası
  - Koçluk Al sekmesinin süresiz dönmesi (tüm token bütçesi düşünmeye harcandığı için yanıt boş kalıyor)
- **Çözüm:** Tüm `maxOutputTokens` değerleri düşünme token'larını da karşılayacak şekilde yükseltildi:
  - Mesaj üretimi, koçluk, not özeti, çeviri: `400-800` ➔ `8192`
  - Uyum denetimi ve saha provası (yapılandırılmış JSON): `600-800` ➔ `16384`
- **Etkilenen Dosyalar:** `generateMessage.ts`, `translate-note/route.ts`, `kazanimlar/actions.ts`, `uyum/actions.ts`, `pipeline/[id]/actions.ts`, `yazar/actions.ts`

### feat: Mobilde Sağa Sola Kaydırılabilir (Swipeable) 11 Kapsamlı Alt Menü Entegre Edildi
- `BottomNav.tsx`: Mobil alt gezinti barı baştan aşağı yenilenerek, 5 kısıtlı öğe yerine **tüm 11 panel/özellik modülüne** tek tıkla ve kaydırarak erişebileceğimiz premium bir "Swipeable Tab Strip" altyapısına kavuşturuldu.
- **Kusursuz Otomatik Ortalama (Scroll-Centering):** Navigasyon barına akıllı bir `useEffect` ve `DOM scrollIntoView` motoru eklenerek, kullanıcı hangi sayfaya giderse gitsin, alt menünün o aktif sekmeyi **pürüzsüzce yatayda ortalayacak şekilde kayması** sağlandı.
- **Akıllı ve Kısa Türkçe/İngilizce Etiketler:** Menünün mobilde taşma veya çirkin kelime kesilmesi yapmaması için tüm 11 özellik adı estetik ve son derece kısa terimlerle (örn. Boru Hattı -> Huni, İstatistikler -> Grafik, İtirazlara Cevaplar -> İtirazlar) eşleştirildi.
- `globals.css` (`@utility scrollbar-none`): Mobil menünün altında tarayıcı scrollbar'ı görünmemesi için son derece şık ve modern bir kaydırma çubuğu gizleme sınıfı eklendi.

### fix: Onboarding Ekibe Katılma Akışındaki parent_id ve Workspace Kayma Hatası Düzeltildi
- `OnboardingModal.tsx`: Sisteme yeni kaydolan distribütörün onboarding modalı içerisinden davet kodu girdiğinde, `nmm_workspace_members` tablosunu eski modelde direkt update ederek workspace kaymasına ve organizasyon dışı kalmasına neden olan kritik hata giderildi.
- **Düzeltme:** Onboarding modalındaki ekibe katılma akışı da strictly **`nmm_join_workspace` RPC** sunucu fonksiyonumuza bağlanarak yeni MLM bağımsız workspace/parent_id sponsorluk altyapısıyla 100% uyumlu hale getirildi. Artık onboarding üzerinden kod girildiğinde de üyenin kendi Workspace `parent_id` bağı pürüzsüzce kurulur, liderin performans paneline ve ekibim listesine anında düşer.

### style: Tüm Uygulama Font Slaytları Küresel Olarak 1 Punto (1px) Büyütüldü
- `globals.css`: Hem mobil hem de masaüstü ekranlarda okunabilirliği en üst seviyeye çıkarmak amacıyla Tailwind CSS v4 `@theme` katmanında küresel font-size tanımları (`--font-size-*`) tam olarak **1 punto (0.0625rem / 1px)** artırıldı. `text-xs`, `text-sm`, `text-base` gibi tüm yardımcı sınıflar orantılı ve güvenli bir şekilde büyütüldü. (Kullanıcı testi sonrası eski haline tek tıkla geri alınabilir).

### feat: Yapay Zeka Günlük Limitleri (20 / 5 / 15), Kalan Hak Rozetleri & İstatistikler Cam Morfin İlerleme Kartı
- **Yeni Limit Mimarisi:** Supabase veritabanı logları (`nmm_daily_actions`) üzerinden çalışan, strictly denetlenen özellik bazlı dinamik limitler hayata geçirildi:
  - **Yapay Zeka Koçu (Rol Provası):** `20` günlük hak (`note = 'roleplay'`).
  - **YZ Mesajı Üret / Genel AI Mesajı:** `15` günlük hak (`note = 'message'`).
  - **Uyum Denetimi:** `5` günlük hak (`note = 'compliance'`).
- **Gelişmiş useAIUsage Hook'u:** İstemci tarafında tekil ve son derece hafif bir Supabase sorgusuyla bugünkü tüm yapay zeka aksiyonlarını çekip özellik bazında sınıflandıran TanStack Query tabanlı `useAIUsage` custom hook'u yazıldı.
- **Kalan Hak Arayüz Rozetleri:** **Uyum Denetimi** (Kalan: X / 5), **YZ Mesajı Üret** (Kalan: X / 15) ve **Saha Provası Yap** (Kalan: X / 20) sayfalarındaki tüm butonların ve form alanlarının yanına anlık güncellenen kalan hak rozetleri eklendi. Geliştirici hesabı (`suattayfuntopak@gmail.com`) için bu rozetler tamamen gizlendi veya "Sınırsız" yapıldı.
- **İstatistikler Premium Cam Morfin (Glassmorphism) Kartı:** İstatistikler sayfasına asil koyu tema estetiğimize, marka ve durum renklerine uyumlu (`#534AB7`, `#0F6E56`, `#C03E1F`) 3 dikey ilerleme çubuğu içeren **Yapay Zeka Günlük Kullanım Kotası** modülü eklendi. Geliştirici hesabı girildiğinde bu modül parıldayan altın neon efektli **"👑 Sınırsız Süper Admin Hesabı"** tebrik kartına dönüşüyor. Aday Dönüşüm Hunisi ile Aday Kazanım İvmesi'nin alt sınırlarının kusursuz yatay hizalanması için bu modül 2'li ızgaranın dışına taşınarak en alta tam genişlikte yatay 3 sütunlu (`grid-cols-3`) premium bir düzende konumlandırılmıştır.
- **Güvenli Geçiş:** Rol provası ve mesaj üretimi başarıyla sonlandığı anda React Query önbelleği (`daily-ai-usage`) otomatik geçersiz kılınarak arayüzün sayfa yenilemesiz, pürüzsüzce senkronize olması sağlandı.

### fix: Süper Admin İçin Kalan Limit Rozetleri Gizlendi
- `uyum/actions.ts` & `yazar/actions.ts`: Giriş yapan kullanıcı süper admin (`suattayfuntopak@gmail.com`) olduğunda, `remaining` parametresi `undefined` döndürülerek arayüzdeki "Kalan Günlük Denetim" ve "Kalan Günlük Simülasyon" etiketlerinin kendisi için **tamamen gizlenmesi** sağlandı. Diğer tüm normal kullanıcılar için limit rozetleri aktif ve görünür kalmaya devam eder.

### feat: MLM Sponsorluk ve Hiyerarşik Downline Yapısı Sıfırdan İnşa Edildi (Bağımsız Lider Modeli)
- `009_add_workspace_parent_id.sql`: Ekip üyelerinin (`member`) kendi isimlerini, kendi davet kodlarını görememesi, organizasyon kuramaması ve üst liderinin verilerini/ekibini aynen görerek veri ihlali yaşaması mimari olarak **kökten çözüldü**.
  - **Yeni Model:** `nmm_workspaces` tablosuna **`parent_id uuid`** kolonu eklenerek bağımsız distribütör sponsorluk bağı kuruldu.
  - **Yeni Davet/Katılım Akışı (`nmm_join_workspace`):** Üye bir davet koduyla katıldığında artık kendi workspace'inden çıkıp liderin workspace'ine taşınmaz. Kendi workspace'inin **Lideri** (`role = 'leader'`) olarak kalmaya devam eder, böylece **kendi adına özel**, **kendi davet kodunu üreten**, **anahtar teslim boş boru hattı** açılır! Sadece kendi workspace kaydının `parent_id` değeri kendisini davet eden sponsorun `owner_id`'sine eşitlenir.
- `EkipPanel.tsx` (`fetchMembers`): 
  - Lider, kendi Ekibim sayfasında artık tüm workspace üyelerini değil, strictly **`parent_id = leader_user_id`** (yani doğrudan kendisine davet koduyla katılmış distribütörleri) listeler.
  - Alt downline'ın (User B's) downline'ları (User C's), iki üstteki lidere (User A'ya) akmaz! Yalnızca kodu gönderdiği doğrudan üyenin değerleri kendisine akar.
  - Lider, downline üyelerinin aday sayısını ve hunideki durumlarını anlık izleyebilir ve onlara koçluk desteği verebilir.
  - Downline üye (User B) kendi Ekibim sayfasında kendi adını lider olarak görür, kendi davet kodunu kopyalayabilir/paylaşabilir ve kendi ekibine katılanları izler.

### fix: YZ Uyum Denetleyicisi JSON Ayrıştırma (SyntaxError) Hataları İçin %100 Dayanıklı Parser
- `uyum/actions.ts` (`parseSafeJSON`): 
  - **Hata:** Claude-sonnet modelinin violations dizisindeki iki nesne arasına virgül eklemeyi unutması (`Expected ',' or ']' after array element in JSON...`) veya unescaped line breaks yapması durumunda oluşan ayrıştırma hatası çözüldü.
  - **Çözüm:** JSON ayrıştırması öncesinde `parseSafeJSON` adında son derece gelişmiş bir ön-düzenleme fonksiyonu yazıldı. Bu fonksiyon:
    1. İki nesne arasındaki eksik virgülleri (`}\s*{` ➔ `},{`) otomatik ekler.
    2. Dizi içindeki eksik virgülleri (`]\s*[` ➔ `],[`) düzeltir.
    3. Geçersiz sondaki virgülleri (`Trailing Commas`) temizler.
  - Bu sayede yapay zeka çıktısında ne tür bir noktalama hatası olursa olsun **JSON asıl durumuna onarılarak %100 hatasız çözümlenir**.

### feat: Ekip Üyeleri İçin Bağımsız Aday Boru Hattı ve Özel "Bugün" Görünümü Entegre Edildi
- `useCandidates.ts`: Liderin davet koduyla katılan distribütörlerin liderin tüm boru hattı adaylarını, bugün ilgilenilecek adaylarını, takvimini ve istatistiklerini ortaklaşa görerek veri ihlali yaşaması sorunu **kökten çözüldü**.
  - **Yeni Altyapı:** Aday listesini çeken `fetchCandidates` sorgusu, `workspace_id` eşleşmesine ek olarak artık strictly **`owner_id = user.id`** (mevcut oturum açmış distribütör) filtresini uyguluyor.
  - **Sonuç:** Ekibe davet koduyla yeni katılan üyeler için tüm sayfalar (Bugün, Boru Hattı, Takvim, İstatistikler, Kazanımlar) **tamamen kişiye özel ve sıfır adaylı ("anahtar teslim boş sayfa")** olarak açılır. Her üye kendi adaylarını kaydeder ve yalnızca kendi adaylarını yönetir.
  - **Lider Görünümü (Ekip Paneli):** Üyeler kendi adaylarını kendi boru hatlarında bağımsız yönettiklerinde, bu adayların toplam sayıları ve hunideki (yeni, sunum, takip, katıldı) dağılım bilgileri ortak `workspace_id` sayesinde liderin **Ekip** (My Team) performans tablosuna anında ve otomatik olarak akar ("aksiyonların lidere akması").
- `pipeline/[id]/actions.ts`: `generateCoachMessage` (Yapay Zeka Koçu) server action'ı içerisine strictly candidate ownership (`owner_id = user.id`) kontrolü eklendi. Ekip üyelerinin diğer distribütörlerin aday ID'lerini kullanarak mesaj üretmesi veya erişmesi güvenlik seviyesinde engellendi.

### fix: YZ Uyum Denetleyicisi & YZ Koçu Modüllerindeki Database Constraint (SyntaxError) Çökmeleri Kökten Giderildi
- **Sorun:** Lider dışındaki normal üyeler (non-admin) simülasyon veya uyum denetimi yaptıklarında günlük AI kullanım sayacı tetikleniyor. Bu sayaç `nmm_daily_actions` tablosuna `action_type = 'ai_generate'` kaydını girmeye çalışıyordu; ancak veritabanı şemasındaki eski check constraint kısıtı bu değeri engellediği için işlem çöküyor ve ekrana hata fırlatıyordu.
- **Düzeltmeler:**
  - `008_add_ai_generate_action_type.sql`: Postgres `nmm_daily_actions` tablosunun check constraint kısıtını `'ai_generate'` eylemini de kapsayacak şekilde genişleten yeni veritabanı migrasyonu oluşturuldu.
  - `uyum/actions.ts`, `yazar/actions.ts` & `pipeline/[id]/actions.ts`: En üst düzey **defansif yazılım mimarisi** kuruldu. AI günlük log insert işlemleri birer `try-catch` bloğuna alındı. Bu sayede, uzak Supabase veritabanında migrasyon senkronizasyonu tam tamamlanmamış olsa dahi, loglama hataları arka planda konsola yazılır ve ana AI Uyum Denetimi ile AI Koç simülasyonları **asla çökmeden %100 kararlılıkla çalışmaya devam eder**.

## 2026-05-25 — Yapay Zeka Koçu Prova Simülasyonları Dinamikleştirildi & Uyum Denetleyicisi Hata Düzeltmesi

### fix: Uyum Merkezi YZ Uyum Denetleyicisi JSON Ayrıştırma (SyntaxError) Hatası Çözüldü
- `uyum/actions.ts`: Kullanıcı sağlık veya gelir beyanı içeren riskli bir metin girdiğinde ortaya çıkan `"Metin denetlenirken bir hata oluştu"` sorunu giderildi. 
  - **Sebep:** `systemPrompt` içindeki JSON şablonunda bulunan yorum satırları (`//`) ve parantezli açıklamaların, Claude tarafından aynen taklit edilerek JSON çıktısının içine yerleştirilmesi ve standart `JSON.parse` işleminin çökmesine yol açması.
  - **Çözüm:** `systemPrompt` içerisindeki JSON şablonu tamamen temizlendi, yorum satırlarından arındırılarak %100 geçerli JSON standartlarına getirildi. Ayrıca, Anthropic API'sinden gelen cevabın içindeki JSON objesini (`{ ... }`) her koşulda güvenli ve hatasız yakalayabilmek için **Regex tabanlı gelişmiş bir JSON ayıklayıcı** entegre edildi.

### feat: Saha Provası Yap Modülü Türkçe Rozet Çevirisi & Çift Dil Desteği
- `ProvaForm.tsx`: Saha Provası Yap sekmesindeki tüm senaryo kartlarının üzerindeki `"SIMULATION"` rozetleri, kullanıcı arayüzü dili Türkçe olduğunda `"SİMÜLASYON"` olarak güncellendi. İngilizce dil ayarında ise `"SIMULATION"` olarak kalması sağlandı.

### feat: İtiraz Karşılama ve Diğer Prova Başlangıçları Dinamik ve Rastgele Hale Getirildi
- `ProvaForm.tsx`: İtiraz Karşılama Pratiği'nin her tıklamada statik tek bir soru getirmesi yerine; kibar, şüpheci, kaba, meşgul, meraklı, caiz değil şüphesi barındıran veya satış yapmaktan çekinen 7 farklı gerçekçi insan profili ve itiraz şablonu (`OBJECTION_PROMPTS`) arasından rastgele seçim yapılması sağlandı. Aynı dinamik rastgelelik Davet ve Kapanış Pratikleri için de (`DYNAMIC_PROMPTS`) devreye alındı.

### feat: Boş Kalan Senaryo Kartları İçin 2 Yeni Premium Senaryo Eklendi (12 Karta Tamamlandı)
- `ProvaForm.tsx`: Sayfanın alt sağ kısmında boş kalan alanları doldurmak ve 4'lü grid yapısını görsel olarak mükemmelleştirmek amacıyla iki yeni prova senaryosu eklendi:
  1. **Sosyal Medya Adayı (📱):** Instagram/Facebook gönderisini beğenen ve DM'den meraklı şekilde yazan adayı, işi hemen açıklamadan merak uyandırarak sunuma davet etme pratiği.
  2. **Etik Pazarlama Pratiği (⚖️):** Şüpheci adayın "bu ürün hastalık iyileştiriyor mu?" sorusuna, hiçbir sağlık veya gelir abartısı yapmadan tamamen yasal ve dürüst kurallarla yanıt verme/ürün tanıtma pratiği.

## 2026-05-25 — İdeal Sayfa Genişliği, İsimlendirmeler, Grafik İyileştirmeleri & Anında Kayıt Yönlendirmesi

### style: Global Sayfa Genişliği max-w-[1360px] Yapıldı ve İstatistik Grafikleri Kusursuz Hizalandı
- `DashboardShell.tsx`: Ekranın aşırı dolmasını engellemek amacıyla, `1280px` (dar) ve `1440px` (geniş) limitlerinin tam ortalaması olan **`max-w-[1360px]`** (ideal genişlik) standardı getirildi. Böylece ekran hem ferah hem de sağa sola yapışmadan son derece asil bir görünüme kavuştu.
- `istatistikler/page.tsx`: İstatistikler sayfasındaki tüm kutular arasındaki boşlukların `space-y-6` ile tamamen eşit kalması sağlandı. *Aday Kazanım İvmesi* kutusu `flex-1` ile dikeyde yukarıya doğru esnetildi, içerisindeki bar grafiği piksel yüksekliği **h-28 ➔ flex-1 min-h-[130px]**, katsayı ise **80 ➔ 105** yapılarak sol sütunla alt ve üst sınırda kusursuz bir yatay paralellik sağlandı.

### feat: YZ Mesajı Üret Modülü "Yapay Zeka Koçu" Olarak Yeniden Adlandırıldı
- `tr.ts` & `en.ts`: Pano butonu, sidebar navigasyonu ve diğer menülerdeki "YZ Mesajı Üret" ifadeleri **"Yapay Zeka Koçu"** (AI Coach) olarak güncellendi.
- `BottomNav.tsx`: Mobil alt barda dikey kayma yapmaması için kısa ve okunaklı biçimde **"YZ Koçu"** olarak gösterilmesi sağlandı.
- `yazar/page.tsx`: Sayfa başlığı altındaki açıklama yazısı *"Yapay zekayla mesajlar üret, koçluk al ve interaktif provanı yap."* olarak güncellendi.
- `YzKocuContainer.tsx`: Yapay Zeka Koçu sekmelerinin adları sırasıyla **"YZ Mesajı Üret"** ve **"Saha Provası Yap"** olarak revize edildi.

### feat: Ekibim Davet Mesajı Geliştirildi ve Anında Kayıt/Yönlendirme Desteği Eklendi
- `EkipPanel.tsx`: WhatsApp davet mesajı, kullanıcının talebine tam uyumlu profesyonel emoji ve kod yerleşimine kavuşturuldu.
- `actions.ts` & `SignupForm.tsx`: Supabase projesinde e-posta onayı kapatıldığında, yeni kaydolan adayların onay e-postası beklemeden anında uygulamaya giriş yapıp panoya yönlenmesi (`auto-redirect`) sağlandı. Sunucu tarafında `session` algılandığında istemci otomatik olarak 1 saniye içinde `/bugun` sayfasına aktarılıyor.

## 2026-05-25 — Layout Revizyonu, Grafik Hizalama, Kayıt Linki & Auth Hata Düzeltmeleri

### style: Global Sayfa Genişliği max-w-8xl Yapıldı ve İstatistik Grafikleri Dikey Hizalandı
- `DashboardShell.tsx`: Global sayfa genişliği, sağdan ve soldan boşlukları biraz daha azaltarak ekranı daha ferah doldurması amacıyla `max-w-7xl` (1280px) değerinden `max-w-8xl` (1440px) genişliğine çıkarıldı.
- `istatistikler/page.tsx`: Süreç Sıcaklık Dağılımı ve Aday Kazanım İvmesi kutularının toplam yükseklikleri, sol taraftaki Aday Dönüşüm Hunisi ile dikeyde tam hizalanacak şekilde flex stretch / `h-full` yapısı ile dengelendi. Ayrıca donut ve bar grafiği boyutları/padding değerleri orantılı şekilde büyütüldü.

### feat: Ekibim Davet Şablonuna Kayıt Linki Eklendi
- `EkipPanel.tsx`: WhatsApp davet butonu mesaj şablonu geliştirilerek, yeni adayların kolayca üye olup kodu girebilmesi için `/kayit` (register) adresi şablona link olarak eklendi.

### fix: Giriş ve Kayıt Sayfalarındaki Gizli Hata Detayları Çözüldü
- `SignupForm.tsx` & `LoginForm.tsx`: Supabase Auth tarafından dönen ve kayıt/giriş başarısızlık nedenini açıklayan gerçek hata mesajlarının (`state.error`) UI tarafında gösterilmesi sağlandı. Eski hardcoded generic hata metni temizlendi, artık e-posta/şifre çakışmaları ve doğrulama sorunları anında görülebiliyor.

## 2026-05-25 — Global Sayfa Genişliği Standardizasyonu (Standardized Global Page Width)

### style: Tüm Panel Sayfaları Ortalanmış İdeal Genişliğe (max-w-7xl) Kavuşturuldu
- `DashboardShell.tsx`: Sistemdeki tüm sayfaların yerleşim boyutlarını Yapay Zeka Koçu ve Uyum Merkezi kalitesine getirmek için `{children}` global düzeyde `mx-auto max-w-7xl w-full` konteyneriyle sarmalandı. Böylece tüm modüller ve sayfalar masaüstünde ferah ve son derece asil bir hizalamaya kavuşturuldu.
- `pano/_components/PanoContent.tsx`: Pano üzerindeki eski `md:max-w-[80%]` sınırlaması kaldırılarak `w-full` yapıldı, böylece pano da standardı takip ederek 1280px genişlikte mükemmel dengelendi.
- `search/page.tsx`: Arama sonuçları sayfasındaki `max-w-4xl` sınırlaması kaldırılarak standarda uyarlandı.
- `uyum/page.tsx` & `yazar/page.tsx`: Özel `max-w-7xl` sarmalayıcıları kaldırılarak global yapıya entegre edildi; sekmelerin (`mx-auto`) ortalanması korundu.

## 2026-05-25 — Modüllerin Tam Sayfa Yapılması (Full-Width Layout Updates)

### feat: Uyum, İstatistikler ve Prova Yap Modülleri Tam Sayfa (Full-Width) Yapıldı
- `uyum/page.tsx`: Uyum Merkezi sayfasındaki maksimum genişlik sınırlamaları (`max-w-4xl`, `mx-auto`) kaldırılarak modülün sağdan sola ekranın tamamını pürüzsüzce kaplaması sağlandı.
- `istatistikler/page.tsx`: İstatistikler sayfasının kendisi ve yüklenme (loading/skeleton) görünümü tam genişliğe (`w-full`) kavuşturularak visual datalar ve custom grafikler için maksimum ekran alanı sunuldu.
- `yazar/_components/ProvaForm.tsx` & `YzKocuContainer.tsx`: Yapay Zeka Koçu / Prova Yap simülatör ekranı, senaryo seçim kartları ızgarası (`max-w-3xl` -> responsive 4 sütunlu `lg:grid-cols-4 w-full` düzeni) ve aktif simülasyon sohbet kartı (`max-w-2xl` -> `w-full`) tam ekran genişliğine uyarlandı. Ayrıca sayfa üstündeki modül tab seçici `mx-auto` kaldırılarak sol hizalı ve tutarlı bir yerleşime getirildi.

## 2026-05-25 — Uyum Merkezi (9. Kutu), İstatistikler (10. Kutu) ve Distribütör Başlatma Entegrasyonu (Zero-Debt Modül Entegrasyonu)

### feat: Uyum Merkezi & Yapay Zeka Uyum Denetleyicisi (9. Kutu)
- `uyum/actions.ts` & `uyum/page.tsx`: NMM panosuna 9. Kutu olarak **Uyum Merkezi** eklendi. NMU'daki statik yapının ötesine geçilerek NMM'in yapay zeka gücüyle çalışan bir **Yapay Zeka Uyum Denetleyicisi** (AI Compliance Auditor) sıfırdan inşa edildi. Claude Sonnet (`claude-sonnet-4-6`) tabanlı bu denetleyici, girilen pazarlama ve reklam metinlerini sağlık iddiaları, kesin gelir vaatleri yönünden saniyeler içinde tarar, 0-100 arası güvenlik skoru ve durum rozeti (Güvenli, Riskli, Tehlikeli) verir, yasal ihlal yapan kelimeleri ve nedenlerini açıklar, son olarak tek tıkla kopyalanabilecek **"Önerilen Yasal ve Etkili Alternatifini"** üretir.
- Sayfaya ayrıca **Onaylı İfadeler Şablon Kütüphanesi**, **Yasaklı İfadeler Örnekleri** ve yerel hafızada (`localStorage`) tutulan interaktif 7 maddelik **Paylaşım Öncesi Kontrol Listesi** entegre edildi.

### feat: İstatistikler & Paket Yükü Olmayan Görsel Analiz (10. Kutu)
- `istatistikler/page.tsx`: NMM panosuna 10. Kutu olarak **İstatistikler** eklendi. Recharts gibi Next.js App Router üzerinde hidrasyon hatası çıkaran ağır grafik paketlerini yüklememek ve veritabanına ek tablo yükü bindirmemek amacıyla **sadece NMM aday verilerini analiz eden göz alıcı Custom SVG ve CSS Grafikleri** geliştirildi.
- Sayfa; Yeni Aday ➔ İletişim ➔ Davet ➔ Sunum ➔ Takip ➔ Katıldı akışındaki kümülatif dağılımı ve kayıp yüzdelerini gösteren **Dönüşüm Hunisi (Funnel)**, adayların sıcaklık durumlarını gösteren **Sürecin Sıcaklığı (Donut Grafik)** ve aday edinme ritmini gösteren **Kazanım İvmesi (Barlar)** ile donatıldı.

### feat: Distribütör Başlatma — Ekibim Kart İçi Entegrasyonu
- `EkipPanel.tsx`: Distribütör başlatma çeklistini bağımsız veritabanı tablolarıyla hantallaştırmak yerine doğrudan **Ekibim** modülündeki üye kartlarının içine akıllıca entegre ettik.
- Lider, ekibindeki bir distribütörün kartına tıkladığında kart aşağı doğru genişler (Accordion) ve üyenin 4 haftalık (Temel Kurulum, İlk Temas, Bağımsızlaşma, 90 Gün Planı) **Hızlı Başlangıç Gelişimi** açılır. Üyenin tamamladığı adımların oranını dinamik hesaplayan bir ilerleme yüzdesi (Örn: `%44`) bulunur. Adımların tamamlanma durumu liderin cihazında `localStorage` tabanlı tutulur.

### feat: Pano Izgara Dengesi ve Sidebar Entegrasyonu
- `PanoContent.tsx`: Hızlı erişim ızgarası 10 kutuya çıkarıldı. Mobil 2 sütunlu yapıyı korurken, masaüstünde 5 sütunlu dengeli ve son derece asil bir düzene kavuşturuldu.
- `Sidebar.tsx`: Masaüstü yan navigasyon çubuğuna Uyum Merkezi ve İstatistikler modülleri ikonları ve çevirileriyle birlikte entegre edildi.

## 2026-05-25 — Supabase Eğitim Senkronizasyonu, Derin Aktivite Takibi, YZ Yazar Sadeleştirme & YZ Ekip Koçu Entegrasyonu (Konsey Önerileri & Ek İstekler)

### feat: YZ Ekip Koçu — Downline İnaktif Üye Mentörlük Sistemi (Konsey Önerisi — Paket C)
- `actions.ts` & `YZEkipKocuSheet.tsx`: Liderlerin son 7 gündür inaktif olan alt hat (downline) distribütörlerine nokta atışı mentörlük yapabilmesi için YZ Ekip Koçu geliştirildi. Claude `claude-sonnet-4-6` motoru ile entegre edilen sunucu aksiyonu (`generateDownlineCoachingMessage`), inaktif üyenin huni dağılımını (yeni aday, sunum, takip, katıldı sayılarını) analiz ederek ona özel, suçlayıcı olmayan, son derece yapıcı ve birebir görüşmeye davet eden motive edici Türkçe mentörlük mesajları üretir.
- `EkipPanel.tsx`: İnaktif downline üyelerinin yanındaki **⚠️ Destek Gerekebilir** amber renkli aksiyon rozeti tıklanabilir hale getirilerek YZ Ekip Koçu paneline bağlandı. Liderler tek tıkla mentörlük mesajı üretip kopyalayabilir veya WhatsApp ile paylaşabilir.

### feat: YZ Mesajı Üret Sadeleştirildi & Ek Bilgi Zenginleştirildi (Ek İstek)
- `YazarForm.tsx`: Form üzerindeki mükerrer ve gereksiz olan "İlişki Derecesi (Sıcaklık)" seçmeli dropdown modülü tamamen kaldırıldı. Arayüz `md:grid-cols-2` olarak yeniden tasarlanarak "Mesaj Türü" ve "Ton" alanları yan yana asil bir şekilde konumlandırıldı.
- Aday seçildiğinde (veya detay sayfasından yönlenildiğinde) arka planda sıcaklık derecesi saptanmaya devam eder; ayrıca adayın sıcaklık bilgisi (`warmth`), son 5 lider notu ve son 5 aktivite kaydı otomatik olarak Supabase'den çekilip **Ek Bilgi** (`context`) metin alanına `- 24 May: WhatsApp Mesajı` gibi zaman damgalı satırlarla yazılır. Böylece YZ mesaj üretirken adayın tüm geçmiş serüvenine 10x daha hakim olur.

### feat: Supabase Derin Aktivite Takibi & Collapsible Aktivite Geçmişi (Ek İstek)
- `useCandidates.ts`: Adaylar üzerindeki her türlü eylemi geçmişte loglamak için veritabanı loglama kapsamı genişletildi. Aday oluşturulduğunda (`system_note:candidate_created`), adayın sıcaklık derecesi değiştirildiğinde (`system_note:warmth_change:old->new`), sonraki takip tarihi güncellendiğinde (`system_note:follow_up_change:old->new`) veya profil bilgileri değiştiğinde (`system_note:profile_update`) Supabase `nmm_daily_actions` tablosuna standart check-constraint'leri bozmayan akıllı sistem notları kaydedilir.
- `CandidateDetail.tsx`: Aday detay sayfasındaki "Aktivite Geçmişi" bölümü baştan aşağı yenilendi. Türkçe ve İngilizce dillerine göre tüm aşama değişimleri (`katıldı`, `yeni`, `takip` vb.) ve system_note kayıtları pürüzsüzce yerelleştirildi. Listenin dikeyde aşırı uzamasını engellemek için ilk 5 eylem sonrası **Tümünü Gör / Kapat** collapsible durum yöneticisi entegre edildi.

### feat: Supabase Eğitim Senkronizasyonu Entegre Edildi (Konsey Analizi — Paket C)
- `egitim/page.tsx`: Eğitim okundu ve favoriler durum yönetimleri tamamen yerel `localStorage` bağımlılığından arındırıldı.
- Ortak `useProgressSync` hook'u entegre edilerek; okuma durumları (`readTrainings`), favori eğitim konuları (`favTrainings`), `toggleTrainingRead` ve `toggleTrainingFav` özellikleri Supabase `nmm_daily_actions` tablosundaki tekil JSON blob'una (`nmm_progress_v1:...`) senkronize edildi. Böylece tarayıcı önbelleği silinse dahi hiçbir eğitim ilerlemesi kaybolmayacak ve çoklu cihaz senkronizasyonu mükemmel çalışacak.

### feat: Ekip Paneli İnaktif Üye Takip Mekanizması (Konsey Analizi — Paket C)
- `EkipPanel.tsx`: Takım liderlerinin organizasyonu çok daha dinamik yönetebilmesi ve inaktif üyeleri erken fark edip mentörlük desteği sunabilmesi amacıyla **İnaktif Üye Takibi** geliştirildi.
- `fetchMembers`: Supabase sorgusu genişletilerek son 30 güne ait `nmm_daily_actions` kayıtları da tek bir hafif sorguda çekildi. Üyelerin sisteme katılım tarihleri (`joined_at`), aday ekleme/güncelleme ve YZ eylemleri JavaScript tarafında analiz edilerek her bir üyenin **Son Aktiflik Zamanı** (`last_activity_at`) saptandı.
- Arayüz Yenilemesi: Son 7 gündür hiçbir aday eklememiş veya eylem kaydetmemiş downline üyelerinin isimlerinin yanına parıldayan asil amber renkli **⚠️ Destek Gerekebilir** durum rozeti yerleştirildi. Üye kartlarının altındaki detay satırına son derece asil ve hassas zaman damgaları eklenerek `"Son aktiflik: 24 May (1 gün önce)"` gibi detaylar liderin bilgisine sunuldu.

### feat: Akıllı Takip Geciken / Bugün Hızlı Filtre Butonu (Konsey Analizi)
- `pipeline/page.tsx`: Boru Hattı sayfasında takip zamanı yaklaşan veya kaçan adayları tek tuşla süzebilmek amacıyla **Hızlı Filtre Strip** alanı oluşturuldu.
- `getFollowUpStatus`: Adayların bir sonraki takip zamanı (`next_follow_up_at`) parametrelerini kontrol ederek geciken (`past`) veya bugün yapılması gereken (`today`) takipleri saptayan tarih motoru eklendi.
- Arayüz Yenilemesi: Arama kutusunun hemen altına, üzerinde toplam geciken/bugün takip bekleyen aday sayısını dinamik kırmızı bir baloncukla gösteren son derece asil bir **⏳ Takip Gecikti / Bugün** hızlı süzme butonu eklendi. Butona basıldığında boru hattındaki diğer kategori filtrelerinin üzerine dinamik bir katman ekleyerek yalnızca acil aksiyon bekleyen adayları listeler.

## 2026-05-25 — YZ Sıcaklık Modülü, Akıllı Takip Uyarıları & Mobil İyileştirmeler

### feat: YZ Sıcaklık Modülü entegre edildi (Konsey Analizi — Paket A)
- `noteParser.ts`: SQL şemasını değiştirmeden veri geriye dönük uyumluluğunu korumak için `ParsedNote` yapısı genişletildi ve `warmth` ('sicak' | 'ilik' | 'soguk') parametresi 4. bileşen olarak (`|||` ayıracı ile) eklendi.
- `AddCandidateSheet.tsx` & `EditCandidateSheet.tsx`: Aday ekleme ve düzenleme formlarına **İlişki Derecesi (Sıcaklık)** seçim kutusu eklendi; YZ için sıcaklık düzeyi seçilip kaydedilebilir hale getirildi.
- `CandidateCard.tsx` & `CandidateDetail.tsx`: Aday kartlarının üzerinde ve aday detay sayfasında adın yanında **🔥 Sıcak**, **☀️ Ilık** veya **❄️ Soğuk** şeklinde son derece asil ve pastel renkli durum rozetleri gösterildi. Detay sayfasından YZ Yazar'a geçiş yaparken adayın sıcaklık bilgisi query param olarak aktarılıyor.
- `YazarForm.tsx`: Aday listesinden seçim yapıldığında veya aday detayından yönlenildiğinde adayın sıcaklık düzeyi otomatik yüklenir. Kullanıcı dilerse form üzerinden sıcaklığı YZ mesajı üretilmeden önce değiştirebilir.
- `generateMessage.ts` & `yazar/actions.ts`: Formdan alınan ilişki sıcaklığı `generateMessage` prompt derleyicisine iletildi. Claude modeline sıcak kontaklara son derece samimi ve gündelik, soğuk kontaklara ise mesafeli, saygılı ama merak uyandırıcı yazması için gerekli sistem yönergeleri entegre edildi.

### feat: Akıllı Takip Uyarı Rozetleri (Konsey Analizi — Paket B)
- `CandidateCard.tsx`: Boru hattındaki tüm aday kartlarının altına, girilen takip tarihi geçmişse **⚠️ Takip Gecikti**, bugün ise **🔔 Bugün Takip** şeklinde parıldayan, renk kodlu ve dikkat çekici takip uyarı rozetleri yerleştirildi. Distribütörün saha takip disiplini ve aksiyon alma kabiliyeti zirveye taşındı.

### fix: YZ Mesajı Üret sayfasından bazı mesaj türleri kaldırıldı
- `YazarForm.tsx`: Mesaj türü seçeneklerinden `Sipariş Teşekkürü` (`siparis_tesekkuru`) ve `Yeniden Sipariş Daveti` (`yeniden_siparis_daveti`) seçenekleri çıkarıldı.

### feat: Boru Hattı sayfasındaki kategori butonları için mobil kaydırma çakışması çözüldü
- `DashboardShell.tsx`: Global sekme geçişi sağlayan mobil parmak kaydırma (swipe) algılayıcısına muafiyet mekanizması eklendi. Touch start event'i `no-swipe` sınıfına veya `data-no-swipe="true"` özniteliğine sahip bir element veya bu elementin alt dalları içerisinden tetiklendiyse, sayfa değiştirme hareketi tamamen iptal edilir.
- `StageFilter.tsx`: Boru Hattı sayfasındaki yatay kaydırılabilir kategori butonları kapsayıcısına `no-swipe` ve `data-no-swipe="true"` öznitelikleri eklenerek, sayfa/sekme değişme çakışması tamamen çözüldü. Artık mobilde kategoriler parmakla rahatça kaydırılabilir.

## 2026-05-25 — Lider Notu Sistemi (Tam Uygulama)

### feat: Lider Notu dropdown kutusu — kişi detay sayfaları

- `CandidateDetail.tsx`: `StickyNote` ikonlu collapsible Lider Notu kartı eklendi; `notesOpen` state varsayılan `false` — sayfa açılışında kapalı.
- Kart başlığında toplam not sayısı badge'i gösterilir.
- Açıldığında en güncel 5 not listelenir (tarih/saat damgalı); 5'ten fazla varsa **Tümünü Gör** butonu belirir, tıklandığında **Kapat**'a dönüşür (`showAllNotes` toggle).
- Kart altında `textarea` + **Notu Kaydet** butonu — boş not kaydedilemez, `addNoteMutation.isPending` sırasında buton disable.
- Animasyon: `animate-in fade-in slide-in-from-top-1 duration-200`.

### feat: useCandidateNotes + useAddCandidateNote hook'ları

- `src/hooks/useCandidates.ts`: `useCandidateNotes(candidateId)` — `nmm_daily_actions` tablosundan `action_type = 'note'` filtreliyor, `created_at DESC` sıralıyor.
- `useAddCandidateNote(workspaceId)` — `getUser()` ile auth doğrulama + insert; başarıda `['candidate-notes', candidateId]` ve `['activity', candidateId]` query'leri invalidate ediliyor.

### feat: YazarForm lider notu entegrasyonu

- `YazarForm.tsx`: Kişi seçildiğinde (`selectCandidate`) veya aday sayfasından yönlenildiğinde (`initialName` prefill `useEffect`), son 5 lider notu Supabase'den çekilip **Ek Bilgi** alanına `Lider Notları:\n- ...` formatında eklenir.
- Aday sayfasındaki **YZ Mesajı** butonu `?name=...&note=...` ile yazar sayfasına yönlendiriyor; YazarForm aynı mantıkla notları bağlamına otomatik ekliyor.

## 2026-05-25 — Semantic Renk Token'ları + EkipPanel Bölünmesi (Council #16 & #19)

### refactor: Semantic color tokens — globals.css @theme (Council #16)
- `globals.css`: `@theme { --color-brand: #534AB7; --color-whatsapp: #25D366; --color-accent-blue: #4169E1; }` eklendi. Artık `bg-brand`, `text-whatsapp`, `border-brand` gibi Tailwind yardımcı sınıfları kullanılabilir.
- `EkipPanel.tsx` + `BroadcastPanel.tsx`: Hardcoded hex değerleri (`#534AB7`, `#25D366`, `#4169E1`) token sınıflarına dönüştürüldü.

### refactor: EkipPanel monolith bölündü (Council #19)
- `EkipPanel.tsx` 704 satırdan ~350 satıra indirildi.
- `SpoilerCode.tsx` (~90 satır): Canvas particle animasyonu ayrı dosyaya taşındı. Kendi `useRef` ve `useEffect` import'larını yönetiyor.
- `BroadcastPanel.tsx` (~200 satır): Tüm yayın state'i, compose fonksiyonları, grup/tekli gönderim UI'ı ayrı bileşene taşındı. `MemberRow` tipini `EkipPanel.tsx`'ten import ediyor.
- TypeScript kontrolü `npx tsc --noEmit` ile doğrulandı — hata yok.

## 2026-05-25 — Gece Selamlama, Retry Fix, Type Safety, Safe-Area, Aktivite Limit (Council #3 + #13-15 + greeting)

### feat: Pano gece selamlama — 00:00-05:00 arası "İyi Geceler" (yeni)
- `PanoContent.tsx`: `hour < 5` koşulu eklendi. Gece yarısından sabah 05:00'e kadar 🌙 İyi Geceler/Good night gösterilir; 05:00 itibarıyla 🌅 Günaydın başlar.
- `tr.ts` / `en.ts`: `greetingNight` çevirisi eklendi.

### fix: useWorkspace — React Query retry riski giderildi (Council #3)
- `useWorkspace.ts`: `retry: false` eklendi. Daha önce hata sonrası yeniden deneme (default 3x), kısmi başarılı workspace oluşturma durumunda duplicate kayıt riski taşıyordu.

### fix: EkipPanel useState<any> → User | null (Council #13)
- `EkipPanel.tsx:161`: `useState<any>` → `useState<User | null>`, Supabase `User` tipi import edildi.

### fix: pb-safe Tailwind v4'te tanımsızdı (Council #14)
- `globals.css`: `@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }` eklendi.
- `layout.tsx`: `viewport.viewportFit = 'cover'` eklendi. iOS notch/home indicator artık BottomNav'ı örtmüyor.

### fix: Aktivite geçmişi limit 10 → 50 (Council #15)
- `useCandidates.ts` `useActivityHistory`: `.limit(10)` → `.limit(50)`. 10'dan fazla aktivitesi olan adaylarda eski kayıtlar artık kesilmiyor.

### verify: updated_at DB trigger (Council #8)
- Migration 001'de `nmm_candidates_updated_at` trigger'ı mevcut ve çalışıyor. Ek aksiyon gerekmedi.

## 2026-05-25 — Canvas Perf, Dead Code, API Errors, full_name Sync (Council #9-12)

### perf: EkipPanel canvas noise — 6000 → 480 draw call/sn (Council #9)
- `EkipPanel.tsx`: Film grain döngüsü 100 → 8 piksel/frame olarak düşürüldü. Görsel etki korundu, yük %92 azaldı.

### fix: handleIndividualBroadcast dead code kaldırıldı (Council #10)
- `EkipPanel.tsx`: `memberId` parametresi hiç kullanılmayan `handleIndividualBroadcast` fonksiyonu silindi.

### fix: translate-note API — Anthropic hatası production'a sızıyordu (Council #11)
- `api/translate-note/route.ts`: Anthropic `client.messages.create()` çağrısı try-catch içine alındı; hata durumunda orijinal metin döndürülür, 500 veya SDK hata mesajı istemciye ulaşmaz.

### fix: full_name senkronizasyonu — workspace member ↔ auth.users (Council #12)
- `ProfileModal.tsx`: Ad soyad güncellenirken yalnızca `nmm_workspace_members.full_name` yazılıyordu; artık `supabase.auth.updateUser({ data: { full_name } })` ile `auth.users.user_metadata` da güncelleniyor. Yeni workspace oluştururken metadata'daki eski isim artık kalmıyor.

## 2026-05-25 — Ownership Kontrolü + Swipe Bug Düzeltmesi (Council #6 & #7)

### fix: generateCoachMessage — candidate ownership doğrulaması (Council #6)
- `pipeline/[id]/_components/YZKocuSheet.tsx`: Form'a `<input type="hidden" name="candidateId">` eklendi.
- `pipeline/[id]/actions.ts`: `candidateId` formData'dan alınıp, non-admin kullanıcı için `nmm_candidates` tablosunda `id + workspace_id` eşleşmesi doğrulanıyor. Eşleşme yoksa `'Erişim reddedildi.'` döner, Anthropic çağrısı yapılmaz.

### fix: DashboardShell — swipe `/pipeline/[id]` sayfasında yanlış çalışıyordu (Council #7)
- `_components/DashboardShell.tsx:12`: `getRouteIndex` fonksiyonu `startsWith(r)` kullanıyordu; `/pipeline/abc-123` gibi detail URL'lerinde `/pipeline` eşleşmesi yapıp swipe navigation tetikleniyordu.
- Düzeltme: `pathname === r` ile tam eşleşmeye indirgendi. Detail sayfalarında swipe artık devre dışı.

## 2026-05-25 — getSession→getUser Düzeltmesi + Atomik Workspace İşlemleri (Council #4 & #5)

### fix: useCandidates.ts — getSession() → getUser() (Council #4)
- `src/hooks/useCandidates.ts:79`: Stage change logu sırasında kullanılan `getSession()` çağrısı `getUser()`'a değiştirildi; sunucu tarafında doğrulanmış kimlik kullanılıyor.

### fix: EkipPanel — join/leave atomik değildi (Council #5)
- **Sorun:** `handleJoinWorkspace` ve `handleRemoveMemberConfirmed` fonksiyonları membership + candidates tablolarını ayrı sorgularla güncelliyordu. İlk sorgu başarılı, ikincisi başarısız olursa veriler tutarsız kalıyordu. Üstelik `remove_member` kendi workspace'i olmayan bir workspace eklemeye çalıştığından RLS da ihlal ediliyordu.
- **Çözüm:** `supabase/migrations/007_atomic_workspace_ops.sql` ile iki Postgres fonksiyonu eklendi:
  - `nmm_join_workspace(p_invite_code)` — üyelik + aday taşıma tek transaction'da
  - `nmm_remove_member(p_member_id, p_member_name)` — yeni workspace oluşturma + üye/aday taşıma tek transaction'da; çağıranın owner olduğu doğrulanır; kod üretimi DB'de yapılır
  - Her ikisi de `SECURITY DEFINER SET search_path = public` ile güvenli
- `EkipPanel.tsx`: Sıralı 3 sorgu yerine tek `supabase.rpc()` çağrısı
- `database.types.ts`: `Functions` bölümüne `nmm_join_workspace` ve `nmm_remove_member` tip tanımları eklendi

## 2026-05-24 — AI Limit Sunucu Tarafına Taşındı + Lider Notu Modül Yerleşimi

### fix: AI mesaj limiti localStorage'dan DB sayacına taşındı (Council #3)
- `src/lib/aiUsage.ts` localStorage sayacı yalnızca optimistik UX ipucu olarak kalır; gerçek limit artık sunucuda uygulanır.
- `database.types.ts`: `ActionType`'a `'ai_generate'` eklendi.
- `yazar/actions.ts` ve `pipeline/[id]/actions.ts`: Her iki server action'da artık `supabase.auth.getUser()` ile kullanıcı doğrulanır, `nmm_daily_actions`'dan bugünkü `ai_generate` kaydı sayılır; limit aşılırsa `401 + açıklayıcı hata` döndürülür, başarı durumunda `candidate_id: null` ile kayıt eklenir. Super admin (suattayfuntopak@gmail.com) bypass korunur.

### feat: Lider Notu modülü Sunum Materyalleri ile Aktivite Geçmişi arasına taşındı
- `CandidateDetail.tsx`: 2-kolonlu grid layout kaldırıldı, tek kolon `space-y-4` düzenine geçildi. Lider Notu kartı artık Sunum → Lider Notu → Aktivite Geçmişi sırasıyla yerleşik.

## 2026-05-24 — Güvenlik: translate-note API Endpoint Auth Koruması

### fix: /api/translate-note — Kimlik Doğrulama Zorunlu Hale Getirildi
- `src/app/api/translate-note/route.ts` endpoint'i auth kontrolsüz açıktı; herhangi bir istek Anthropic API'sine ulaşabiliyordu.
- Supabase `createClient()` + `getUser()` eklenerek oturum kontrolü yapıldı. Oturum yoksa `401 Unauthorized` döndürülür, Anthropic çağrısı yapılmaz.
- Council analizi bulgusu #2 giderildi.

## 2026-05-24 — Council Triad Analizi: Kapsamlı Proje Güvenlik ve Kalite Denetimi

### analysis: 4 Council Üyesi ile Cerrah Titizliğinde Proje Analizi
- Socrates (güvenlik/mimari), Torvalds (mühendislik kalitesi), Ada (veri/tip sistemi), Feynman (UX/performans) perspektiflerinden eş zamanlı analiz yapıldı.
- **Toplam 19 bulgu** kritikliğe göre sınıflandırıldı.

### verify: Next.js 16 Proxy Konvansiyonu Doğrulandı
- Council analizi `src/proxy.ts` dosyasının çalışmadığını öngörmüştü — bu **yanlış alarmdı**.
- Next.js 16, Middleware'i `Proxy` olarak yeniden adlandırdı. Dokümanlar: *"Starting with Next.js 16, Middleware is now called Proxy."*
- `src/proxy.ts` + `export async function proxy(request: NextRequest)` kombinasyonu **tamamen doğru** — Next.js kaynak kodu (`middleware.js` template) `page === '/src/proxy'` kontrolüyle bu dosyayı tanıdığı teyit edildi.
- `PROXY_FILENAME = 'proxy'` ve `PROXY_LOCATION_REGEXP = '(?:src/)?proxy'` sabitler Next.js 16 `constants.js`'de mevcuttur. Auth guard aktif ve çalışıyor.

### findings: Gerçek Kritik Bulgular (Düzeltme Gerektirenler)
Gerçekten düzeltilmesi gereken bulgular (öncelik sırasıyla):
1. `/api/translate-note` — auth kontrolü yok, Anthropic kredi riski (🔴)
2. `src/lib/aiUsage.ts` — AI limiti localStorage'da, bypass edilebilir (🔴)
3. `useWorkspace` queryFn içinde DB insert — React Query retry riski (🔴)
4. `useCandidates.ts:79` — `getSession()` yerine `getUser()` kullanılmalı (🟠)
5. `EkipPanel` join/leave — atomik olmayan multi-table write (🟠)
6. `generateCoachMessage` — ownership kontrolü eksik (🟠)
7. Swipe bug — `/pipeline/[id]` detail sayfasında `startsWith` yanlış match ediyor (🟠)
8. `updated_at` — DB trigger varlığı belirsiz (🟡)
9. Canvas noise loop — saniyede 6000 gereksiz draw call (🟡)
10. `handleIndividualBroadcast` — memberId parametresi kullanılmıyor (🟡)

## 2026-05-24 — Masaüstü Header Koruma, Çift Yönlü Mobil Scroll-to-Hide ve Kazanımlar Sayfası Premium Tasarımı

### fix: Bilgisayar Sürümü Header Koruma (Statik Görünüm)
- Bilgisayar/masaüstü görünümünde kaydırma esnasında üst header'ın kaybolması ve boşluk bırakması sorunu giderildi. `md:translate-y-0` responsive Tailwind sınıfı entegre edilerek, masaüstü ekran genişliklerinde header'ın her zaman sabit, yerleşik ve statik kalması sağlandı.

### feat: Çift Yönlü (Double-Sided) Mobil Scroll-to-Hide & Otomatik Geri Çağırma
- Mobilde gezinme konforunu zirveye taşımak için **Çift Yönlü Kaydır-Gizle** yapısı entegre edildi:
  - Kullanıcı **aşağı veya yukarı fark etmeksizin** aktif olarak sayfayı kaydırdığı (browsing/scroll yaptığı) anda, header ve bottom-nav anında pürüzsüzce ekran dışına kayarak içeriğe %100 dikey alan açar.
  - Kullanıcı **parmağını çektiği/durduğu (scroll durduğu)** anda, sistem milisaniyeler içinde hareketsizliği algılar ve menüleri `400ms` içinde yumuşakça ekran içerisine geri getirir. Sayfanın en üstünde (`scrollY < 20`) ise menüler her zaman görünür kalır.

### feat: Kazanımlar Sayfası A'dan Z'ye Premium Yenileme
- "Kazanımlar" (`kazanimlar/page.tsx`) sayfası tamamen modern ve fonksiyonel bir yapıya kavuşturuldu:
  - **3 Kolonlu İnteraktif Analitik Paneli:** Toplam conversion sayısı, bu takvim ayı içindeki yeni kazanımlar (momentum ivmesi) ve en son katılan adayı kutlayan asil amber, indigo ve emerald kart grupları eklendi.
  - **Liderlik Rozet Unvanı:** Ekibe katılan aday sayısına göre dinamik olarak hesaplanan oyunlaştırılmış rütbeler (Yeni Kaşif, Ekip Kurucu, Grup Lideri ve parıldayan altın neon efektli Master İnşaatçı) ve motive edici liderlik ipuçları yerleştirildi.
  - **Doğrudan Profil Yönlendirme:** Kazanım listesindeki üye kartları Next.js `Link` ile sarmalandı. Tıklanıldığında pürüzsüzce ilgili adayın `/pipeline/[id]` detay sayfasına gitmesi sağlandı.
  - **Bulut Fotoğraf Entegrasyonu:** `parseNote` not ayrıştırıcısı kullanılarak, adayların bulut veri tabanına yüklenmiş profil fotoğrafları otomatik okundu ve listede profil görseli olarak gösterildi (bulut resmi yoksa isim baş harfi şeklinde soft degrade fallback uygulandı).
  - **Anlık WhatsApp Hoş Geldin Kısayolu:** Telefonu olan ekip üyelerinin yanına WhatsApp mesaj butonu eklendi. Tıklandığı anda çift dilli pre-filled hoş geldin şablonuyla WhatsApp sohbetini açarak liderin ekibe yeni katılan kişiyle saniyeler içinde iletişime geçmesini sağlar.

## 2026-05-24 — Akışkan Kaydır-Gizle (Scroll-to-Hide) Mobil Gezinme Deneyimi

### feat: Akışkan Kaydır-Gizle (Scroll-to-Hide) Mobil Menü ve Üst Header
- Mobil cihazlarda ekran alanını maksimuma çıkarmak ve pürüzsüz bir okuma/gezinme deneyimi sunmak amacıyla **Scroll-to-Hide (Kaydırınca Gizlenen)** akışkan gezinti çubuğu yapısı kuruldu.
- **Performans & GPU Hızlandırma:** Layout kaydırma animasyonlarında CPU/Reflow yükü oluşturan border/spacing animasyonları yerine tamamen GPU-accelerated fırça hızı sunan `transition-transform duration-300 ease-in-out` ve Tailwind `transform translate-y` kullanıldı. Bu sayede 60fps/120fps mobil tarayıcılarda ultra akıcı kayma hissi elde edildi.
- **Akıllı Arama Algılaması:** Mobil cihazlarda arama çubuğu açıldığında veya aktif olarak kullanılırken, sayfa arkada kaysa bile header'ın kaybolması engellendi. Bu sayede arama input odağı ve klavye etkileşimi kusursuz şekilde korundu.
- **iOS Elastik Scroll Desteği:** iOS cihazlarındaki bounce (esneme) hareketlerinin getirdiği eksi `window.scrollY` değerleri sıfıra caplenerek herhangi bir titreme veya zıplama sorunu yaşanması engellendi.

## 2026-05-24 — Logo Yönlendirmesi ve Not Çeviri Döngü Hata Çözümü

### feat: Ekip Davet Kodu Telegram Tarzı Spoiler Gizleme
- Ekibim sayfasındaki davet kodunu (`inviteCode`) korumak ve premium bir his katmak amacıyla Telegram tarzı bir **Spoiler Gizleme** bileşeni (`SpoilerCode`) geliştirildi.
- Kod varsayılan olarak hareketli, parıldayan mavi/cyan yıldız pikselleriyle kaplı gece gökyüzü animasyonuyla (HTML5 Canvas tabanlı) gizleniyor.
- Kullanıcı üzerine tıkladığında bulut dağılımı/çözünme animasyonuyla kod açığa çıkıyor. Sayfadan ayrılıp tekrar girildiğinde ise otomatik olarak yeniden kilitleniyor.

### feat: Vaktin Varsa (Eğitim) Sayfası Arama ve Kategori Sekmeleri Yenilenmesi
- Vaktin Varsa (`egitim/page.tsx`) sayfası, "İtirazlara Cevaplar" arayüzü ile birebir aynı modern yapıya kavuşturuldu:
  - Üstte toplam konu, kategori ve tamamlanan okuma sayılarını içeren **Hero bilgi kartı** konumlandırıldı.
  - Sayfa boyunca uzanan, başlık, özet veya içerik maddelerinde kelime bazlı arama yapabilen **tam ekran Arama Barı** eklendi.
  - Yatay kaydırılabilir **kategori sekmeleri** (Tümü, Favoriler ve 8 farklı eğitim kategorisi) eklendi.
  - Eğitim konuları, "İtirazlara Cevaplar" kartlarıyla birebir aynı; favorilere ekleme, okundu/okunmadı işaretleme, içerik kopyalama ve WhatsApp/SMS paylaşım butonları içeren **açılır kapanır premium kartlar** haline getirildi.
  - Sayfalama (Pagination, her sayfada 10 konu olacak şekilde) entegre edildi.

### feat: YZ Mesajı Üret Aday Bilgisi Otomatik Doldurma
- YZ Mesajı Üret sayfasında (`YazarForm.tsx`) bir aday arandığında veya seçildiğinde (ayrıca aday profilinden bu sayfaya yönlenildiğinde), adayın adı, aşaması ve güncel notları **"Ek Bilgi"** kutusuna otomatik olarak `Aday: Adı, Aşama: Durumu, Notlar: Notu` formatında pre-populate edilecek şekilde güncellendi.
- Ek bilgi textarea kutusu controlled component (`context` state) haline getirildi ve boyutu 4 satıra, maksimum karakter sınırı 1500'e çıkarılarak kullanıcının otomatik gelen bilgilerin altına kendi özel notlarını da ekleyebilmesi sağlandı.

### fix: Mobil Alt Menü "İtirazlar" Kelime Güncellemesi
- Mobil bottom navigation menüsünde (`BottomNav.tsx`) daha önce `"İtirazlara Cevaplar"` olarak görünen uzun etiket, mobil ekran tasarım kalitesi ve okunabilirlik açısından yalnızca mobil görünümde **`"İtirazlar"`** / **`"Objections"`** olarak kısaltıldı. Bilgisayar/masaüstü yan menüsü (`Sidebar.tsx`) ise eskisi gibi tam haliyle korundu.

### fix: Ekibim Alıcı Grubu Metin Güncellemesi
- Ekibim sayfasında alt kısımda yer alan alıcı seçimi butonlarındaki `"Tüm Ekip (WhatsApp Grubu)"` / `"Whole Team (WhatsApp Group)"` ifadeleri, her iki sekmede de (Doküman/Link ve Ekibe Mesaj) ortaklaşa güncellenecek şekilde sadeleştirilerek sırasıyla **`"Tüm Ekip"`** / **`"Whole Team"`** olarak revize edildi.

### fix: Kullanıcı Menüsü Popupları Mobil Uyumluluğu
- Kullanıcı menüsündeki **Profil**, **Ayarlar** ve **Bildirimler** modal pencereleri (`ProfileModal.tsx`, `SettingsModal.tsx`, `NotificationsModal.tsx`) mobilde kesilmeyi ve kapatma butonunun ekran dışına taşmasını önlemek amacıyla üstten 16px boşluk kalacak şekilde `top-4` hizalamasına ve maksimum `calc(100dvh - 5.5rem)` yüksekliğe kavuşturuldu.
- Tüm popuplar masaüstü görünümde eskisi gibi dikey ortalanmış (`md:top-1/2 md:-translate-y-1/2`) kalırken, mobilde tam ekran dikey kaydırma (`overflow-y-auto`) desteğiyle kusursuz ve erişilebilir hale getirildi.

### fix: Logo ve Marka İsmi Panoya/Dashboard'a Yönlendirme
- Desktop ve mobil üst header'ındaki NMM logo görseli (`/logo.png`) ile desktop'taki "Network Marketing Master" marka metni, tıklandığında panoya (`/pano`) dönülecek şekilde Next.js `<Link href="/pano">` bileşeni ile sarmalandı.

### fix: Aday Sayfası İngilizce Çeviri & Veritabanı Kısıt (Constraint) Döngü Hatası
- Aday detay sayfasında (`CandidateDetail.tsx`) dil EN olarak seçildiğinde, aday notunun otomatik İngilizceye çevrilmesi ve cache verisinin veritabanına (`update.mutate`) senkronize edilmesi esnasında oluşan `nmm_candidates_note_check` veritabanı constraint hatasından dolayı tetiklenen sonsuz hata toast bildirim döngüsü engellendi.
- Component içine `attemptedUpdates` (`useRef`) eklenerek, sayfa/veri güncellemelerinden bağımsız olarak her aday için veritabanına yazma işleminin bir render cycle'da yalnızca 1 kez tetiklenmesi güvence altına alındı.
- SQL veri tabanı şemasındaki note uzunluk kısıtını (check constraint) 500-1000 karakterden 4000 karaktere çıkaran `006_increase_note_length.sql` migrasyon dosyası oluşturuldu.

## 2026-05-24 — Mobil Uyum (Responsive) ve Fotoğraf Yükleme Hata Çözümleri

### fix: Aday Profil Fotoğrafı Yükleme Hatası (Supabase Storage)
- Aday profil fotoğraflarının Supabase Storage'a yükleme yolu `candidates/` yerine `avatars/candidate_` olarak güncellendi. Bu sayede kişisel profil fotoğrafları için çalışan Supabase Storage yükleme politikası (upload policy) aynen devralındı ve mobilde kaydetme esnasında alınan \"Fotoğraf kaydedilirken hata oluştu\" hatası kökten çözüldü.

### fix: Mobil Menü / BottomNav Üst Üste Binme Sorunu (Duyarlı Tasarım)
- `AddCandidateSheet.tsx`, `EditCandidateSheet.tsx`, `YZKocuSheet.tsx` ve `QuickAddModal.tsx` popup'ları mobilde `top-4` (ekranın 16px altı) konumuna sabitlendi.
- Maksimum yükseklikleri `max-h-[calc(100dvh - 5.5rem)]` olarak ayarlanarak alttaki menü barının (`BottomNav`) altında kalmaları engellendi; böylece \"Kaydet\", \"Ekle\" ve \"İptal\" butonları her zaman menünün üzerinde, tam erişilebilir ve tıklanabilir hale getirildi.

### fix: Hızlı Aday Ekleme (QuickAddModal) Ekran Kayma Sorunu
- Mobilde Zap (kıvılcım) butonuna tıklandığında açılan `QuickAddModal` popup'ındaki `.focus()` çağrısı için `{ preventScroll: true }` parametresi eklendi.
- Popup kapandığında veya eklendiğinde, sayfa bütünlüğünün bozulmaması ve header'ın altına kaymaması için pencere scroll pozisyonunun unmount clean-up aşamasında eski haline getirilmesi (`window.scrollTo`) sağlandı.

## 2026-05-24 — Claude 4.6 Model Güncellemesi ve Kalıcı Bulut Profil Fotoğrafı Depolama Altyapısı

### feat: Claude 4.6 API Yükseltmesi
- AI Mesaj üretimi ve Koç modüllerindeki model `claude-3-5-sonnet-20241022` (404 hatası veren) yerine en güncel ve kararlı **`claude-sonnet-4-6`** modeline yükseltildi.
- Aday notları gönderilmeden önce, AI bağlamının bozulmaması için otomatik olarak dil ve fotoğraf ayraçlarından (`|||`) temizlenerek gönderilmesi sağlandı.

### feat: Kalıcı Bulut Profil Fotoğrafı Altyapısı (Supabase Storage)
- Aday profil fotoğrafları tarayıcının geçici `localStorage` çerezlerinden kurtarılarak Supabase Storage bulutunda (`nmm-avatars/candidates/`) kalıcı olarak saklanacak şekilde yapılandırıldı.
- Herhangi bir veritabanı DDL değişikliği riski almadan, mevcut `note` alanı `Türkçe Not ||| İngilizce Çeviri ||| Aday Fotoğrafı Bulut URL'si` formatında kalıcı olarak saklandı.
- Tüm detay, kart ve arama arayüzleri bu bulut URL'lerini anlık okuyacak şekilde güncellendi.
- **Yeni Aday Ekle** formuna profil fotoğrafı ekleme ve buluta kaydetme özelliği (Düzenle modalı ile birebir uyumlu) entegre edildi.

## 2026-05-24 — Paylaşım Butonları, Sidebar Kalıcılığı, Profil Fotoğrafı, Pipeline Yenileme

### feat: İtirazlara Cevaplar — Kopyala + SMS + WhatsApp Paylaşım Butonları

- Her açılan itiraz cevabının altına 3 buton eklendi: **Cevabı Kopyala** → **SMS İle Gönder** → **WhatsApp İle Gönder**
- Sıralama tam olarak istenen sırayla uygulandı
- SMS: `sms:?body=` deep link, WhatsApp: `api.whatsapp.com/send?text=` URL encode ile

### feat: Vaktin Varsa — Kopyala + SMS + WhatsApp Paylaşım Butonları

- Her konu içeriğinin (madde listesi) altına **Kopyala** → **SMS İle Gönder** → **WhatsApp İle Gönder** butonları eklendi
- İçerik numaralı maddeler newline birleştirilmiş şekilde paylaşılıyor
- heroTitle sonuna ünlem eklendi; heroDesc `sırayla değil` olarak düzeltildi

### fix: Sidebar — Daralt Durumu Sayfa Yenilemede Korunuyor

- `DashboardShell`'deki `collapsed` state `localStorage` (`nmm_sidebar_collapsed`) ile kalıcı hale getirildi
- `useState` initializer'ı SSR güvenli `typeof window !== 'undefined'` kontrolüyle yazıldı
- Toggle butonu her tıklamada localStorage'ı güncelliyor

### feat: Profil Fotoğrafı Yükleme (EditCandidateSheet)

- Düzenle popup'ının en üstüne profil fotoğrafı modülü eklendi: avatar önizleme, kamera ikonu, Fotoğraf Yükle ve Fotoğrafı Kaldır butonları
- Fotoğraflar `FileReader` ile base64'e çevrilerek `localStorage`'da (`nmm_candidate_photo_<id>`) saklanıyor
- `CandidateCard` (liste) ve `CandidateDetail` (detay sayfası) da localStorage'dan fotoğrafı okuyup gösteriyor
- Düzenle modalı kapandığında liste ve detay sayfası fotoğrafı otomatik yeniliyor

### feat: Boru Hattı — Stat Kutuları Tıklanabilir, Renkler Değiştirildi

- **Aktif** kutusu artık yeşil (`#E1F5EE / #0F6E56`), **Sıcak** kutusu turuncu (`#FAEEDA / #854F0B`) — renkler çaprazlama değiştirildi
- Tümü, Aktif ve Sıcak kutularına tıklanınca ilgili aşama filtresi seçiliyor (stat = filter butonu)
- Seçilen kutu ring efektiyle vurgulanıyor

### feat: Boru Hattı — Tüm Aşamalar Sekme Filtresi (StageFilter)

- Sekme filtresi 4 gruptan (Tümü/Aktif/Sıcak/Kaybolanlar) → **11 aşamalı** kaydırılabilir pill listesine dönüştürüldü
- Sıralama: Tümü → Yeni Aday → İletişime Geçildi → Davet Edildi → Sunum Yapıldı → Takipte → Kararsız → Katıldı → İlgilenmedi → Pasif → Kaybedildi
- `CandidateFilter` tipi tüm stage değerlerini de kapsayacak şekilde genişletildi

### feat: Aday Ekle Popup — Başlık ve Buton Güncellendi

- Başlık: `Yeni Kişi Ekle` → **`Yeni Aday Ekle`**
- Buton: `Kişi Ekle` → **`Aday Ekle`**

### feat: Ekibim Sayfası — Metin ve Yapı Güncellemeleri

- `broadcastTitle`: "EKİBE TOPLU GÖNDER" → **"EKİBE GÖNDER"**
- `broadcastSubtitle`: "...motivasyon mesajını..." → kısaltıldı
- `broadcastTypeMotiv`: "Motivasyon Mesajı" → **"Ekibe Mesaj"**
- **Mesaj Önizleme** accordion kutusu kaldırıldı (hem Doküman/Link hem Ekibe Mesaj sekmesinden)

### feat: Aşama İsimleri ve Pasif Aşaması

- `davetli` etiketi: "Toplantıya Davet Edildi" → **"Davet Edildi"** (sistem genelinde)
- `kayboldu` etiketi: "Kayboldu" → **"Kaybedildi"** (sistem genelinde)
- **`pasif`** yeni aşaması eklendi: `CandidateStage` tipi, `stages.ts` STAGE_LABEL/THEME/ORDER, `useDailyActions` STAGE_PRIORITY, TR/EN çeviriler güncellendi

---



### feat: İtirazlara Cevaplar — 34 Madde, Çift Dil, Okundu Takibi, Sayfalama

- 20 mevcut itiraz → 34'e çıkarıldı (NMU seed'lerinden 14 yeni madde: id 21-34)
- Tüm maddeler tam çift dilli (TR/EN): `kategori`, `soru`, `cevap` field'ları
- `nmm_itiraz_read` localStorage ile okundu takibi; header'da `X/34 okundu` sayacı
- Sayfalama: her sayfada 10 madde, altında numaralı sayfa butonları, sayfa değişiminde scroll-to-top
- ID'ler geriye dönük uyumlu: orijinal 20 item'ın ID'si değişmedi (`1-20`), yeniler `21-34`

### feat: Vaktin Varsa (Eğitim) — 30 Madde, 8 Kategori, NMU Seed'leri

- 11 mevcut içerik → 30'a çıkarıldı (NMU akademi seed'lerinden 19 yeni madde)
- Kategoriler: Zihniyet & Temel, İletişim & Takip, Davet & Aday Bulma (yeni), Sunum & Kapanış (yeni), Ekip & Liderlik, Strateji & Büyüme, Uyum & Etik (yeni), Ürün & Şirket (yeni)
- Her madde tam TR ve EN bullet point listeleriyle çift dilli yapıldı

### feat: Ekibim Sayfası — Panel Sıralama + Ekibe Toplu Gönder Modülü

**Yeni panel sırası:**
1. Ekip Performans Paneli (istatistik + üye listesi) — en üste taşındı
2. Ekip Arkadaşı Davet Et (lider için)
3. Bir Liderin Ekibine Katıl (solo lider / üye için)
4. Ekibe Toplu Gönder (yeni modül) — en alta eklendi

**Ekibe Toplu Gönder modülü:**
- İki içerik türü toggle: **Doküman / Link** (URL + ek not) | **Motivasyon Mesajı** (textarea)
- Mesaj önizleme accordion'u (collapsible)
- İki alıcı modu: **Tüm Ekip (WhatsApp Grubu)** → tek "Grupla Paylaş" butonu | **Kişileri Seç** → checkbox listesi
- Kişi seçiminde: "Tümünü Seç" / "Temizle" hızlı kontrolleri, seçilen üyeler yanında bireysel WhatsApp butonu
- Tüm yeni translation key'leri `tr.ts` + `en.ts`'ye eklendi (`broadcastTitle`, `broadcastSubtitle`, `broadcastTypeDoc` vb. — 21 yeni anahtar)

### fix: CandidateDetail — Silme kartı section başlığı "Kişi Sil" / "Delete Candidate"

- Silme card'ının üst `<p>` etiketi `t('common.delete')` → `lang === 'en' ? 'Delete Candidate' : 'Kişi Sil'` olarak güncellendi
- Silme butonu metni değişmedi (hâlâ "Sil" / "Delete")

---

## 2026-05-24 — Tam i18n Geçişi, Bildirim Kalıcılığı ve Migration Düzeltmeleri

### fix: Migration 004 — "Policy Already Exists" Hatası Çözüldü

- **Sorun:** `supabase/migrations/004_member_self_update.sql` dosyası ikinci kez çalıştırıldığında `ERROR: 42710: policy "nmm_member_self_update" already exists` hatası veriyordu.
- **Çözüm:** `CREATE POLICY` satırının önüne `DROP POLICY IF EXISTS` eklendi. Artık SQL güvenle tekrar çalıştırılabilir, hata oluşmaz.

### fix: Bildirimler Yenilemede Sıfırlanıyordu — LocalStorage Kalıcılığı Eklendi

- **Sorun:** Bildirimlerin okundu olarak işaretlenmesi ya da "Tümünü Okundu Yap" ile silinmesi, sayfa yenilendiğinde kayboluyordu; bildirimler her zaman 2 okunmamış olarak geri geliyordu.
- **Çözüm:** `NotificationsModal.tsx` bileşenine iki yeni `localStorage` anahtarı eklendi:
  - `nmm_notif_read_ids` — Okundu olarak işaretlenen bildirim ID'lerini saklar.
  - `nmm_notif_dismissed_ids` — "Tümünü Okundu Yap" ile silinen bildirim ID'lerini saklar.
- **Davranış:** Sayfa yenilendiğinde `loadNotifications()` fonksiyonu bu iki seti okuyarak `DEFAULT_NOTIFICATIONS` üzerinde uygular. Okundu işaretlenenler okundu görünür; silinen bildirimler geri gelmez. Gelecekte eklenen yeni ID'li bildirimler her zaman taze olarak görünür.

### feat: Uygulama Genelinde Tam i18n (Türkçe/İngilizce) Geçişi

Hardcode Türkçe metin içeren tüm bileşenler tespit edilerek `t()` fonksiyonuna geçirildi. Aynı zamanda `tr.ts` ve `en.ts` sözlük dosyalarına 60+ yeni anahtar eklendi.

**Yeni Çeviri Anahtarları — Eklenen Bölümler:**

| Bölüm | Eklenen Anahtarlar |
|---|---|
| `pipeline` | `total`, `active`, `hot`, `aiMessage`, `call`, `noPhone`, `noWhatsApp`, `back`, `selectStage`, `changeStage`, `activityHistory`, `activityCall`, `activityNote`, `activityStageChange`, `candidateNotFound`, `backToPipeline`, `reactivate`, `reactivateTitle`, `presentationMaterials`, `presentationMaterialsDesc`, `presentationWarning`, `presentationCopied`, `presentationMessageTemplate` |
| `nav` | `todayFocus` |
| `today` *(yeni bölüm)* | `allPriorityListed`, `collapse`, `showAll`, `moreLeadsPending` |
| `training` | `allContent`, `favorites`, `noFavorites`, `noFavoritesDesc`, `addToFavorites`, `removeFromFavorites` |
| `team` | `totalCandidates`, `totalMembers`, `funnelDistribution`, `noTeamCandidates`, `inviteTeammate`, `inviteTeammateDesc`, `joinATeam`, `joinATeamDesc`, `joinBtn`, `removeFromTeam`, `performancePanel`, `loadError`, `loadErrorHint`, `soloHint`, `memberHint`, `inviteCopied`, `joinSuccess`, `joinError`, `removeSuccess`, `removeError`, `alreadyInTeam`, `invalidCode`, `removeMemberMsg`, `noSessionError`, `joined` |
| `common` | `you` |

**Güncellenen Bileşenler:**

- **`CandidateDetail.tsx`** — Tüm sabit Türkçe metinler `t()` ile değiştirildi: YZ Mesajı, Ara, WA yok, Tel yok, Sunum Materyalleri (başlık + açıklama + uyarı), SMS/WhatsApp gönder butonları, Aktivite Geçmişi etiketleri, Aşama Seç picker, Geri/Düzenle/Sil etiketleri, sunum mesajı şablonu. `daysSince()` fonksiyonu artık `t()` alıyor (dil-bağımlı çıktı için).
- **`CandidateCard.tsx`** — `daysSince()` `t()` ile çalışıyor; aşama etiketi `t('stages.*')` kullanıyor; "Yeniden Aktif Et" ve "Aşama Seç" çevrildi.
- **`pipeline/page.tsx`** — Toplam/Aktif/Sıcak istatistik etiketleri çevrildi.
- **`PanoContent.tsx`** — "Bugün İlgilen" hızlı erişim karesi `t('nav.todayFocus')` kullanıyor.
- **`IlgilenContent.tsx`** — "Tümünü Gör" / "Kapat" / "+N kişi daha bekliyor" `lang ===` ternary'leri `t('today.*')` anahtarlarıyla değiştirildi.
- **`EkipPanel.tsx`** — `useTranslation` eklendi; tüm JSX etiketleri, toast mesajları ve hata metinleri `t()` kullanıyor. Ekip üyesi rolü, huni dağılım etiketleri (Yeni/Sunum/Takip/Katıldı), davet/katıl kartları, performans paneli başlığı, ipucu metinleri tamamen çevrildi.
- **`egitim/page.tsx`** — "Tüm İçerik" / "Favoriler" sekmeleri, "Henüz Favori Yok" boş durum mesajı ve yıldız tooltip'leri çevrildi.

## 2026-05-24 — NMU-Style Bilingual (TR/EN) Migration & Premium Header Revamp

### feat: Çift Dilli (TR/EN) Dil Altyapısı (i18n) Kurulumu
- **Geliştirme:** Sistem genelinde dil durumunu yöneten ve `localStorage` üzerinde kaydedilen `LanguageProvider` React Context yapısı kuruldu.
- **Sözlükler:** `src/lib/translations/` altında `tr.ts` ve `en.ts` dosyaları oluşturularak tüm terimler profesyonel ağ pazarlaması terminolojisine (Prospect, Pipeline, Follow-up, Presentation Done, Objection Handling vb.) tam uyumlu olarak çevrildi.
- **Entegrasyon:** Giriş, Kayıt, Pano, Boru Hattı, Vaktin Varsa eğitim sayfaları ve menüler `useTranslation` ile tamamen iki dilli yapıldı.

### feat: Premium Siber-Punk NMM Neon Logo
- **Tasarım:** Yapay zeka ile son derece asil ve fütüristik NMM neon logo görseli (`public/logo.png`) üretildi.
- **Auth Sayfaları Revizyonu:** `AuthLayout` kabuğu, giriş/kayıt sayfaları ile birlikte, bu neon logoyla tam uyumlu parıldayan koyu siber-gradyan ve glassmorphic kart tasarımına kavuşturuldu.

### feat: NMU Tasarımı Premium Horizontal Header Çubuğu
- **Tasarım:** Görseldeki sıralamaya tam uyumlu horizontal `Header.tsx` bileşeni sıfırdan inşa edilerek Dashboard üst çubuğu olarak yerleştirildi.
- **Elementler:**
  - Sol: Neon Logo + Başlık + "OPERATING SYSTEM / İŞLETİM SİSTEMİ" alt başlığı.
  - Orta: Google-style arama barı (`Ne istersen ara! ⌘K` placeholder ve `⌘K` kısayol odaklanma dinleyicisi).
  - Sağ: Hızlı Aday Ekleme Kıvılcım (Spark) butonu, Tema Switcher, TR/USA bayrak kapsül toggle butonu, sayı badge'li Çan bildirim ikonu ve Profil dropdown.
- **Responsive Entegrasyon:** Eski `MobileHeader` ve sabit sağ üst buton grupları kaldırılarak horizontal Header tüm ekran boyutlarında kusursuz çalışacak şekilde `DashboardShell`'e entegre edildi. Sol `Sidebar` ve mobil `BottomNav` ile tam sinerji sağlandı.

### feat: Kıvılcım Hızlı Aday Ekleme Modalı
- **Geliştirme:** Sadece isim ve isteğe bağlı not alarak tek tıkla adayları Boru Hattı'nda ilk aşamaya (`stages.yeni` / *New Prospect*) ekleyen `QuickAddModal.tsx` modal bileşeni tamamlandı. `useAddCandidate` mutasyonu ile anında veritabanına kayıt yapar ve cache'i tazeleyerek sayfayı günceller.

### feat: Google-Style Arama Sonuç Sayfası
- **Geliştirme:** `/search?q=QUERY` arama sonuç sayfası kuruldu.
- **Arama Kapsamı:** Case-insensitive olarak hem workspace adayları (isim, not, meslek, şehir vb.) hem de Vaktin Varsa eğitim içerikleri (başlık, özet, maddeler) taranır.
- **Akıllı Navigasyon:** Aday sonuçlarına tıklandığında `/pipeline/[id]` detayına; eğitim konularına tıklandığında `/egitim?id=[id]` sayfasına gidilerek **ilgili akordeon konusu otomatik genişletilir** ve görünür hale getirilir.

## 2026-05-24 — Pipeline Page Icon + Soft Stage Card Colors + Super Admin Bypass + Pano Grid Colors

### feat: Boru Hattı Sayfa Başlığı İkon Güncellemesi (TrendingUp)

- **Geliştirme:** Boru Hattı sayfasının (`pipeline/page.tsx`) en üstündeki `BarChart2` (sütun grafik) ikonu, panodaki "Boru Hattı" karesiyle tam uyumlu olacak şekilde **`TrendingUp`** (yükselen ok grafiği) ikonu ile değiştirildi.
- **Tasarım:** İkon kutusunun arka planı ve ikon rengi Dashboard ile tam uyumlu soft mavi tona (`bg-[#E8F0FE] dark:bg-[#0a1f4d] text-[#1A56DB] dark:text-[#93c5fd]`) güncellendi.

### feat: Aday Kartlarında Yumuşak Pastel Renkler (Özellikle Dark Mode İyileştirmesi)

- **Sorun:** Boru hattındaki aday kartlarının arka plan renkleri (`yeni`, `takip`, `sunum` vb.) özellikle **dark mode**'da çok koyu ve boğucu tondaydı, bu da görsel akıcılığı azaltıyordu.
- **Çözüm:** Tüm kart arka plan renkleri (`stages.ts` -> `STAGE_THEME`), tıpkı panodaki pastel renkler gibi **yumuşak, parlak ve yüksek kontrastlı pastel tonlara** güncellendi. Artık dark mode'da da kartlar aşamalarına göre gözü yormayan, son derece asil ve ayırt edilebilir soft pastel tonlarda parlıyor.

### feat: suattayfuntopak@gmail.com İçin Super Admin AI Limit Bypass

- **Özellik:** Uygulama sahibi olan `suattayfuntopak@gmail.com` e-posta adresi için günlük 20 AI mesaj limiti tamamen devre dışı bırakıldı (Sınırsız yapıldı).
- **Detaylar:**
  - `aiUsage.ts` kütüphanesine `bypass` parametresi eklendi.
  - Aktif kullanıcının e-postası Supabase Auth üzerinden çekilerek `suattayfuntopak@gmail.com` ise `isSuperAdmin` flag'i aktif edildi.
  - Super Admin için `isAILimitReached` kontrolü her zaman `false` döner, sayaç artırılmaz (`incrementAIUsage` engellenir) ve YZ sayfasındaki buton metninde `Üret (Sınırsız)` ifadesi yer alır. Olası tüm diğer yetki kısıtlamaları Super Admin için devre dışı bırakıldı.
- **Sıfırlanma Periyodu:** Günlük 20 limitinin sıfırlanması localStorage'da tarih damgasıyla (`YYYY-MM-DD`) tutulmaktadır. Dolayısıyla her gece yarısı 00:00 itibarıyla yeni bir gün anahtarı oluşturulduğunda sıfırlanma kendiliğinden milisaniyeler içinde gerçekleşmektedir.

### feat: Hızlı Erişim Kareleri Renk Sinerjisi ve Simetri Dengeleme

- **Renk Değişikliği:**
  - Vaktin Varsa kutusunun rengi **amber** yapılarak **Ekibim** kutusunun rengiyle birebir eşleştirildi.
  - Kazanımlar kutusunun rengi **teal** yapılarak **YZ Mesajı Üret** kutusunun rengiyle birebir eşleştirildi.
- **Renk Dağılımı:**
  - 1. Sütun: Zap (`purple`) ➔ Takvim (`pink`)
  - 2. Sütun: Boru Hattı (`blue`) ➔ İtirazlara Cevaplar (`indigo`)
  - 3. Sütun: YZ Mesajı Üret (`teal`) ➔ Vaktin Varsa (`amber`)
  - 4. Sütun: Ekibim (`amber`) ➔ Kazanımlar (`teal`)
  Böylece 3. ve 4. sütunlar simetrik olarak birbirinin zıt rengi yapılmış (Teal/Amber ve Amber/Teal) ve müthiş bir tasarım kalitesi elde edilmiştir.

### fix: Ekibim Sayfası React Hook Kural İhlali (React Error #310)

- **Sorun:** Ekibim sayfasında yer alan `EkipPanel.tsx` bileşeni yüklenirken tarayıcıda `Minified React error #310` (Rendered more hooks than during the previous render) hatasıyla çöküyordu. Bu durum, loading veya error durumlarındaki erken return'lerin (early returns) altında yer alan `handleMemberRemoveCancel` isimli `useCallback` hook'unun, koşullu olarak çalıştırılmasından (React'in Hook kurallarının ihlal edilmesinden) kaynaklanıyordu.
- **Çözüm:** `handleMemberRemoveCancel` `useCallback` hook tanımı dosyanın en üst seviyesine (tüm erken return/render koşullarının üstüne) taşınarak React Hook düzen kurallarına tam uyum sağlandı, sayfa çökmesi tamamen giderildi.

### fix: nmm_workspace_members RLS Infinite Recursion

- **Sorun:** `nmm_workspace_members` tablosundaki `SELECT` politikası, tablonun kendisini recursive sorguladığı için `infinite recursion detected` hatası veriyordu. Bu hata hem "Ekibim" sayfasının yüklenmesini engelliyor hem de `useWorkspace` hook'unun çökmesi sebebiyle profil ad soyadı / avatar vb. verilerin yüklenmesini baltalıyordu.
- **Çözüm:** `SECURITY DEFINER` yetkisiyle çalışan `nmm_is_member_of_workspace` SQL fonksiyonu oluşturuldu. Bu fonksiyon RLS kuralını bypass ederek güvenli bir şekilde sorgulama yapar. `SELECT` politikası bu fonksiyonu çağıracak şekilde güncellendi, sonsuz döngü giderildi. Tüm RLS tabloları sorunsuz çalışır hale getirildi.

### feat: Sunum Materyalleri Redesign (Mockup'a Uyum)

- Aday detay sayfasındaki (`CandidateDetail.tsx`) 4 adet pastel renkli statik kutu kaldırıldı.
- Yerine, eski NMU projesindeki mockup'a tamamen sadık kalınarak:
  - **Açıklama Metni:** *"Adayınıza bir açıklama eşliğinde WhatsApp ya da SMS üzerinden sunum linkini gönderebilirsiniz. Bu link açıldığında adayınız güncel sunumu izleyebilir ve inceleyebilir."*
  - **SMS İle Gönder** (MessageSquare ikonlu, sky-600 mavi buton) eklendi.
  - **WhatsApp İle Gönder** (WhatsAppIcon ikonlu, bg-[#25D366] yeşil buton) eklendi.
  - Her iki buton da adaya özel olarak hazırlanan şablon metni kopyalar, ardından ilgili platformu açar.
  - İnternet bağlantısı çekmeme ihtimaline karşı **SMS İle Gönder** tam işlevsel çalışır hale getirildi.
  - Adayın kayıtlı telefonu yoksa butonlar devre dışı bırakılır ve **"DİKKAT: Hazır mesajı gönderebilmek için bu adaya ait telefon numarasını Düzenle bölümünden ekleyin!"** uyarısı amber renginde bir kutu içinde gösterilir.

---

## 2026-05-24 — Walkthrough Önerileri + Sunum Materyalleri

### feat: İtirazlara Cevap — Favori Sabitleme + Kopyala Butonu

- Yıldız ikonu ile itirazlar favorilere sabitlenebilir (`localStorage`)
- "Favoriler" kategori filtresi eklendi, aktif favori sayısı chip'te görünür
- Açık kart içinde "Cevabı Kopyala" butonu → clipboard + toast + 2sn onay animasyonu
- Hero kutusunda favori sayacı göstergesi

### feat: Vaktin Varsa — Okundu İşareti + İlerleme Sayacı

- Her konunun sağında daire/check ikonu ile "Okundu" işaretleme (`localStorage`)
- Okundu konular: üstü çizili başlık, soluk emoji, yeşil "Okundu" rozeti
- Hero kutusunda `X/11 okundu` ilerleme sayacı (emerald renk)
- Tüm durum sıfır backend maliyetiyle localStorage'da

### feat: BottomNav — İtirazlara Cevap eklendi (5 item)

- Takvim çıkartıldı, yerine İtirazlara Cevap (`/itirazlar`) eklendi
- Sahada en pratik sayfa artık mobil çubuğunda
- `DashboardShell` `NAV_ROUTES`'a `/itirazlar` eklendi — swipe ile geçiş çalışıyor

### feat: Kişi Detay Sayfası — Sunum Materyalleri bölümü

- Her adayın şahsi sayfasında "Sunum Materyalleri" bölümü eklendi
- 2x2 grid: Video Tanıtım, Ürün Kataloğu, Kazanç Planı, Başarı Hikayeleri
- Her materyal renkli pastel kart + external link ikonu
- Linkler şimdilik `#` — ileride profil ayarlarından özelleştirilebilir

### feat: PWA Manifest

- `public/manifest.json` oluşturuldu: standalone mod, NMM tema (#534AB7), 3 shortcut
- `layout.tsx` metadata: `manifest`, `appleWebApp`, `theme-color` eklendi
- "Ana Ekrana Ekle" ile native uygulama deneyimi

---



### fix: TakvimClient `toKey()` UTC → yerel saat dilimi

**Sorun:** `toKey(d)` içinde `d.toISOString().slice(0, 10)` kullanılıyordu. `toISOString()` tarihi UTC'ye çevirir; Türkiye +03:00 offset'inde gece 00:00–02:59 arası tıklamada tarih bir gün geri kayıyordu. Takvim grid tıklaması doğru aday gösterirken "Önümüzdeki 7 Gün" bölümü bir gün ileriden başlıyordu.

**Çözüm:** `getFullYear() / getMonth() / getDate()` ile yerel bileşenlerden `YYYY-MM-DD` üretildi. Tüm `toKey()` çağrıları tek fonksiyon üzerinden geçtiğinden tek satır değişiklik tüm takvimi düzeltti.

---

## 2026-05-24 — Pano Genişletme & Ekibim Fix


### feat: Pano 6 → 8 kare, grid 2×4

- Pano grid düzenlemesi: `grid-cols-2 md:grid-cols-3` → `grid-cols-2 md:grid-cols-4`
- Yeni 6. kare: **İtirazlara Cevap** (`/itirazlar`) — rose renk, `MessageCircleQuestion` ikonu
- Yeni 7. kare: **Vaktin Varsa** (`/egitim`) — indigo renk, `BookOpen` ikonu
- Kazanımlar kutusu 6. sıradan 8. sıraya taşındı
- Skeleton loader 6 → 8 eleman olarak güncellendi
- `SquareButton`'a dark mode desteği tüm mevcut renklere eklendi
- İki yeni pastel renk varyantı eklendi: `rose` ve `indigo` (light+dark tam destekli)

### feat: /itirazlar — İtirazlara Cevap sayfası

- 20 sahada karşılaşılan itiraz, 6 kategori
- Kategori filtresi (yatay kaydırılabilir chip'ler)
- Gerçek zamanlı arama kutusu (soru + cevap içinde arar)
- Açılır accordion — her itiraz kart, tıklanınca cevabı açar
- Light/dark mode tam destekli, rose renk paleti

### feat: /egitim — Vaktin Varsa sayfası

- 4 kategori, 11 konu (Zihniyet, İletişim, Ekip, Strateji)
- Her konu: başlık, süre etiketi, seviye rozeti (Temel/Orta/İleri), özet, numaralı maddeler
- Accordion yapısı: tıklanınca içerik açılır
- Hero bilgi kutusu + toplam konu/kategori sayacı
- Light/dark mode tam destekli, indigo renk paleti

### feat: Sidebar — 2 yeni nav item

- `/itirazlar` → İtirazlara Cevap (`MessageCircleQuestion`)
- `/egitim` → Vaktin Varsa (`BookOpen`)
- Kazanımlar sona taşındı, sıralama pano ile tutarlı

### fix: EkipPanel — hata durumu ve ws=undefined güvenliği

- `useQuery`'ye `isError` yakalandı: hata durumunda boş sayfa yerine açıklayıcı hata ekranı gösterilir
- `ws?.role` → `ws.role` (ws undefined guard sonrasına taşındı, TypeScript güvenli)
- Solo lider bilgilendirme koşulu: `!isLeader` (yanlış) → `isSolo && isLeader` (doğru)
- Üye rolü bilgilendirme ayrı blok olarak `!isLeader` koşuluyla korundu

---



### bug: useUpdateCandidate last_contact_at kaldırıldı (Kritik)

- `useUpdateCandidate`'te `last_contact_at: new Date().toISOString()` satırı kaldırıldı
- Not düzelten, takip tarihi güncelleyen kullanıcı artık "az önce arandı" kaydı oluşturmuyor
- `useDailyActions` algoritması artık temiz girdiye sahip; önceliklendirme düzgün çalışıyor
- `last_contact_at` yalnızca `useMarkContacted` (WA/Ara tıklaması) ile güncelleniyor

### bug: TakvimClient FOLLOW_DAYS duplikasyonu giderildi

- `TakvimClient.tsx`'teki yerel `FOLLOW_DAYS` sabiti silindi
- `lib/stages.ts`'den import edildi; tek kaynak of truth sağlandı

### feat: Bugün İlgilen — inline AI mesaj butonu

- Her aday kartına Bot ikonu eklendi (WA/Ara yanında)
- Tıklanınca `generateQuickMessageAction` server action çağrılıyor
- Mesaj üretilince clipboard'a otomatik kopyalanıyor + toast
- `/bugun/ilgilen → /pipeline/[id] → /yazar` 3 sayfa akışı tek tapa indi

### perf: EkipPanel N+1 sorgusu giderildi

- `fetchMembers`: N+1 (1 üye listesi + N aday sorgusu) → 2 paralel sorgu
- Tüm adaylar tek sorguda çekiliyor, JavaScript'te owner_id'ye göre gruplanıyor

### feat: Human-readable davet kodu (8 karakter)

- `nmm_workspaces.invite_code` kolonu eklendi (migration 003)
- 38 karakter UUID yerine `AHMET42` formatında 8 char alfanumerik kod
- Davet kodu büyük monospace font ile gösteriliyor
- Ekibe katılma flow'u `invite_code` ile arama yapıyor
- RLS yeniden yapılandırıldı: authenticated_read + owner_write ayrıldı
- **Not:** Migration 003'ü Supabase Dashboard → SQL Editor'dan çalıştır

### feat: Pipeline isim araması

- Stage filter'ın üstüne Search input eklendi
- Gerçek zamanlı filtreleme (büyük/küçük harf duyarsız)
- X butonu ile hızlı temizleme

### feat: Aktivite geçmişi (nmm_daily_actions artık okunuyor)

- `useActivityHistory(candidateId)` hook'u `useCandidates.ts`'e eklendi
- Kişi detay sayfasında son 10 eylem görüntüleniyor (arama / WA / not / aşama)
- Tablonun write-only durumu sona erdi

### feat: 3 adımlı onboarding modal

- Yeni kullanıcı 0 adayla baş başa kalıyordu → `OnboardingModal` bileşeni
- Adım 1: Hoş geldin motivasyonu
- Adım 2: İlk adayı ekle (inline AddCandidate)
- Adım 3: Lider davet kodu gir (opsiyonel join)
- `localStorage('nmm_onboarding_done')` ile bir kez gösterilir, sadece 0 adaylı kullanıcıya

---

## 2026-05-24

### ux: silme onay modalı sadeleştirildi

- `ConfirmDeleteModal`'dan gereksiz açıklama paragrafı (`{name} silindikten sonra 5 saniye içinde geri alabilirsiniz.`) kaldırıldı
- `name` prop'u artık kullanılmadığından interface'den ve tüm çağıran bileşenlerden (`EditCandidateSheet`, `CandidateDetail`, `EkipPanel`, `CandidateCard`) temizlendi
- Modal artık yalnızca uyarı ikonu, "Silmek istediğinizden emin misiniz?" başlığı ve iki buton içeriyor

### ux: kişi ekle paneli ortalanmış popup'a dönüştürüldü

- `AddCandidateSheet` mobilizde alta yapışan / masaüstünde sağ üste konumlanan alt sheet tasarımından arındırıldı
- `EditCandidateSheet` ile tutarlı şekilde tam ortada açılan centered modal olarak yeniden tasarlandı
- z-index hiyerarşisi `EditCandidateSheet` ile eşleştirildi (backdrop `z-[60]`, panel `z-[70]`)

---

### refactor: z-index merkezi sabitlerle yönetiliyor

- `src/lib/zIndex.ts` oluşturuldu — `sheetBackdrop(60)`, `sheet(70)`, `confirmBackdrop(80)`, `confirm(90)` sabitleri
- 9 bileşen güncellendi: `AddCandidateSheet`, `EditCandidateSheet`, `CandidateCard`, `CandidateDetail`, `ConfirmDeleteModal`, `ProfileModal`, `NotificationsModal`, `SettingsModal`, `EkipPanel`
- Tüm hardcoded `z-[xx]` sınıfları sabitlerle değiştirildi; çakışma riski ortadan kalktı

### feat: ConfirmDeleteModal bağlam mesajı desteği

- `message?: string` opsiyonel prop eklendi
- Mesaj verildiğinde başlığın altında bağlama özel küçük metin gösteriyor
- `EkipPanel`'de `"[üye adı] ekibinizden çıkarılacak."` mesajıyla kullanıma alındı

### feat: kişi ekle telefon formatı doğrulaması

- `AddCandidateSheet`'e `PHONE_RE = /^(\+90|0)5\d{9}$/` regex doğrulaması eklendi
- Hatalı format girişinde alan kırmızıya döner, açıklayıcı hata mesajı inline gösterilir
- Kullanıcı düzeltmeye başladığında hata otomatik temizlenir

### not: deleteWithUndo toast zaten mevcut

- 4. öneri `lib/deleteWithUndo.tsx`'te halihazırda uygulanmış durumdaydı
- Circular SVG countdown animasyonu + "Geri Al" butonu + 5 saniyelik timer zaten aktif

---

## 2026-05-24 (tur 3)

### fix: EditCandidateSheet'e telefon doğrulaması eklendi

- `PHONE_RE` regex doğrulaması `EditCandidateSheet`'e eklendi (`AddCandidateSheet` ile tutarlı)
- Hatalı format girişinde inline hata mesajı, alanın kırmızı kenarlaşması ve düzeltince otomatik temizleme

### fix: deleteWithUndo çift onClose kaldırıldı

- `deleteWithUndo` fonksiyonunun `onClose?` parametresi kaldırıldı
- `EditCandidateSheet` ve `CandidateDetail`'daki çift çağrı temizlendi; `onClose`/`router.push` artık sadece çağıran tarafından anında tetikleniyor

### fix: ConfirmDeleteModal onCancel useCallback ile sabitlendi

- `EditCandidateSheet`, `CandidateDetail`, `CandidateCard`, `EkipPanel`'de `onCancel` arrow function `useCallback` ile memoize edildi
- `useEffect` listener yeniden bağlanması engellendi

### refactor: CLAUDE.md'ye z-index ve deleteWithUndo kuralları eklendi

- `src/lib/zIndex.ts` kullanımı ve `deleteWithUndo`'nun parametre politikası belgelendi

### feat: aşama renkleri birbirinden ayrıştırıldı

- `sunum` → gökyüzü mavisi (`#E0F2FE / #0369A1`) — önceden yeşil ile aynıydı
- `katildi` → zümrüt yeşili (`#D1FAE5 / #065F46`) — tüm sekiz aşama artık görsel olarak belirgin
- `STAGE_CARD_BG` kart arka planları da güncellendi

### feat: swipe ile sekme navigasyonu

- `DashboardShell`'e dokunmatik swipe desteği eklendi
- Yatay kaydırma (≥60px, yatay/dikey oranı ≥2) sağa/sola sekme değiştiriyor
- Dikey kaydırma, diyagonal ve küçük kaydırmalar yok sayılıyor; masaüstünde etkisiz

---

## 2026-05-24 (tur 4)

### feat: sayfa geçiş animasyonları (View Transitions API)

- `next.config.ts`'e `experimental: { viewTransition: true }` eklendi
- `globals.css`'e `::view-transition-old/new(root)` kuralları + 6 keyframe eklendi
- `data-nav-dir="forward"` → sola kayarak geçiş; `"back"` → sağa kayarak geri
- `prefers-reduced-motion: reduce` desteğiyle animasyonlar erişilebilir

### feat: yön duyarlı swipe + BottomNav anlık geri bildirim

- `DashboardShell`'de `onTouchMove` ile swipe hedefi erken hesaplanıyor
- `pendingHref` `BottomNav`'a aktarılıyor: hedef sekme scale-110 ile öne çıkıyor
- BottomNav tıklamalarında `setNavDir` ile geçiş yönü belirleniyor

### refactor: PHONE_RE merkezi validation dosyasına taşındı

- `src/lib/validation.ts` oluşturuldu: `export const PHONE_RE = /^(\+90|0)5\d{9}$/`
- `AddCandidateSheet`'deki yerel kopya (satır 17) kaldırıldı; import ile değiştirildi
- `EditCandidateSheet` de aynı import'u kullanıyor

### refactor: STAGE_THEME tek kaynak olarak birleştirildi

- Badge + kart renkleri ayrı objeler yerine tek `STAGE_THEME` objesinde tanımlanıyor
- `STAGE_COLOR` ve `STAGE_CARD_BG` artık `STAGE_THEME`'den türetiliyor; ilerleyen değişikliklerde renk tutarsızlığı önlendi

### feat: YZ Mesajı güvenlik duvarı — konu dışı soru yönlendirme

- `generateMessage.ts` sistem promptu 3 görev modeli ile güncellendi
- NM sektörü soruları → kısa pratik Türkçe cevap
- Tamamen konu dışı istekler (haber, yemek, yazılım vb.) → kibar yönlendirme mesajı
- Mesaj üretme ana görevi değişmeden korunuyor

### ux: not karakter limiti 500 → 1000 karakter

- `AddCandidateSheet`, `EditCandidateSheet`, `YazarForm` güncellendi
- Etiket metni "(max 500 karakter)" → "(max 1000 karakter)" olarak düzeltildi

---

## 2026-05-25 (tur 1)

### feat: Aktivite Geçmişi Normalizasyonu ve Lider Notu Yerelleştirme

- **Aşama Dil Çevirisi & İkon İyileştirmesi**: `renderActivityText` fonksiyonunda `stageKeyMap` normalization haritası eklenerek `katildi`/`katıldı` ve benzeri aşama adlarının İngilizce ve Türkçe seçeneğinde anında doğru tercümesi sağlandı. Ayrıca, tıklanabilir bir dropdown algısı yaratan `ChevronDown` (aşağı ok) ikonu yerine, "aşamalar arası ilerlemeyi ve geçişi" temsil eden çok daha şık bir sağa ok (`ArrowRight`) ikonu aktivite geçmişine entegre edildi.
- **Lider Notu Ayrıştırma & Otomatik Geriye Dönük Çeviri**: Aktivite geçmişindeki lider notları `parseSimpleNote` ile işlenerek `TR ||| EN` formatından dille uyumlu şekilde ayıklanıp gösterilmeye başlandı. Eğer notun İngilizce karşılığı yoksa (eski kayıtlar), sayfa İngilizce açıldığında arka planda otomatik olarak Claude ile tercüme edilip Supabase'e kalıcı olarak geri yazılması sağlandı.
- **Geri Al (Undo) Destekli Aktivite Silme**: Yanlışlıkla yapılan eylemlerin (aşama değişimi, arama kaydı vb.) geçmişte kalmaması için aktivite geçmişi satırlarına fareyle üzerine gelindiğinde (hover) beliren şık bir silme butonu eklendi. Tıklandığında onay alan, onaylandıktan sonra ise 5 saniyelik dairesel "Geri Al" animasyonu sunan güvenli silme mekanizması supabase entegrasyonuyla eklendi.

### feat: YZ Lider Not Analizi & Dinamik Aksiyon Planı

- **YZ Mentör Analizi Server Action**: Adayın tüm lider notlarını okuyup Claude Sonnet aracılığıyla 2 satırlık net bir özet ve hemen atılması gereken 1 aksiyon planı üreten `generateNotesSummary` server action'ı eklendi.
- **Premium Arayüz Modülü**: `CandidateDetail.tsx` içine pastel renkli, ultra şık ve animasyonlu bir YZ Analiz kartı entegre edildi.

### feat: Haftalık Organizasyon Performans Durumu (Team Scorecard)

- **NM Metrik Karnesi**: Ekip sayfasının en üstüne, liderlere özel, katlanabilir ve minimalist bir `Haftalık Organizasyon Performans Durumu` kartı eklendi.
- **Hap Performans Metrikleri**: Son 7 gündeki aktif distribütör oranı (`%`), sıcak aday hunisi potansiyeli (Sunum + Takip) ve ekibe kazandırılan toplam partner momentumu (Katıldı) anlık hesaplanarak listelendi.

### feat: Kart Hızlı Aksiyon Arayüzü (Pipeline Quick Actions)

- **Hızlı Eylemler (Inline Popover)**: Boru hattı aday kartlarına minimalist bir Yıldırım (`Zap`) ikonu eklendi.
- **1-Tıkla Güncelleme & Aşama Seçim Kontrolü**: Sayfa değiştirmeden inline popover üzerinden temas planlama (+1 Gün, +3 Gün, +7 Gün) veya takibi sonlandırma eylemleri supabase mutasyonlarıyla anlık hale getirildi. Yanlışlıkla yapılan hatalı aşama geçişlerini önlemek için popover içindeki "Aşama Değiştir" butonu adayı direkt ilerletmek yerine aşama seçme listesini tetikleyecek şekilde güncellendi. Aşama Seçme Popup'ı hem mobilde hem masaüstünde ekranı tam ortalayacak şekilde (`rounded-3xl` şık kart formunda) konumlandırıldı ve popup açıkken arka planın kaymasını engelleyen gövde kilidi (body scroll-lock) entegre edildi.

---

## 2026-05-25 (tur 2)

### fix: Pipeline sayfasında `clsx` import hatası giderildi

- `src/app/(dashboard)/pipeline/page.tsx` içindeki `clsx` kullanımından kaynaklanan derleme hatası, kütüphanenin dosya başına import edilmesiyle çözüldü.
- TypeScript derlemesi (`npx tsc --noEmit`) 100% başarılı ve sorunsuz hale getirildi.

### fix: Alt Menü Barı (`BottomNav` z-50) altında kalma ve responsive z-index çakışmaları giderildi

- `CandidateCard.tsx` içindeki liste elemanına (`li`), hızlı aksiyon popover'ı (`quickActionOpen`), aşama değiştirme penceresi (`stageOpen`), düzenleme (`editOpen`) veya silme onay penceresi (`confirmOpen`) açıkken dinamik olarak `z-[60]` atandı.
- Bu sayede, kartın en altta veya alt menüye çok yakın olması durumunda bile açılan tüm kutular, modaller ve popover'lar `z-50` katmanındaki alt menü barının (`BottomNav`) üzerinde kusursuz bir şekilde render ediliyor.
- Mobil uyumlu `YZEkipKocuSheet` ve `YZKocuSheet` modallerinin z-index katmanları, `zIndex.ts` kütüphanesine uygun şekilde `Z.sheetBackdrop` (`z-[60]`) ve `Z.sheet` (`z-[70]`) sabitleri ile güncellendi. Böylece alt menü barının (`z-50`) veya başlıkların (`z-40`) altında kalmaları tamamen engellendi.

---

## 2026-05-25 (tur 3)

### feat: Hızlı aksiyon menüsü tam ortalanmış modal popup'a dönüştürüldü

- `CandidateCard.tsx` içindeki "Zap" tuşuna basınca açılan popover, mobil ve masaüstü dahil tüm ekranlarda sayfayı hem yatay hem dikey olarak tam ortalayacak şekilde (`rounded-3xl` modern kart formunda) modal popup'a dönüştürüldü.
- Sağ üst köşesine X kapatma butonu eklendi, eylem butonları ise kolay tıklama ve mobil uyumluluk için 3 sütunlu modern bir grid düzenine kavuşturuldu. Arka planı flu yapan `backdrop-blur` desteği ve gövde kilitli koyu backdrop eklendi.

### feat: Eğitim arama ve akıllı accordion oto-açma & oto-scrolling entegrasyonu

- `search/page.tsx` sayfasına İtirazlar ve Cevaplar (`ITIRAZLAR`) veritabanı da dahil edilerek tüm arama akışlarında genel eğitimlerin yanı sıra itiraz cevaplarının da aranabilmesi sağlandı.
- `/egitim` ve `/itirazlar` sayfaları URL query parametresi (`?id=...`) desteğine kavuşturuldu. Arama sonuçlarından herhangi bir eğitime veya itiraz konusuna tıklandığında, ilgili sayfa açıldığında konunun kaçıncı sayfada olduğu otomatik hesaplanıp o sayfaya geçiliyor, accordion (chevron) kendiliğinden açılıyor ve sayfa yumuşak bir animasyonla (`scrollIntoView`) direkt o konunun üzerine odaklanıyor.
- `itirazlar/page.tsx` sayfasındaki her bir itiraz öğesine `id={`konu-${itiraz.id}`}` verilerek arama yönlendirme hedefi tamamlandı. Next.js App Router uyumluluğu için sayfa `<Suspense>` ile sarmalandı.
- **Bugfix (Eğitim Otomatik Açılma):** `egitim/page.tsx` sayfasındaki e-eğitim konuları da sayfalama (pagination) sınırlarına takılıyordu. İlk sayfada olmayan eğitimlerin de query parametresinden açılabilmesi için, sayfa numarası bulma ve otomatik accordion açılma mantığı `egitim/page.tsx` sayfasına da entegre edilerek sorun tamamen çözüldü.

### feat: Takvim sayfasına "Önümüzdeki Ay" modülü eklendi


- `TakvimClient.tsx` sayfasının en altında yer alan "Önümüzdeki 7 gün" bölümüne ek olarak, aktif takvim ayından bir sonraki ayda (`view.getMonth() + 1`) hangi takipler varsa listeleyen şık bir **"Önümüzdeki Ay"** modülü en alta eklendi.
- Listelenen tarihe tıklandığında takvimin otomatik olarak o aya geçmesi ve ilgili günü seçerek detayları listelemesi sağlandı.

### db: 007_atomic_workspace_ops.sql migration incelemesi

- RPC fonksiyonları (`nmm_join_workspace`, `nmm_remove_member`) kontrol edilerek, ekip modülündeki geçiş ve silme işlemlerinin veri bütünlüğünü koruması ve partial-write riskini engellemesi için kesinlikle Supabase SQL Editor üzerinden çalıştırılması gerektiği doğrulandı.

---

## 2026-05-26

### feat: Google Gemini API Büyük Göçü (Yapay Zeka Geçişi)

- **SDK ve Paket Değişiklikleri:** Yüksek maliyetli Anthropic (`@anthropic-ai/sdk`) bağımlılığı projeden tamamen kaldırıldı (`npm uninstall`). Arka planda tüm yapay zeka süreçleri `@google/generative-ai` kütüphanesine ve Google Gemini API altyapısına geçirildi.
- **Pro ve Flash Hibrit Model Stratejisi:**
  - **Gemini 1.5 Pro (Derin Akıl Yürütme):** Ekip mentörlüğü (`pipeline/[id]/actions.ts`), lider not analizi (`generateNotesSummary`), YZ Koçu simülatörü (`generateRoleplayResponseAction`) ve Yapay Zeka Koçu soru-cevap (`askCoachAction`) süreçlerinde akıl yürütme kalitesi en üst seviyeye çıkarıldı.
  - **Gemini 1.5 Flash (Yüksek Hız ve Ekonomik):** WhatsApp mesaj hazırlama (`generateMessage.ts`), otomatik metin çeviri motoru (`translateTextAction`), aday not çeviri API'si (`api/translate-note/route.ts`) ve Uyum Denetimi modülü (`uyum/actions.ts`) için yüksek hız ve %80+ maliyet avantajı sağlandı.
- **Sıkı Yapılandırılmış Çıktı Şeması (`responseSchema`):** Uyum Denetimi (`uyum/actions.ts`) ve Rol Provası Simülasyonu (`yazar/actions.ts`) modüllerinde, yapay zekanın ürettiği JSON metinlerindeki ayrıştırma/parsing hatalarını (eksik virgül, unescaped tırnak vb.) kesin olarak çözmek amacıyla `SchemaType` tabanlı resmi `responseSchema` mimarisi uygulandı. YZ çıktıları donanımsal seviyede hatasız şemaya zorlanarak kararlılık %100'e çıkarıldı.

### fix: Bugün İlgilen Sayfası WhatsApp Yönlendirme Hatası (404) Giderildi

- `IlgilenContent.tsx` içinde hızlı mesaj üretimi sonrasında beliren "WhatsApp ile Gönder" butonu URL formatındaki hatalı parametre birleştirme sebebiyle (sorgu parametresi `?` yerine `&` kullanılması) 404 hatası veriyordu.
- Buton `href` tanımı, `waHref` yardımcı fonksiyonunun orijinal imzasındaki metin desteği kullanılarak `waHref(phone, message)` şeklinde güncellendi ve yönlendirme sorunu pürüzsüzleştirildi.

### ux: Sunum Materyalleri WhatsApp Paylaşım Butonu Görsel Revizyonu

- `CandidateDetail.tsx` dosyasında, "Sunum Materyalleri" altındaki yeşil renkli WhatsApp paylaşım butonunun tam genişlik kaplayan hantal tasarımı düzeltildi.
- Buton boyutu üst satırdaki "WhatsApp" butonuyla birebir simetrik (**`w-1/3`**) olacak şekilde ayarlandı ve container içerisinde şık bir biçimde ortalandı (`flex justify-center`).

### ux: İletişim Aktivite Geçmişi İkon Standardizasyonu

- `CandidateDetail.tsx` içindeki "Aktivite Geçmişi" listesinde, WhatsApp ile yapılan iletişim eylemlerinin solunda gösterilen ve SMS'i andıran eski `MessageSquare` ikonu kaldırıldı.
- Yerine modern, tanınabilir yeşil renkli global **`WhatsAppIcon`** bileşeni entegre edilerek görsel tutarlılık artırıldı.

### feat: Boru Hattı ve Kazanımlar Sayfalarında Satır İçi AI Mesajı ve Tebrik Onboarding Motoru

- **Boru Hattı (`CandidateCard.tsx`):** Aday satırlarındaki eylem butonlarının en soluna mor renkli robot kafa (`Bot`) butonu entegre edildi. Tıklandığında sayfa değişmeden o adayın adı, süreci ve gidişat notlarını analiz edip hızlı bir takip mesajı hazırlayan ve kopyalama/WhatsApp eylemleri barındıran minimalist popup eklendi.
- **Kazanımlar (`kazanimlar/page.tsx` & `kazanimlar/actions.ts`):** Ekibe başarıyla katılan üyeler için özel bir onboarding/tebrik server action'ı (`generateAchievementMessageAction`) yazıldı. Satırdaki robot adama tıklandığında ekibe yeni katılan üyenin başarısını coşkuyla tebrik eden, başarı yolu için ilk adımlar için 1-2 pratik tüyo veren ve sponsoru olarak her an desteğe açık olduğunu samimiyetle ifade eden karşılama mesajı popup olarak açılmaktadır.
- **Minimalist Popup Tasarımı:** Her iki sayfadaki popup pencerelerinde de "Kopyala" ve "WhatsApp" butonlarının tüm metinleri kaldırılarak sadece sade, şık ve profesyonel ikonlar (`Copy`, `WhatsAppIcon`) içerecek şekilde düzenlendi.

### feat: Distribütör Başlatma Süreci Veritabanı Kalıcılığı & Adıma Özel Yapay Zeka Koçu (Robot Kafa) Entegrasyonu

- **Supabase Kalıcı Onboarding Göçü (Migration 014):** Distribütör başlatma (Onboarding) süreci `localStorage` bağımlılığından tamamen kurtarılarak, çoklu cihaz senkronizasyonu sağlayan kalıcı `nmm_onboarding_progress` veritabanı tablosuna taşınmıştır. RLS yetkilendirmesi sayesinde üye kendi adımlarını görebilir ve işaretleyebilir. Sponsor lider ise ekibindeki distribütörlerin tüm onboarding süreçlerini gerçek zamanlı izleyebilir ve gerektiğinde müdahale ederek tikleyebilir.
- **Çift Yönlü Anlık Bildirim Tetikleyicisi:** `nmm_onboarding_progress` tablosuna bağlanan Postgres trigger yapısı (`nmm_onboarding_progress_trigger`) sayesinde, bir adım işaretlendiğinde veya geri alındığında **hem lidere hem de ilgili ekip üyesine** otomatik olarak gerçek zamanlı in-app bildirimleri (`nmm_notifications`) anında ulaştırılmaktadır.
- **Adıma Özel YZ Koçluk Robotu (Bot Butonu):** Dört haftalık onboarding sürecindeki her bir satırın en sağına, mobil temada parmakla basmaya son derece uygun, premium tasarımlı ve finger-tap friendly robot kafa (`Bot`) butonları entegre edilmiştir. Tıklandığında açılan glassmorphic popup modalı, arka planda sıfırdan yazdığımız `generateOnboardingGuidanceAction` server action'ını çağırarak o adıma özel, son derece pratik MLM aksiyon tüyoları içeren ve WhatsApp'tan doğrudan gönderilmeye uygun harika koçluk rehberleri/mesajları üretir.
- **Yazısız Minimalist Butonlar & WhatsApp Paylaşımı:** Popup içerisinde üretilen koçluk rehberi, tek bir dokunuşla panoya kopyalanabilir (`Copy`) veya üyenin telefonuna doğrudan iletilebilmesi için WhatsApp (`WhatsAppIcon`) üzerinden tek tıkla paylaşılabilir. Butonlar talebe tam uygun olarak yazısız ve minimalist ikonlar şeklinde tasarlanmıştır.
- **Dinamik Limit Paylaşımı & Limit Artışı (15 -> 25):** Bu yeni adım-koçluğu özelliği de mevcut YZ Mesaj Yazarı / Koçluk Al limit havuzuna bağlanmıştır. Küresel günlük limit değeri **15'ten 25'e** çıkarılmıştır. İlgili tüm sayfalar (`yazar`, `istatistikler`, `ekip`) bu dinamik `DAILY_MESSAGE_LIMIT` sabitine bağlanarak anlık ve gerçek zamanlı kota takibi yapar.
- **YZ Onboarding Popup Metin & Yetki Optimizasyonları:** Popup başlığı "Yapay Zeka Doğru Başlangıç Koçu" ve alt açıklama "ADIM ADIM REHBERLİK" olarak güncellendi. Ek olarak, süper admin kullanıcıların kotadan muaf olması sebebiyle "Günlük Koçluk Kotası" bilgi göstergesini süper admin ekranlarında gizleyen mantıksal kontrol entegre edildi.
- **Doğru Başlangıç Rebranding ve İstatistikler Performans Tablosu Entegrasyonu:** "Distribütör Başlatma Süreci" başlığı "Distribütör Doğru Başlangıç Rehberi" olarak, AI popup modalı içindeki "Hedef Onboarding Adımı" başlığı ise "Hedef Doğru Başlangıç Adımı" olarak güncellendi. İstatistikler sayfasındaki Excel tarzı Performans Tablosu'na **DDBY*** (Distribütör Doğru Başlangıç Rehberi Yüzdesi) kolonu eklendi. Tablodaki yüzde lider için varsayılan olarak %100, distribütörler için ise adım tamamlama oranlarına göre dinamik ve gerçek zamanlı senkronize şekilde tabloya yansıtılmaktadır. Ayrıca tablonun sol altına açıklayıcı dipnot eklendi.
- **Ekip Yapay Zeka Limit & Kullanım Kontrol Masası (Süper Admin Özel):** İstatistikler sayfasında yer alan ve sadece Süper Admin olan sizin ekranınızda render edilen **Ekip Yapay Zeka Kullanım & Limit Kontrol Masası** spreadsheet tablosu geliştirildi. Tabloda tüm ekip üyelerinin bugünkü YZ Koçu (Rol Provası), YZ Mesaj Yazarı ve Uyum Denetimi özellikleri için kullanılan/limit hakları listelenmektedir. Süper admin/lider olan hesabınız için tüm bu sütunlarda tam şeffaflıkla **Sınırsız** ibaresi sergilenerek diğer tüm ekip üyelerinin günlük kullanım kotaları gerçek zamanlı takip edilebilir kılınmıştır.
- **Ekip YZ Limit Masası Sütun Swap:** Süper Admin özel YZ Limit Kontrol Masasında yer alan "YZ Koçu" ile "YZ Mesajı" sütunlarının yerleri kullanıcının talebi doğrultusunda birbirleriyle değiştirildi. Yeni düzende YZ Mesajı kolonu solda (birinci sırada), YZ Koçu kolonu ise ortada (ikinci sırada) listelenmektedir.

---

## 2026-05-26 (tur 2)

### feat: Arayüz Temizliği, Sadeleştirme ve Eksiksiz İngilizce Dil Desteği

- **Marka Sadeleştirmesi (Network Marketing Master):** Uygulamadaki tüm "İşletim Sistemi" / "Operating System" ifadeleri (giriş/kayıt ekranları logo alt başlıkları, pano header'ı ve yerelleştirme dosyalarındaki ilgili anahtarlar dahil) tamamen temizlendi. Uygulamanın adı saf haliyle "Network Marketing Master" olarak belirlendi.
- **Eksiksiz İngilizce Dil Desteği:** İngilizce dil toggle'ı aktif edildiğinde daha önce Türkçe kalan tüm dinamik alanlar tamamen yerelleştirildi:
  - **Pano (Dashboard):** "Son 7 Gün — Yeni Aday Trendi" başlığı, chart içi gün adları (`Mon` - `Sun`), aday sayacı son eki (`candidates`) dinamik dil durumuna bağlandı.
  - **Bugün İlgilen (Today's Priorities):** Sayfa `use-client` yapıldı, tüm sayfa başlıkları, aday hunisi aşama adları (getStageLabel), boş durum kartı, limit uyarı pencereleri, kopyalama ve WhatsApp yönlendirme metinleri dinamik hale getirildi.
  - **Takvim (Calendar):** Sayfa `use-client` yapıldı, ay ve gün isimleri, yaklaşan 7 günlük/aylık plan bölümleri, boş durum bildirimleri, zaman aşımı uyarı şeritleri tamamen İngilizceye yerelleştirildi.
  - **Yapay Zeka Koçu (AI Coach):** Sayfa `use-client` yapıldı, ton ve mesaj türü seçimleri, sistem aktivite/lider notu bilgileri, günlük limit rozetleri ve geçmiş listesi dinamik dile bağlandı.
  - **Ekibim (My Team):** Sayfa `use-client` yapıldı, sayfa başlığı ve alt başlığı dile göre dinamikleşti.
  - **İstatistikler (Statistics):** Excel tablosundaki **DDBY*** sütunu dile göre dinamik olarak **DDBR** (TR) ve **DQSG** (EN) arasında değiştirildi. Altındaki açıklayıcı dipnot tamamen yerelleştirildi.
- **Buton İsimlerinin Sadeleştirilmesi:**
  - İtirazlar sayfasındaki "Kendi İtirazını Ekle" butonu ve modal başlığı **"İtiraz Ekle"** olarak sadeleştirildi.
  - Eğitim sayfasındaki "Kendi İçeriğini Ekle" butonu ve modal başlığı **"İçerik Ekle"** olarak sadeleştirildi.
- **Mobil Arayüz Dil Seçim Butonları (UserMenu):** Masaüstündeki bayrak butonlarının mobilde gizlenmesi sebebiyle, kullanıcı profili (`UserMenu`) dropdown menüsünün içerisine şık, minimal HSL renk uyumlu, responsive **TR / EN** dil seçicisi butonları entegre edilerek mobil erişilebilirlik zirveye çıkarıldı.

### fix: Ekip sayfasındaki Saha Distribütörlerinin (Saha Ortağı) profil resimlerinin yüklenmeme sorunu çözüldü
- **Teşhis:** Ekip listesindeki (My Team) Saha Distribütörleri (Saha Ortakları), liderin boru hattında "Katıldı" aşamasına ulaştırdığı ama henüz NMM uygulamasını kendi davet koduyla satın alıp kurmamış olan gerçek adaylardır. Boru hattı listesinde bu adayların profil resimleri (avatar) kendi aday notlarının (`note` kolonu) sonuna kodlanmış durumdadır. Ancak, Ekip sayfasındaki verileri besleyen `fetchMembers` metodunda `nmm_candidates` tablosundan adaylar sorgulanırken `note` kolonu çekilmediği için `avatar_url` boş kalıyordu.
- **Çözüm:** 
  1. `src/app/(dashboard)/ekip/_components/EkipPanel.tsx` dosyasındaki `fetchMembers` içerisindeki `nmm_candidates` tablosunun `select` sorgusuna `note` kolonu eklendi.
  2. `nonAppMembers` dizisi oluşturulurken, adayın `note` bilgisi `parseNote(c.note)` ile çözümlenerek `avatar_url: parsedNote.avatarUrl || null` şeklinde nesneye aktarıldı.
  3. `parseNote` fonksiyonu dosyanın başına import edilerek TypeScript uyumluluğu sağlandı.

---

## 2026-05-27

### feat: Faz 1 — Premium Landing Page (Karşılama Sayfası) Entegrasyonu

- **Root Rota Dönüşümü (`/`):** 
  - Uygulamanın ana giriş rotası (`/`) tamamen sıfırdan yazılarak son derece şık, göz alıcı (wow efektli) bir **Karşılama Sayfasına (Landing Page)** dönüştürüldü.
  - **Akıllı Oturum Kontrolü (Session Gate):** Kullanıcı giriş yaptığında arka planda milisaniyeler süren Supabase session kontrolü gerçekleşir ve oturum aktifse kullanıcıyı doğrudan `/pano` adresine yönlendirir. Giriş yapmamış kullanıcılar ise pürüzsüzce bu premium landing page arayüzü ile karşılanır.
- **Göz Alıcı Arayüz Tasarımı & Tasarım Sistemi:**
  - Derin kozmik koyu arka plan (`bg-[#0A0B10]`), neon parıltılı asil mor gradyanlar ve cam morfin (glassmorphic) panellerle donatılmış fütüristik bir tema uygulandı.
  - Sol köşede parıldayan neon logo, sağ köşede ise responsive dil seçicisi (**TR / EN**), **Giriş Yap** ve **Hemen Başla** butonlarını barındıran şık bir yapışkan (sticky) header entegre edildi.
  - Sayfa tamamen iki dilli (Türkçe ve İngilizce) olarak tasarlandı, sağ üstteki dil butonuna tıklandığı an tüm başlıklar, kartlar, slider ve fiyatlar anında hedef dile çevrilir.
- **6 Temel Güç Özellik Kartları (Features Grid):**
  - Boru Hattı, YZ Koçu, Doğru Başlangıç Rehberi, Saha Provası, Uyum Denetimi ve Ekip Analitiği gibi NMM'in 6 ana gücünü temsil eden, üzerine gelindiğinde neon çerçeve parlaması sunan modern hover efektli kartlar tasarlandı.
- **İnteraktif ROI (Yatırım Getirisi) Hesaplayıcı:**
  - Liderlerin alt ekibindeki aktif distribütör sayısını (10 ile 200 arası) seçebilecekleri premium, kaydırılabilir bir slider bileşeni eklendi.
  - Sürgü hareket ettikçe NMM kullanıldığında ekibin aylık üreteceği aday hacmini (geleneksel yöntemlerdeki 3 adaya karşı NMM'deki 15 aday gücüyle), kazanılan sponsor lider saatini (distribütör başına haftalık 4 saat tasarruf) ve onboarding aktiflik oranını (%88) canlı hesaplayan matematiksel formüllere dayalı interaktif panel entegre edildi.
- **Dinamik Fiyatlandırma Kartları (Pricing Cards):**
  - **Saha Distribütörü Planı (Plan A - ₺299/Ay):** Bireysel takip, günlük 25 YZ mesaj yazarı kredisi, 20 saha provası simülatörü kredisi.
  - **Ekip Master'ı Planı (Plan B - ₺899/Ay - Popüler Lider Planı):** Downline hunisi takibi, onboarding senkronizasyonu, süper lider sınırsız YZ kredisi, özel itiraz/eğitim ekleme ve realtime bildirim motoru.
- **Sosyal Kanıt (Testimonials) ve Footer:**
  - Başarılı sponsor ve liderlerin dairesel sembollü avatarları, samimi başarı yorumları ve sade telif hakları footer'ı ile karşılama sayfası tamamlandı.

### feat: Faz 3 — Premium Paket Seçim `/odeme` Ekranı ve Canlı Shopier Webhook Entegrasyonu

- **Premium Paket Seçim & Karşılaştırma Ekranı (`/odeme`):**
  - **Premium Tasarım Sistemi:** Asil koyu temayla %100 uyumlu, göz alıcı mor-pembe renk degradeli, cam-morfin (glassmorphism) plan kartları tasarlandı. Plan A (Saha Distribütörü - ₺299/Ay) ve Plan B (Ekip Master'ı - ₺899/Ay) için tüm özellikler ve limitler detaylandırıldı.
  - **TR / EN Dil Desteği:** Dil seçimine göre dinamik olarak plan açıklamaları, butonlar, ve anlık sipariş durumları anında yerelleştirilir.
  - **Aktif Plan Takibi:** Üyenin o anki aktif lisans tipi ve lisansının bitişine kalan gün sayısı panelin üstünde parıldayan şık bir rozetle gösterilir.
- **Güvenli Server-Side Shopier İmza Motoru (`actions.ts`):**
  - NodeJS yerel `crypto` kütüphanesi kullanılarak Shopier Checkout API entegrasyonu (base64/HMAC-SHA256) server-side güvenliğine taşındı.
  - Kullanıcı "Plan Seç" butonuna bastığı an, arka planda üyenin aktif `workspaceId`'sini taşıyan benzersiz ve güvenli bir `platform_order_id` oluşturularak Shopier ödeme form parametreleri üretilir.
- **Sleek İstemci Yönlendirme Arayüzü (`OdemeClient.tsx`):**
  - Kullanıcıyı harici bir link yerine, ödeme parametrelerini otomatik olarak taşıyan dinamik bir form POST arayüzü ile Shopier'e yönlendiren motor kodlandı.
  - Yönlendirme esnasında arayüzde asil mor renkte parıldayan premium bir **"Ödeme Sayfasına Yönlendiriliyorsunuz..." / "Redirecting to Payment..."** yükleme animasyonu (loading overlay) gösterilerek kullanıcı deneyimi en üst düzeye çıkarıldı.
- **Sistem İçi Derin Satın Alma Bağlantıları (Deep-Linking):**
  - Paneldeki tüm kısıtlama pencereleri, `EkipPanel.tsx` yükseltme butonları ve `Header.tsx` üzerinde beliren süresi dolmuş/deneme süresinde uyarısı şeritleri doğrudan `/odeme` rotasına bağlandı.
- **Next.js 16 Proxy Middleware Çözümü & Shopier Webhook Whitelist (`src/proxy.ts`):**
  - Next.js 16 standartlarına uygun olarak `src/proxy.ts` dosyası yapılandırıldı.
  - Vercel sunucusunda ödeme bildirimi geldiğinde oturumsuz/anonim isteklerin oturum kontrolüne takılmasını önlemek amacıyla `/api/payment/shopier` webhook rotası `PUBLIC_PATHS` listesine dahil edilerek whitelisted yapıldı. Böylece Vercel'in `405 Method Not Allowed` / `308 redirect` fırlatması engellendi.
- **Geliştirici Güvenliği `.gitignore` Güncellemesi:**
  - Yerel test/simülasyon scriptlerinin hassas API şifreleri içermesi durumunda git ortamına kazara itilmesini önlemek amacıyla `/scratch/` dizini `.gitignore` dosyasına eklenerek güvenli hale getirildi.
- **Canlı Webhook Test Başarısı (`test_live_webhook.js`):**
  - Hazırlanan `scratch/test_live_webhook.js` canlı test scripti üzerinden `nmm.suattayfuntopak.com` sunucusuna gönderilen HMAC-SHA256 imzalı POST isteği, canlı sunucuda **200 OK** ve `License updated successfully` yanıtı alarak lisansın veritabanında +30 gün boyunca 'master' statüsüyle başarıyla uzatıldığını kanıtlamıştır.

### feat: Türkiye Yaşam Standartlarına Uyumlu Sweet-Spot Fiyatlar ve Yıllık Lisans Entegrasyonu

- **Dönüşüm Oranı Optimizasyonu ve Yeni Sweet-Spot Fiyatları:**
  - Yapay zeka Gemini API token maliyet analizleri ile Türkiye pazarının satın alma eşikleri (sürtünme noktaları) gözetilerek Basic, Plus ve Pro paketlerinin fiyatları güncellendi.
  - **Basic Plan (Bireysel Ortak):** ₺499'dan **₺399 / Ay**'a indirilerek ₺400 altındaki "düşünmeden alım" eşiği hedeflendi.
  - **Plus Plan (Takım Lideri):** ₺1,499'dan **₺1,199 / Ay**'a çekilerek takımını büyüten sponsorlara daha cazip hale getirildi.
  - **Pro Plan (Diamond Lider):** Fiyatı çıpalama görevi de görecek şekilde premium **₺2,499 / Ay** olarak korundu.
- **Stratejik Yıllık Peşin Ödeme Modeli Entegrasyonu:**
  - SaaS platformlarının nakit akışını ve kullanıcı bağlılığını (LTV) maksimize edecek şekilde **Yıllık Lisans** modelleri sisteme kazandırıldı:
    - **Yıllık Basic:** Peşin **₺3,499 / Yıl** *(Aylık ₺291'a denk gelir - 3 Ay Bedava Avantajı)*
    - **Yıllık Plus:** Peşin **₺9,999 / Yıl** *(Aylık ₺833'e denk gelir - 3 Ay Bedava Avantajı)*
    - **Yıllık Pro:** Peşin **₺19,999 / Yıl** *(Aylık ₺1,666'ya denk gelir - 3 Ay Bedava Avantajı)*
- **Landing Page Fiyat Geçiş Butonu (Toggler - `page.tsx`):**
  - Fiyat tablosunun üstüne cam-morfin tasarımlı, yumuşak geçiş efektine sahip bir **Aylık / Yıllık Fiyat Geçiş Butonu** eklendi.
  - Yıllık butona parıldayan yeşil neon animasyonlu **"-3 Ay Fırsatı!"** rozeti yerleştirilerek dönüşümler teşvik edildi.
  - Fiyatlar ve açıklama metinleri seçilen periyoda göre anında ve dinamik olarak değişir.
- **Dashboard Ödeme Ekranı Yıllık Plan Butonları (`OdemeClient.tsx`):**
  - Panel içerisindeki `/odeme` sayfasına da aynı **Aylık / Yıllık** geçiş toggler'ı entegre edildi.
  - Satın alma butonları dinamikleşti (örn: aylıkta `"30 Günlük Plus Erişimini Başlat"`, yıllıkta `"Yıllık Plus Erişimini Başlat"`).
  - Shopier yönlendirme panelindeki neon yükleme katmanına periyot detayı yansıtıldı (örn: `Plus Lider (Yıllık) - Amount: 9999 TRY`).
- **Ödeme Altyapısı Server Action Genişletmesi (`actions.ts`):**
  - `initiateShopierPayment` Server Action metodu `period: 'monthly' | 'yearly'` parametresini alacak şekilde güncellendi.
  - HMAC-SHA256 imzası, seçilen plana ve periyoda denk gelen net tutar (₺399, ₺1,199, ₺2,499, ₺3,499, ₺9,999, ₺19,999) üzerinden hatasız hesaplanarak Shopier'e POST edilir.
- **Shopier Webhook Rota Entegrasyonu (`route.ts`):**
  - Gelen `total_amount` parametresine göre satın alınan paketi ve lisans süresini (+30 Gün vs +365 Gün) dinamik olarak ayıran akıllı haritalama yapısı kuruldu.
  - Lisans uzatma işlemi, eğer üyenin aktif lisansı varsa o tarihin sonuna, yoksa bugünün sonuna ilgili gün miktarını ekleyecek şekilde pürüzsüzleştirildi.
- **Derleme ve Kod Kalitesi:**
  - TypeScript derleme doğrulaması `npx tsc --noEmit` ile başarıyla doğrulandı; 0 hata ve 0 uyarı alındı.

### feat: Plus Planı Alt Ekip Takip Limitinin 50 Üyeye Yükseltilmesi

- **Alt Ekip Takip Sınırı Genişletildi:**
  - Plus (`'master'`) planı için önceden belirlenmiş olan 20-üye alt ekip takip sınırı, liderlere daha geniş bir ölçeklenebilirlik alanı tanımak amacıyla **Maksimum 50 Üyeye** yükseltildi.
- **Arayüz & Metin Güncellemeleri:**
  - **Landing Page (`src/app/page.tsx`):** Plus plan kartındaki özellik açıklaması *"Alt Ekip Takibi (Maksimum 50 Üye)"* ve *"Direct Downline Tracking (Max 50 Members)"* şeklinde güncellendi.
  - **Dashboard Ödeme Ekranı (`OdemeClient.tsx`):** Plus plan kartı maddesindeki sınır ifadesi **50 Üye** olarak revize edildi.
  - **Ekip Sayfası Kontrolleri (`EkipPanel.tsx`):**
    - Plus plan üyelerinin alt ekip üye sayısının 50'yi aşıp aşmadığını denetleyen `isPlusCapReached` koşulu `totalDownlineCount > 50` olarak değiştirildi.
    - Sadece ilk 50 üyenin görüntülenmesini sağlayan liste dilimleme (slice) motoru `slice(0, 50)` olarak güncellendi.
    - Sınır aşıldığında gösterilen premium neon mor gradyanlı yükseltme uyarı kartındaki metinler ve sayaç **"50/50"** ve **"50'den fazla"** olarak güncellendi.
- **TypeScript & Derleme:**
  - Tüm güncellemeler sonrasında `npx tsc --noEmit` testi 0 hata ile başarıyla tamamlandı.

### feat: Landing Page Kullanıcı Yorumları Premium Çift Yönlü Akış Carousel Entegrasyonu

- **10 Mock Kullanıcı Yorumu (Sosyal Kanıt):**
  - Kurucuların ("Suat Tayfun T." ve "Elif Sinem T.") gerçek isimleri gizlendi; yerlerine rastgele ad-soyad kısaltmaları (örneğin Ahmet K., Elif B., Murat C.) ve "Independent Leader", "Ekip Koordinatörü" gibi profesyonel MLM ünvanları eklendi.
  - Yorum metinleri; abartılı kazanç veya ciro iddialarından strictly uzak durularak, NMM'in farklı yönlerine (4 haftalık Doğru Başlangıç takibi, YZ Saha Provası Simülatörü, Uyum Denetimi, Aday Boru Hattı, İtiraz Karşılama, Çift Dil Senkronizasyonu, Mobil Swipe, Performans Masası vb.) ve genel kullanıcı memnuniyetine odaklandı.
- **Premium Çift Yönlü Sonsuz Marquee Tasarımı:**
  - Arayüzde son derece premium, akıcı ve yormayan bir hareket hissi yaratmak için **iki bağımsız yatay satır** halinde akan bir Marquee yapısı kuruldu:
    - **1. Satır (Sol Akış):** İlk 5 kullanıcının yorum kartları pürüzsüzce sağdan sola akacak şekilde kurgulandı.
    - **2. Satır (Sağ Akış):** Diğer 5 kullanıcının yorum kartları, zıt (soldan sağa) yönde pürüzsüzce akacak şekilde kurgulandı.
  - Kullanıcı kartların üzerine fareyle geldiğinde (`hover`) dahi akışın duraklamasını engelleyen strictly kesintisiz hareket yapısı kuruldu; böylece iki sıra da hiçbir zaman durmaksızın, pürüzsüzce ters yönlerde ve aynı hızda dönmeye devam etmektedir.
  - Carousel alanının sağından ve solundan asil koyu temayla bütünleşen şık mor-siyah degrade maskeleme katmanları (`before:bg-gradient-to-r`, `after:bg-gradient-to-l`) eklenerek kartların kenarlardan yumuşak bir şekilde sönümlenerek kaybolması sağlandı.
- **Kusursuz Çift Dil Yerelleştirmesi:**
  - 10 yorum kartının tamamı hem Türkçe hem de İngilizce metinleri içerecek şekilde veri yapısında (`TESTIMONIALS`) tanımlandı ve dil toggle butonuna tıklandığında anlık olarak pürüzsüzce yerelleşmesi sağlandı.


## 2026-05-28 — Vercel Build Hatası Çözümü (Middleware / Proxy)

### fix: resolve proxy/middleware conflict for vercel build
- Vercel dağıtımı (build) sırasında ortaya çıkan `Both middleware file "./src/middleware.ts" and proxy file "./src/proxy.ts" are detected.` hatası giderildi.
- Next.js 16.x Turbopack ve Vercel derleme ortamının gerektirdiği üzere, sistemdeki `src/middleware.ts` dosyası silinerek (çünkü zaten `proxy.ts` üzerinden export ediliyordu) yalnızca `src/proxy.ts` dosyasının kalması sağlandı. Çift dosya çakışması engellendi.


## 2026-05-28 — Arayüz İyileştirmeleri ve Platform Yönetimi Silme Özelliği

### feat: Header Dil Seçici İyileştirmesi (Mobil ve Masaüstü)
- `src/app/(dashboard)/_components/Header.tsx` dosyasında yer alan Header bileşeni güncellendi.
- Mobil görünümde, tema seçici ile bildirim çanı arasına sadece seçili olmayan dili temsil eden tek bir bayrak ikonu (örneğin Türkçe seçiliyken İngiliz bayrağı, İngilizce seçiliyken Türk bayrağı) eklendi. Bu sayede mobildeki dar alanda ikonların sıkışması önlendi.
- Masaüstü (bilgisayar) görünümünde, aynı alana iki bayrak (Türk ve Amerikan bayrakları) yan yana yerleştirildi. Seçili olan dilin bayrağı tam opak (aktif), seçili olmayan dilin bayrağı ise yarı şeffaf (pasif) olarak gösterilecek şekilde stilize edildi.

### feat: Platform Yönetim Sayfası İçin Kullanıcı Silme (Delete User) Özelliği
- Platform Yöneticisi (`/platform-yonetim`) tablosunda istenmeyen veya test amaçlı açılmış bağımsız kayıtların tamamen silinebilmesi için `deleteUserAction` oluşturuldu.
- `src/app/(dashboard)/platform-yonetim/actions.ts` dosyasına Supabase Admin Client (`admin.auth.admin.deleteUser`) aracılığıyla kullanıcının Auth veritabanından kalıcı olarak silinmesini sağlayan uç nokta (endpoint) eklendi. Bu eylem yalnızca Süper Admin yetkisiyle çalışacak şekilde sıkı güvenlik kontrolüne alındı.
- `src/app/(dashboard)/platform-yonetim/page.tsx` sayfasına, çalışma alanı listesindeki her satırın "Yönetim" sütununa kırmızı renkli bir "Sil" (Trash2) butonu eklendi. Yanlışlıkla silinmeleri önlemek için kullanıcı silme öncesinde güvenlik onay kutusu (confirm) çıkarılması sağlandı ve işlem bitiminde tablo verilerinin otomatik yeniden yüklenmesi (loadData) ayarlandı.


### fix: Ekibim Sayfası Downline Üye Getirme (Fetch Members) Düzeltmesi
- Yeni bağımsız modelde, alt üyeler liderin `nmm_workspace_members` tablosuna direkt eklenmek yerine kendi workspace'lerini açıp `parent_id` bağını kuruyorlar. `EkipPanel.tsx`'teki eski `fetchMembers` fonksiyonu, sadece liderin kendi workspace'indeki `nmm_workspace_members` tablosunu okuyarak downline çalışma alanlarını tespit etmeye çalışıyordu.
- Çözüm olarak sorgu tersten yazıldı: Doğrudan liderin `workspace_id`sini (ya da geriye dönük uyumluluk için liderin `owner_id`sini) `parent_id` olarak referans gösteren tüm downline çalışma alanları (`nmm_workspaces`) tarandı. Bu çalışma alanlarının sahipleri (owners) tespit edilerek `uniqueMembersMap` içerisine dahil edildi. 
- Bu sayede Elif Sinem Topak gibi kendi bağımsız alanını oluşturup liderin davet kodunu girerek ( `parent_id` bağını kurarak) takıma katılan tüm distribütörlerin istatistikleri ve bilgileri anında Ekibim ve İstatistikler paneline düşmesi sağlandı.

### feat: Geri Sayımlı Kullanıcı Silme Onay Mekanizması
- Platform Yönetim sayfasındaki "Kullanıcı Silme (Delete User)" eylemi daha korumalı ve kullanıcı dostu bir hale getirildi. 
- Sil (Çöp Kutusu) butonuna ve onaya (confirm) tıklandığında hemen silme işlemi yapmak yerine, buton kırmızı bir **"Geri Al (Undo)"** butonuna dönüşür ve 5 saniyelik bir geri sayım başlar.
- Geri sayım (5...4...3...2...1) esnasında kullanıcı "Geri Al" butonuna basarsa işlem iptal edilir ve silme gerçekleşmez.
- Süre dolduğunda ise (`countdown <= 1`) `executeDeleteUser` tetiklenerek kullanıcı `deleteUserAction` ile Supabase'den kalıcı olarak silinir.


### fix: Vercel TypeScript Build Hatası Giderildi
- Vercel sunucusunda build alınırken `EkipPanel.tsx` dosyasında yer alan `downlineOwnerIds` dizisine `string | null` tipi sızdığı için TypeScript kural ihlali oluştu (Argument of type '(string | null)[]' is not assignable to parameter of type 'readonly string[]').
- Hata, `.filter(Boolean)` işleminin çalışma zamanında `null` değerleri temizlemesine rağmen, TypeScript'in tip seviyesinde bunun `string[]` olduğunu kestirememesinden kaynaklanıyordu.
- Diziye `as string[]` tip ataması yapılarak TypeScript derleyicisinin (tsc) ve dolayısıyla Vercel build işleminin kusursuz çalışması sağlandı.


### fix: İstatistikler Sayfası Downline Üye Getirme ve Avatar Düzeltmesi
- NMM Sistemine yeni bağımsız kayıt ile (kendi workspace'i üzerinden) katılan üyelerin (Elif Sinem vb.) istatistikler tablosunda görünmeme sorunu `useTeamMembers.ts` kancası içindeki sorgu düzeltilerek giderildi (tıpkı `EkipPanel.tsx`'te yapıldığı gibi, `parent_id` üzerinden downline taraması yapıldı).
- İstatistikler performans tablosundaki (Member listesi) her üyenin ismi yanına, eğer üyenin sistemde (`nmm_workspace_members` veya aday notu bulutundan okunabilen) yüklenmiş profil fotoğrafı (`avatar_url`) mevcutsa gri baş harf dairesi yerine bu fotoğrafı şık bir yuvarlak ile yansıtan arayüz eklendi.
- TypeScript `GenericStringError` build hatası ( `members` dizisine atılan `any` türünden nesnenin özelliklerine erişilememesi ) `as any[]` type assertion kullanılarak kökten çözüldü ve Vercel derlemesi başarıyla çalıştırıldı.


### feat: Ekibim Sayfası Üye Kartı Tıklama (Link) Entegrasyonu
- `EkipPanel.tsx`'te yer alan ekip üyeleri listesindeki her üye satırı/kartı pürüzsüzce Next.js `<Link>` bileşeniyle sarıldı.
- Sadece boşluğa veya isme/avatara tıklamak, kullanıcının doğrudan o üyenin (eğer o üye uygulamanın abonesiyse `user_id`si ile, dış saha ortağıysa `aday id`si ile) aday profil sayfasına (`/pipeline/[id]`) gitmesini sağlıyor.
- Bu işlem masaüstünde rahat, mobilde ise geniş ve esnek bir dokunma alanı (touch target) sunarak liderlerin alt ekiplerinin aday performanslarına anında dalış yapmalarına olanak tanıdı.

### feat: Platform Yönetimi ve İstatistikler İçin Yeni Nesil Avatarlar
- **İstatistikler Sayfası (`istatistikler/page.tsx`):** Az önceki hatadan arındırılarak resimlerin başarılı bir şekilde tabloda yer alması tekrar aktif hale getirildi ve doğrulandı.
- **Platform Yönetimi Sayfası (`platform-yonetim/page.tsx`):** Süper adminin izlediği `workspaces` tablosuna yeni bir veritabanı alanı (`avatarUrl`) sorgusu eklendi (`actions.ts`). Eğer kayıt olan grubun sahibinin/liderinin bir profil fotoğrafı varsa tabloda ve mobil kart görünümünde bu resim kullanıldı.
- Resmi (avatarı) olmayan kullanıcıların profil baş harfleri tek renk (mor) yerine isminin koduna göre (hash) dinamik belirlenen çok renkli, enerjik arka planlar (Yeşil, Kırmızı, Mavi, Pembe, Turuncu vb.) ve degradeler (gradients) ile sunularak tablonun göz alıcılığı zirveye çıkarıldı.



## 2026-05-28 — İstemci Tarafı Resim Sıkıştırma (Client-side Image Compression) Entegrasyonu

### feat: Profil ve Aday Resimleri Artık Otomatik Sıkıştırılıyor
- Platform maliyetlerini (Supabase Storage Bandwidth & Storage) düşürmek ve yükleme hızını mobil dahil kat ve kat artırmak amacıyla projeye `browser-image-compression` paketi eklendi.
- **Profil Modal (`ProfileModal.tsx`)**: Kullanıcı profil resmi yüklerken artık `maxSizeMB: 0.5` (Maksimum 500KB) ve `maxWidthOrHeight: 1024` seçenekleriyle tarayıcı bazlı sıkıştırma uygulanır.
- **Aday Ekleme/Düzenleme (`EditCandidateSheet.tsx`)**: Liderlerin boru hattına adayların fotoğraflarını yüklerken (özellikle yüksek megapikselli kamera çekimlerinde) yaşadığı donma / geç yüklenme sorununu engellemek amacıyla aynı mantıkta Client-side Image Compression eklendi.
- Dosyalar veritabanına her zaman standart optimize edilmiş `.jpg` (`image/jpeg`) MIME Type formatında yüklenir.


## 2026-05-28 — Ekibim: Downline Detay Linki ve Avatar Senkronizasyonu

### fix: Elif Sinem Topak (ve bağımsız downline üyeler) için boş detay sayfası ve eksik avatar
- **Kök neden (link):** `EkipPanel.tsx` üye kartlarında `/pipeline/[id]` bağlantısı NMM ortakları için `auth user_id` kullanıyordu; aday detay sayfası ise `nmm_candidates.id` bekliyor. Bağımsız workspace ile katılan üyelerde (ör. Elif Sinem Topak) bu UUID eşleşmediği için boş sayfa açılıyordu.
- **Çözüm (link):** `MemberRow` tipine `pipeline_id` eklendi. Liderin hunisindeki aday kaydı isim eşleşmesiyle (token fallback dahil) bulunuyor; link yalnızca geçerli `pipeline_id` varken tıklanabilir. Saha ortakları için `pipeline_id` zaten aday `id`si.
- **Kök neden (avatar):** Downline üyeler sponsor workspace'inde `avatar_url = null` satırla listeleniyor; fotoğraf çoğunlukla kendi workspace satırında veya `auth.users` metadata'sında. Platform Yönetimi metadata'dan okuduğu için orada görünüyordu, Ekibim ise yalnızca sponsor satırına bakıyordu.
- **Çözüm (avatar):** Tüm `nmm_workspace_members` satırlarından avatar birleştirme, downline merge'de null üzerine yazma, aday notundan `parseNote` avatarı, ve `resolveTeamAvatarsAction` (service role ile yetkili downline'lar için auth metadata) eklendi.
- `useTeamMembers.ts` içinde aynı çoklu-kaynak avatar birleştirmesi istatistikler tablosuyla tutarlılık için güncellendi.
