# Council Triad — Kapsamlı Proje Analizi (2. Tur)

**Tarih:** 2026-05-31
**Proje:** Network Marketing Master (NMM)
**Yöntem:** Council of High Intelligence — Triad (3 bağımsız perspektif)
**Önceki tur:** [council-triad-2026-05-28.md](council-triad-2026-05-28.md) (K-1..K-4 ✅ çözüldü)

**Triad üyeleri:**
- **Torvalds** — Pragmatik kod kalitesi & shipping mühendisliği
- **Aristoteles** — Yapısal/mimari kategorizasyon & taksonomi
- **Ada** — Hesaplamasal doğruluk, veri-akışı & yarış koşulları

> **Not:** Bu bir _analiz_ raporudur. Hiçbir uygulama kodu değiştirilmemiştir. Her bulgu üç üyenin bağımsız taramasından üretilip rapor sahibi tarafından `dosya:satır` kanıtıyla doğrulanmıştır.

---

## 0. Yönetici Özeti

Önceki turdan bu yana proje **genus (mimari) düzeyinde belirgin olgunlaştı.** Geçen turun 5 kritik bulgusunun tamamı (Shopier secret, AI auth/kota, merkezi `checkAIQuota`, schema drift, EkipPanel god-component) kapanmış; **regresyon yok.** Doğrulanan kapanışlar:

| Geçen tur | Durum | Kanıt |
|---|---|---|
| K-1 Shopier fallback secret | ✅ | `shopier_test_secret_key` kodda yok; `verifyShopierSignature`/`parseShopierOrderId` domain'e taşındı |
| K-2 AI auth eksikliği | ✅ | `checkAIQuota.ts` + `checkQuota.test.ts` |
| K-3 Quota duplikasyonu | ✅ | Merkezi `src/lib/ai/checkQuota.ts` |
| K-4 schema drift (`as any` ×28) | ✅ | `grep "as any" src` → **0** |
| Y-7 z-index erozyonu | ✅ | `z-[` yalnızca `zIndex.ts`'te; ESLint `noRawZIndex` aktif |
| Y-11 error/loading boundary | ✅ | `(dashboard)/error.tsx` + `loading.tsx` |
| Y-12 localStorage premium ihlali | ✅ | `nmm_custom_*` tabloları + `lib/customContent.ts` |
| K-5 EkipPanel 1257-satır | ✅ | Parçalandı; top-25'te yok |

**Bu turun bulgusu:** Kalan borç artık **leaf seviyesinde ve geçişsel (transitional).** Üç üye bağımsız olarak **aynı bölgede** yakınsadı: **son 2 sprintte eklenen yeni cron/e-posta/bildirim alt-sistemi, projenin en az sertleştirilmiş (least-hardened) parçası.** Eski kod temizlenirken yeni kod birkaç eski örüntüyü (secret fallback, raw client, inline super-admin, eksik idempotency) geri getirdi.

### Üçlü Yakınsama Matrisi

| Tema | Torvalds | Aristoteles | Ada | Önem |
|---|:--:|:--:|:--:|:--:|
| Cron/e-posta secret & auth sertleştirmesi | T-1, T-4 | — | D-1 | 🔴 |
| Cron idempotency / çift gönderim | T-3 | — | D-2, D-3 | 🟠 |
| `\|\|\|` yarım göç (typed kolon ↔ legacy parse) | — | A-2 | — | 🟠 |
| i18n bimodal (`lang === 'en'` ×67) | T-8 | A-6 | — | 🟠 |
| Read-before-write yarış (ghost activity) | — | — | D-4 | 🟠 |
| God component (CandidateDetail/İstatistikler) | T-1 | A-5 | — | 🟡 |
| `createAdminClient` lokal tekrarı | T-11 | A-3 | — | 🟡 |
| Yeni takvim/cron modüllerinin doğru genus'a oturması | ✅ | ✅ A-9 | ✅ | 🟢 (pozitif) |

**Kritik tek cümle:** `CRON_SECRET` set edilmemiş/boş bırakılırsa üç cron endpoint'i `Authorization: Bearer ` başlığıyla herkese açılır — tek satırlık guard ile bugün kapatılmalı; gerisi sırasıyla.

---

## 1. 🔴 KRİTİK

### K-1. CRON_SECRET boş-string bypass — 3 cron endpoint'i savunmasız
**Konum:** [calendar-reminder/route.ts:9](../src/app/api/cron/calendar-reminder/route.ts#L9), [trial-emails/route.ts:15](../src/app/api/cron/trial-emails/route.ts#L15), [license-reminder/route.ts:7](../src/app/api/cron/license-reminder/route.ts#L7)

**Sorun:** Üç route da aynı kontrolü yapıyor:
```ts
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return 401
```
`CRON_SECRET` Vercel'de set edilmemiş veya yanlışlıkla boş string bırakılmışsa, `` `Bearer ${''}` === 'Bearer ' `` olur ve `Authorization: Bearer ` başlığı gönderen **herkes** doğrulamayı geçer. Sömürü senaryosu: saldırgan crontları loop'a alır → kullanıcılara spam e-posta/bildirim gider, Resend kotası ve proje sahibi hesabı yakılır.

**Öneri — DÜZENLE:** Her üç route'a boş-değer guard'ı:
```ts
const secret = process.env.CRON_SECRET
if (!secret || authHeader !== `Bearer ${secret}`) return 401
```
(İdeal olarak ortak bir `assertCronAuth(request)` helper'ı `lib/infra/`'da.)

---

## 2. 🟠 YÜKSEK

### Y-1. Resend `|| 're_test_key'` fallback + iki cron raw client kullanıyor
**Konum:** [mail.ts:12](../src/lib/infra/mail.ts#L12), [trialEmails.ts:13](../src/lib/infra/trialEmails.ts#L13); raw client: [license-reminder/route.ts](../src/app/api/cron/license-reminder/route.ts), [trial-emails/route.ts](../src/app/api/cron/trial-emails/route.ts)

**Sorun:** İki kısım. (1) `const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key')` — modül seviyesinde sahte key ile Resend singleton'ı kuruluyor. Bu, geçen tur silinen Shopier `|| 'shopier_test_secret_key'` örüntüsünün birebir kopyası. _Nüans:_ her fonksiyonun başında `if (!RESEND_API_KEY) return` guard'ı olduğundan **aktif sömürülebilir değil** — bu yüzden 🔴 değil 🟠. Ama yanıltıcı ve gereksiz bir footgun. (2) `calendar-reminder` doğru şekilde `createAdminClient` kullanırken, `license-reminder` ve `trial-emails` raw `createClient(@supabase/supabase-js)` kuruyor — `Database` tipini ve merkezi config'i atlıyor.

**Öneri — DÜZENLE:** `|| 're_test_key'` fallback'ini sil (guard zaten koruyor). İki cron route'u `createAdminClient`'e geçir; `cronTrialRecipients.ts` parametresini `AdminClient` tipine güncelle.

### Y-2. trial-emails & license-reminder cron'larında idempotency yok → çift e-posta
**Konum:** [cronTrialRecipients.ts](../src/lib/infra/cronTrialRecipients.ts), [license-reminder/route.ts](../src/app/api/cron/license-reminder/route.ts)

**Sorun:** `calendar-reminder` çift bildirimi önlemek için `nmm_notifications`'a `gte('created_at', dayStart)` guard sorgusu atıyor. Ama `trial-emails`/`license-reminder` cron'larında bu guard **hiç yok** ve gönderim kaydı tutan bir tablo yok. GitHub Actions `workflow_dispatch` (manuel re-run) veya "at-least-once" davranışında **aynı müşteriye aynı gün ikinci `trial_3d`/`license_reminder` e-postası** gider — premium algıyı zedeler.

**Öneri — EKLE:** `nmm_email_sent_log(workspace_id, kind, sent_date)` tablosu + `UNIQUE(workspace_id, kind, sent_date)`. Gönderimden önce kontrol et, varsa atla.

### Y-3. calendar-reminder: timezone asimetrisi + free/trial-ended lisans boşluğu
**Konum:** [calendar-reminder/route.ts:17-18, 30-44](../src/app/api/cron/calendar-reminder/route.ts#L30)

**Sorun:** İki sorun. (1) `todayCalendarKey()` sabit `Europe/Istanbul` kullanırken idempotency `dayStart`'ı `new Date().setHours(0,0,0,0)` ile **UTC gece yarısını** alıyor. Normal cron saatinde (06:00 UTC = 09:00 İstanbul) zararsız; ama `workflow_dispatch` ile 23:50 UTC'de tetiklenirse iki "bugün" farklı güne düşer → idempotency penceresi kayar, çift bildirim. (2) Lisans filtresi `if (license_type !== 'free') { if expired continue }` — yani süresi geçmiş **paid** workspace'i doğru atlıyor, ama trial'ı (`free`) bitmiş workspace'lere bildirim göndermeye devam ediyor.

**Öneri — DÜZENLE:** `dayStart`'ı da İstanbul TZ'inden türet (`${todayKey}T00:00:00+03:00`). Lisans filtresini trial-ended free workspace'leri de kapsayacak şekilde netleştir.

### Y-4. useUpdateCandidate: stale-cache read-before-write → hayalet aktivite logu
**Konum:** [useCandidates.ts:96-110](../src/hooks/useCandidates.ts#L96) _(geçen turun Y-6'sı — hâlâ açık)_

**Sorun:** Aktivite logu için mevcut aday önce TanStack cache'den, yoksa ayrı bir `select('*')` ile okunuyor; sonra `update` atılıyor — iki ayrı roundtrip, transaction değil. İki sekme aynı adayı eşzamanlı güncellerse: Sekme-1 cache'de `stage:'iletisim'` görür → Sekme-2 `'sunum'` yapar → Sekme-1 `update({stage:'davetli'})` atıp **"iletisim → davetli"** loglar (gerçek geçiş "sunum → davetli"). Pipeline geçmişi güvenilmez olur.

**Öneri — DÜZENLE:** `.update(patch).eq('id',id).select('*').single()` ile tek roundtrip; önceki değeri dönen veriden hesapla. Daha sağlamı: aktivite logunu DB trigger'ına veya atomic server action'a taşı.

### Y-5. QuickAddModal: yalancı "E-posta Gönderildi" UI + ölü kod
**Konum:** [QuickAddModal.tsx:63-86](../src/components/ui/QuickAddModal.tsx#L63)

**Sorun:** `localStorage.getItem('nmm_notif_email') === 'true'` olduğunda kullanıcıya **"📧 E-posta Gönderildi: ... adresine postalandı"** toast'ı gösteriliyor ve `console.log('[EMAIL DISPATCH] Sent to ...')` yazılıyor — **ama hiçbir e-posta gönderilmiyor.** Gerçek gönderim yok, `nmm_notif_email` flag'ını `'true'` yapan bir UI ayarı da yok. Bu, ölü koddan da kötü: kullanıcıya yapılmayan bir işi yapılmış gibi gösteren bir **güven/premium ihlali.**

**Öneri — ÇIKAR:** Bu bloğu (63-86) tamamen sil. Admin bildirimi gerçekten isteniyorsa server action + Resend ile yap, `console.log` ile değil.

### Y-6. `|||` delimiter — yarım göç (typed kolon yazılıyor, okuma legacy parse'a düşüyor)
**Konum:** [noteParser.ts:11-56](../src/lib/utils/noteParser.ts#L11) (`@deprecated formatNote/parseNote` canlı), [candidateFields.ts:42-80](../src/lib/domain/candidateFields.ts#L42), okuma: [CandidateCard.tsx:129](../src/app/(dashboard)/pipeline/_components/CandidateCard.tsx#L129), [CandidateDetail.tsx:507](../src/app/(dashboard)/pipeline/[id]/_components/CandidateDetail.tsx#L507)

**Sorun:** Migration 023 typed kolonları (`note_tr/note_en/avatar_url/warmth`) ekledi; yazma tarafı artık `buildCandidateContentFields` kullanıyor — ama aynı anda `note` kolonunu da `syncLegacyNoteColumn` ile yazıyor (dual-write) ve okuma tarafının bir kısmı hâlâ `|||` 4-segmentini parse ediyor. Veri iki yerde tutuluyor; `@deprecated` fonksiyonlar canlı. CLAUDE.md'nin `note` kolonu için öngördüğü tek kullanım `TR ||| EN` çevirisiydi; avatar+warmth aşırı yükü hâlâ duruyor.

**Öneri — DÜZENLE:** Okumaları typed kolona çevir; `note`'u yalnızca `TR ||| EN`'e indir; `formatNote`/`parseNote`'un 4-segment dalını sil. _(Backfill production'da tamamlandıysa güvenli — DB doğrulaması gerekli.)_

### Y-7. i18n bimodal — component'te `lang === 'en'` ×67 (en yaygın konvansiyon ihlali)
**Konum:** `.tsx`'te `lang === 'en'` ×**67** (grep doğrulandı). Yoğunlaşma: `LandingTestimonials` (×8), [CandidateDetail.tsx:46-146](../src/app/(dashboard)/pipeline/[id]/_components/CandidateDetail.tsx#L46) (×6+), `CandidateCard:150`, `PresentationMaterialsContent:182`.

**Sorun:** AGENTS.md "Avoid `lang === 'en' ? ...` in components" kuralının doğrudan ihlali; geçen turun Y-8'inden beri azalmamış. Hatta ölü ternary var: `PresentationMaterialsContent.tsx:182` → `lang === 'en' ? 'Ayşe' : 'Ayşe'` (iki dal aynı).

**Öneri — DÜZENLE:** Dashboard component'lerini `t(key, vars)`'a göç ettir. Landing'in `text.tr/text.en` _data_ yapısı meşru (içerik datası, çeviri değil) — ona dokunma; sadece ölü ternary'leri sadeleştir.

### Y-8. useNotifications ↔ NotificationsModal çevrimsel bağımlılık
**Konum:** [useNotifications.ts:7](../src/hooks/useNotifications.ts#L7)

**Sorun:** `import { playNotificationSound } from '@/components/ui/NotificationsModal'` — bir hook, kendisini kullanan bileşenden import ediyor. Çevrimsel bağımlılık bundler'da sessiz davranabilir ama bağımlılık grafiğini kırar, test edilemez yapar.

**Öneri — ÇIKAR/DÜZENLE:** `playNotificationSound`'u `lib/ui/notificationSound.ts`'ye taşı; her iki taraf da oradan import etsin.

---

## 3. 🟡 ORTA

| ID | Bulgu | Konum | Aksiyon |
|---|---|---|---|
| O-1 | `bulkDeferOverdueFollowUps` terminal aşamadaki (katildi/pasif…) adayı da erteleyebiliyor — manuel `next_follow_up_at` varsa overdue listesine giriyor | [calendarFollowUp.ts:13-18](../src/lib/domain/calendarFollowUp.ts#L13) | DÜZENLE: overdue listesini `CALENDAR_TERMINAL_STAGES` ile filtrele |
| O-2 | `bulkDefer` N+1: aday başına SELECT+UPDATE+INSERT (3N roundtrip) → Vercel 10s timeout riski | takvim/actions.ts | DÜZENLE: tek `update().in('id', ids)` + tek bulk insert |
| O-3 | `lib/` kökünde 3 flat dosya — AGENTS.md taksonomi ihlali | `lib/auth.ts`, `lib/constants.ts`, `lib/customContent.ts` | DÜZENLE: `lib/domain/`'e taşı |
| O-4 | `createAdminClient` iki dosyada lokal kopya (admin singleton var) | [istatistikler/actions.ts:9](../src/app/(dashboard)/istatistikler/actions.ts#L9), [platform-yonetim/actions.ts:11](../src/app/(dashboard)/platform-yonetim/actions.ts#L11) | DÜZENLE: `@/lib/supabase/admin`'den import |
| O-5 | `translate-note` API route'unun tek çağıranı iç `.tsx` + session zorunlu → server action olmalı | [api/translate-note/route.ts](../src/app/api/translate-note/route.ts), çağıran CandidateDetail:250/328/463 | DÜZENLE: `translateNoteAction`'a taşı, API yüzeyini kaldır |
| O-6 | takvim/actions inline `user.email === SUPER_ADMIN_EMAIL` — `lib/auth.isSuperAdmin` var | [takvim/actions.ts:202](../src/app/(dashboard)/takvim/actions.ts#L202) | DÜZENLE: `isSuperAdmin(user)` kullan |
| O-7 | God component: CandidateDetail (1010), IstatistiklerContent (1000), PlatformYonetimContent (754), YazarForm (648) — EkipPanel örüntüsü uygulanmadı | ilgili dosyalar | DÜZENLE: alt-bileşenlere böl; CandidateDetail'deki tek doğrudan supabase write'ı action'a çek |
| O-8 | `.tsx`'te `supabase/client` whitelist'i wildcard (`pipeline/**`) — yeni dosyalar sessizce muaf | [eslint.config.mjs:24](../eslint.config.mjs#L24) | DÜZENLE: whitelist'i tam dosya yoluna indir, migrate edileni sil |
| O-9 | calendar-reminder `select('*')` + workspace başına ayrı candidate sorgusu (N+1) | calendar-reminder/route.ts:38 | DÜZENLE: gerekli kolonlar + tek `in('workspace_id', ids)` batch |
| O-10 | Lint: 88 error / 54 warning; yeni takvim kodu `react-hooks/set-state-in-effect` (`TakvimClient:61`, `TakvimConfirmModal:30`) | takvim/_components | DÜZENLE: effect'leri ayır / guard ile çöz |
| O-11 | `mail.ts` her başarılı gönderimde `console.log('[Resend] ... sent', data)` — production log gürültüsü/metadata | mail.ts:60,140,208,249 | DÜZENLE: success log'larını kaldır, `console.error` kalsın |
| O-12 | `parent_id` OR sorgusunda ölü koşul: `parent_id.eq.${workspaceId}` — `parent_id` user UUID saklıyor, workspace değil; eşleşmez ama okuyanı yanıltır | [takvim/actions.ts:209](../src/app/(dashboard)/takvim/actions.ts#L209), [useTeamMembers.ts:69](../src/hooks/useTeamMembers.ts#L69) | DÜZENLE: ilk koşulu kaldır, `.eq('parent_id', user.id)` |

---

## 4. 🟢 DÜŞÜK

| ID | Bulgu | Aksiyon |
|---|---|---|
| L-1 | AI kota: server UTC gece yarısı eşik, `useAIUsage` client local saat — İstanbul 00:00-03:00 arası display/enforcement küçük tutarsızlığı (kullanıcı lehine) | DÜZENLE: hook'ta UTC gece yarısı |
| L-2 | Domain view-model tipleri (`ResolvedCandidateFields`, takvim row, `NotificationItem`) feature dosyalarına dağılmış | EKLE: `lib/domain/types/` veya kararı AGENTS.md'ye yaz |
| L-3 | `calendarDates.ts` / `calendarLocale.ts` test yok — DST/UTC sınır hataları sessiz | EKLE: DST/UTC offset testleri |
| L-4 | `docs/email-automation.md` n8n önerisiyle başlıyor ama cron+Resend implementasyonu tamam | DÜZENLE: `/api/cron/*` gerçeğini belgele |

---

## 5. Pozitif Doğrulama (örnek alınacak)

**A-9 (Ada + Aristoteles + Torvalds yakınsaması):** Yeni takvim/cron/bildirim modülleri **doğru genus'a oturmuş:** iş kuralı `lib/domain/calendarFollowUp.ts` (+ test), saf tarih helper'ı `lib/utils/calendarDates.ts`, cron'lar `api/` (meşru dış çağıran), bildirim tercihleri server action, `notificationRoutes.ts` ile route eşlemesi (geçen turun Y-4 hardcoded `/ekip` route'u çözülmüş). Bu modüller projenin taksonomi olgunluğunun kanıtı. Test paketi: **80 test / 17 dosya — yeşil.**

---

## 6. Faz Planı (öneri — onay bekliyor, kod değişmedi)

| Faz | Kapsam | Bulgular | Tahmini efor |
|---|---|---|---|
| **A — Güvenlik (bugün)** | Cron auth + secret hijyeni | K-1, Y-1 | Düşük (tek satır guard + fallback sil) |
| **B — Cron doğruluğu** | İdempotency + timezone + lisans filtresi | Y-2, Y-3, O-9 | Orta (1 migration + mantık) |
| **C — Veri bütünlüğü** | Race + yalancı UI | Y-4, Y-5, O-1, O-2, O-12 | Orta |
| **D — i18n & yapı** | bimodal göç + flat lib + admin client dedup | Y-7, O-3, O-4, O-6, O-8 | Orta-yüksek |
| **E — `\|\|\|` göçü** | Okuma typed kolona, legacy dal sil | Y-6 | Yüksek (backfill doğrulaması gerekli) |
| **F — God component & hijyen** | Bölme + lint + log + circular dep | Y-8, O-5, O-7, O-10, O-11 | Yüksek |
| **G — Düşük öncelik** | Test, type, doc | L-1..L-4 | Düşük |

**Sıralama gerekçesi:** A → potansiyel açık güvenlik; B/C → kullanıcıya dokunan doğruluk; D/E/F → uzun vadeli temizlik; G → opsiyonel. Her madde kullanıcıya önce/sonra bilgilendirmesiyle, ben veriye/koda dokunmadan onaylanarak ilerler.

---

## 7. Hüküm

Proje **mimari olarak sağlıklı, leaf seviyesinde geçişsel borçla aşınmış.** Geçen turun tüm kritikleri kapanmış; bu turun tek 🔴'sı (CRON_SECRET) tek satırla çözülür. Asıl mesaj: **yeni alt-sistem (cron/e-posta) eski örüntüleri geri getirdi** — secret fallback, raw client, inline super-admin, eksik idempotency. Bunlar temizlenince uygulama gerçekten "tertemiz ve tıkır tıkır" olur.

**Güven:** Yüksek — her iddia `dosya:satır` + grep ile rapor sahibi tarafından doğrulandı. Tek çekince: Y-6'daki "legacy dalı sil" önerisi `|||` backfill'inin production DB'de tamamlandığı varsayımına bağlı (DB erişimi olmadan doğrulanamadı).
