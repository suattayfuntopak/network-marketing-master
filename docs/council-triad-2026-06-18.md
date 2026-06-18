# Council Triad — Kapsamlı Proje Analizi (3. Tur)

**Tarih:** 2026-06-18
**Proje:** Network Marketing Master (NMM)
**Yöntem:** Council of High Intelligence — Triad (3 bağımsız perspektif + rapor sahibi doğrulaması)
**Önceki turlar:** [council-triad-2026-05-28.md](council-triad-2026-05-28.md) · [council-triad-2026-05-31.md](council-triad-2026-05-31.md)

**Bu turun triad üyeleri:**
- **Torvalds** — Pragmatik kod kalitesi, teknik borç & shipping mühendisliği
- **Feynman** — İlk-prensipler doğruluk, veri-akışı & gizli varsayımlar
- **Lao Tzu** — Sadeleştirme, ferahlık & "neyi çıkarmalı" (premium minimalizm)

> **Not:** Bu bir _analiz_ raporudur. **Hiçbir uygulama kodu değiştirilmemiştir.** Her bulgu üç üyenin bağımsız taramasından üretilip rapor sahibi tarafından `dosya:satır` kanıtıyla doğrulanmış, abartılı/yanlış bulgular elenmiştir.

---

## 0. Yönetici Özeti

Üç üyenin ortak hükmü aynı: **bu kod tabanı disiplinli.** 522 TS/TSX dosyası, ~61.9k satır, 58 test dosyası / 320 test temiz geçiyor, lint `--max-warnings 0` ile sıfır uyarı, `as any` sayısı 0, `console.log` 0, tr/en çeviri paritesi tam (474/474). Spaghetti değil; düşünülmüş bir iş. Önceki iki turun bulguları kapanmış, regresyon yok.

Ama "iyi mimari" ile "tıkır tıkır + tertemiz" arasındaki farkta **1 kritik, 6 yüksek, 9 orta, 9 düşük** bulgu ve bir avuç stratejik sadeleştirme fırsatı çıktı. En önemli iki nokta:

1. **`tsc --noEmit` kırık** — test dosyasında tanımsız tip; Vitest esbuild ile transpile ettiği için sessizce geçiyor. CI'da `tsc` koşmuyorsa tip hataları üretime sızabilir. **Tek kritik.**
2. **`monthRange()` zaman dilimi hatası** — aylık hub metrikleri sunucu UTC'sine göre üretiliyor; İstanbul gece 00:00–03:00 aktiviteleri yanlış aya düşüyor. Aynı dosyadaki `yearRange` ve diğer fonksiyonlar İstanbul helper'ı kullanırken `monthRange` ham `toISOString()` kullanıyor.

Geri kalan her şey ya teknik borç temizliği ya da "premium ferahlık" için sadeleştirme — hiçbiri yangın değil. Uygulama satılabilir durumda; bu rapor onu **tertemiz**e taşıma planıdır.

### Doğrulamada elenen / düzeltilen üye iddiaları (önemli)

| İddia | Üye | Gerçek | Karar |
|---|---|---|---|
| "Shopier webhook dosyası yok — KRİTİK" | Feynman | `src/app/api/payment/shopier/route.ts` (449 satır) + `route.test.ts` **mevcut**; Feynman yanlış path'e (`api/webhooks/shopier`) baktı | **GEÇERSİZ** — aksiyon yok |
| "`yearRange` de timezone'dan etkileniyor" | Feynman | `yearRange` (hubPeriodRange.ts:177-178) zaten `istanbulDayStartIso` kullanıyor | **GEÇERSİZ** — sadece `monthRange` etkileniyor |
| "Herhangi bir kullanıcı başkasının aday aktivitesini okuyabilir" | Feynman | `nmm_daily_actions` RLS `workspace_id IN (... where user_id = auth.uid())` ile **workspace-scoped**; çapraz-workspace sızıntı yok | **ABARTILI** → ORTA derinlemesine-savunma'ya indirildi (O-2) |

---

## 1. KRİTİK

### K-1 · `tsc --noEmit` başarısız — tanımsız tip, CI sessizce geçiyor
**Kaynak:** Torvalds · **Konum:** `src/lib/domain/yazarCandidateContext.test.ts:23` · **Durum:** ✅ doğrulandı (tsc çalıştırıldı)

```
src/lib/domain/yazarCandidateContext.test.ts(23,6): error TS2304: Cannot find name 'NmmCandidate'.
```

`as NmmCandidate` cast'i var ama `NmmCandidate` import edilmemiş. Vitest kendi esbuild transpiler'ıyla tip kontrolü yapmadığı için 320 test temiz geçerken `tsc` kırık. `build` script'i `next build` öncesi sadece `lint` koşuyor; `next build`'in tip kontrolü test dosyalarını kapsamıyor.

**Düzeltme (1 satır + 1 altyapı):**
- `import type { NmmCandidate } from '@/types/database.types'` ekle.
- `package.json`'a `"typecheck": "tsc --noEmit"` ekle ve CI'a koy. Bu, gelecekteki sessiz tip bug'larını kapatacak en yüksek kaldıraçlı tek hamle.

---

## 2. YÜKSEK

### Y-1 · `monthRange()` İstanbul değil sunucu-UTC saatine bağlı — aylık metrik kayması
**Kaynak:** Feynman · **Konum:** `src/lib/utils/hubPeriodRange.ts:112-113` · **Durum:** ✅ doğrulandı

```ts
// monthRange (offset)
sinceIso: startDate.toISOString(),   // ← ham; startDate yerel kurucuyla üretildi
untilIso: endDate.toISOString(),
```

`startDate = new Date(yıl, ay, 1)` yerel saat kurucusu, Vercel Node runtime'ı UTC olduğundan Haziran başı `2026-06-01T00:00:00Z` = **İstanbul 03:00** olur. İstanbul'da Haziran 1, 00:00–03:00 arası gerçekleşen aktiviteler aylık hub metriğinin **dışında** kalır. Aynı dosyadaki `weekRange`/`dayRange`/`yearRange` (satır 77-78, 92-93, 177-178) `istanbulDayStartIso`/`istanbulDayEndIso` kullanıyor — yalnızca `monthRange` kuraldışı. AGENTS.md "Zaman dilimi & gün anahtarları" bölümünün doğrudan ihlali.

**Etkilenen:** `getHubMonthlySelfAction` → "Saha Özetim" aylık huni/metrik.
**Düzeltme:** `monthRange`'i komşularıyla aynı kalıba çek:
```ts
sinceIso: istanbulDayStartIso(toCalendarKey(startDate)),
untilIso: istanbulDayEndIso(toCalendarKey(endDate)),
```

### Y-2 · `lib/domain/` bir `app/` UI util'ine bağımlı — ters bağımlılık
**Kaynak:** Torvalds · **Konum:** `src/lib/domain/yazarCandidateContext.ts:3` (+ `lib/domain/customContent.ts:11`, `lib/ui/notificationPrefsStorage.ts:1`) · **Durum:** ✅ doğrulandı

```ts
import { renderActivityText } from '@/app/(dashboard)/pipeline/[id]/_components/candidateDetailUtils'
```

`lib/` taksonomisi (AGENTS.md): `lib/domain` platform-agnostik iş kuralı olmalı; `app/` → `lib/`'e bağımlı olur, tersi değil. Saf `renderActivityText` bir UI component dosyasında yaşıyor ve `lib/` ona bağımlı. Kırılgan döngüsel-benzeri yapı; test edilebilirliği düşürür.

**Düzeltme:** `renderActivityText`'i `lib/utils/` (veya `lib/domain/`) altına taşı; `candidateDetailUtils.ts` re-export bıraksın. Tek hamlede üç dosyanın bağımlılık yönü düzelir. (Not: `notificationPrefsStorage.ts` yalnız `import type` — çalışma zamanı etkisi yok, düşük öncelik.)

### Y-3 · `assertWorkspaceMember` licenseType fallback — ölü invariant ×4 kopya
**Kaynak:** Torvalds · **Konum:** `src/app/(dashboard)/istatistikler/teamActivityActions.ts:122-133` (+ 330, 396, 436) · **Durum:** ✅ doğrulandı

```ts
const licenseType =
  'licenseType' in ctx && ctx.licenseType
    ? ctx.licenseType
    : (await supabase.from('nmm_workspaces').select('license_type')...)  // hiç tetiklenmiyor
```

`assertWorkspaceMember` zaten JOIN ile `license_type` döndürüyor; `'licenseType' in ctx` her zaman `true`, dolayısıyla fallback round-trip ölü kod. Ama bir gün dönüş tipi değişirse sessizce ekstra sorgu yapar. Aynı blok 4 yerde kopyalanmış (DRY ihlali).

**Düzeltme:** `assertWorkspaceMember` dönüş tipini `{ supabase, user, licenseType: string | null }` olarak sabitle; fallback bloklarını sil. ~40 satır kısalır, "ya fallback tetiklenirse" riski biter.

### Y-4 · `addCandidateNoteAction` — `noteEn` opsiyonel, çift-dil kuralı boş kalabilir
**Kaynak:** Feynman · **Konum:** `src/app/(dashboard)/actions/candidates.ts:334-358` · **Durum:** ⚠️ imza doğrulandı, çağıranlar doğrulanmalı

`noteEn?: string` opsiyonel; boş gelirse `note_en: null`. CLAUDE.md §2 "Kalıcı Çeviri ve Saklama Kuralı": dinamik içerik DB'ye `Türkçe ||| İngilizce` formatında kalıcı çift-dilli yazılmalı; İngilizce istemci lazy çeviri değil **DB'deki kalıcı çeviriyi** görmeli. `noteEn` boşsa İngilizce kullanıcı boş not görür — kural ihlali.

**Düzeltme:** `noteEn` zorunlu hale getir; çağıran her UI akışında AI çevirisi üretilip geçilsin. (Doğrulama gerekli: hangi bileşenler `noteEn` geçmeden çağırıyor — `grep "addCandidateNoteAction"`.)

### Y-5 · Shopier route `createAdminClient`'i bypass ediyor — tipsiz inline client
**Kaynak:** Torvalds · **Konum:** `src/app/api/payment/shopier/route.ts:34-38, 62-65` · **Durum:** ✅ doğrulandı (dosya mevcut, çalışıyor)

```ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
```

`src/lib/supabase/admin.ts` içinde `createAdminClient()` (Database generic'li, type-safe) varken Shopier route inline kopyasını iki kez yazıyor → sorgu çıktıları tipsiz; `admin.ts`'e eklenecek cross-cutting concern'lerden (logging vb.) yararlanamaz. İmza doğrulama mantığı sağlam (önceki turda düzeltildi), bu yalnızca client hijyeni.

**Düzeltme:** `createAdminClient()` kullan; ~8 satır + tip güvenliği kazanılır.

### Y-6 · `MemberDetailPage` koçluk şablonları çift kaynak (DB + localStorage)
**Kaynak:** Torvalds · **Konum:** `src/app/(dashboard)/ekip/[userId]/_components/MemberDetailPage.tsx:130-142` · **Durum:** ✅ doğrulandı

DB'de `coaching_templates` kolonu ve `saveMemberCoachingTemplatesAction` varken bileşen başlangıç state'ini `localStorage`'dan okuyup hem DB'ye hem localStorage'a yazıyor. "Double source of truth": farklı cihazdan giren kullanıcı önce eski localStorage değerini görür, sonra DB ile çakışır.

**Düzeltme:** `readTemplate` ve `localStorage.setItem` çağrılarını kaldır; state'i DB'den gelen `tmpl` ile başlat. (Bu, önceki turda `customContent` için yapılan localStorage→DB göçünün eksik kalmış bir parçası.)

---

## 3. ORTA

### O-1 · AI kota kontrolü "check-then-act" yarışı (sınırlı etki)
**Kaynak:** Feynman · **Konum:** `src/lib/ai/checkQuota.ts:105-138` + tüm AI action'lar · **Durum:** ✅ doğrulandı (sayaç atomik, kontrol değil)

`checkAIQuota` ayrı bir `SELECT count` yapıp limiti karşılaştırır; tüketim ise `nmm_increment_ai_usage_daily` RPC'siyle **atomik** (`ON CONFLICT DO UPDATE SET ai_count = ai_count + ...`). Sayaç bozulmaz ama kontrol ile artış arasında boşluk var: eşzamanlı iki sekme aynı `used < limit`'i geçip limiti `+N` aşabilir. Basic'te günlük 20 → hızlı çift-tık bunu aşar. Veri bozulması yok, sadece kota kaçağı.

**Düzeltme (opsiyonel):** RPC'yi limit-aware yap (artıştan önce `ai_count < p_limit` koşulu, aşılırsa `null`/hata dön) → tek atomik işlemde hem kontrol hem tüketim. Düşük frekanslı bir kötüye-kullanım olduğundan aciliyeti orta.

### O-2 · `nmm_daily_actions` okuma action'larında derinlemesine-savunma eksik
**Kaynak:** Torvalds + Feynman · **Konum:** `src/app/(dashboard)/actions/candidates.ts:287-313` · **Durum:** ✅ RLS doğrulandı — risk workspace-içi ile sınırlı

`fetchCandidateActivityHistoryAction`/`fetchCandidateNotesAction` `requireAuthUserId()` çağırıp sonucu **kullanmıyor**; sorgu yalnız `candidate_id` ile. RLS (`nmm_action_member_all`) `workspace_id IN (... where user_id = auth.uid())` ile **workspace-scoped** olduğundan çapraz-workspace sızıntı **yok**. Kalan risk: aynı workspace'teki bir üye, sahibi olmadığı bir adayın `candidate_id`'sini bilirse aktivitesini okuyabilir (adayların kendi RLS'i `owner_id = auth.uid()` ama daily_actions owner-scoped değil, workspace-scoped).

**Düzeltme:** `const userId = await requireAuthUserId()` sonucunu kullan, sorguya `.eq('user_id', userId)` ekle. RLS'i tek katman bırakmak yerine derinlemesine-savunma.

### O-3 · Çift skeleton — biri AGENTS.md'yi çiğniyor (`animate-pulse`)
**Kaynak:** Lao Tzu · **Konum:** `src/app/(dashboard)/saha-ozetim/page.tsx:17-48` + `saha-ozetim/loading.tsx` · **Durum:** ✅ doğrulandı

`loading.tsx` düzgün `<Skeleton>` sunarken `page.tsx` içinde ikinci bir `SahaOzetimSkeleton` var ve satır 19'da ad-hoc `animate-pulse` div kullanıyor — AGENTS.md "Loading states" kuralının açık ihlali (Skeleton tercih edilmeli).

**Düzeltme:** `page.tsx` içindeki `SahaOzetimSkeleton`'ı sil; `Suspense fallback`'i paylaşılan bir `<FieldSummarySkeleton>` ile birleştir.

### O-4 · `customContent` `is_approved` tutarsızlığı + sessiz hata yutma
**Kaynak:** Feynman + Torvalds · **Konum:** `src/lib/domain/customContent.ts:63-69`, `src/app/(dashboard)/actions/customContent.ts:98-115` · **Durum:** ✅ doğrulandı

Migration'dan gelen item'lar `isApproved: true` hardcode; yeni eklemeler ise DB default (`false`). `fetchCustomContentAction` `.or('is_approved.eq.true,user_id.eq.<userId>')` ile onaysız içeriği sahibine gösterir — kasıtlı mı belirsiz, yorum yok. Ayrıca `migrateLocalCustomContentAction` throw ederse hata yakalanmıyor → kullanıcı boş içerik listesiyle kalır.

**Düzeltme:** `try/catch` ile hata durumunda `dbItems` dön; moderasyon politikasını netleştir (ya `isApproved: false` + akış, ya açık yorumlu bypass).

### O-5 · `hubSelfActions.ts` 671 satır + `EMPTY_FUNNEL` çift tanım
**Kaynak:** Torvalds · **Konum:** `src/app/(dashboard)/crown/hubSelfActions.ts` (+ `:296` ve `istatistikler/actions.ts:24` EMPTY_FUNNEL) · **Durum:** ✅ doğrulandı

5 periyot action'ı (daily/weekly/monthly/yearly/all-time) aynı `Promise.all(getGoalFunnelContextAction, getAuthUser, resolveWorkspaceId)` şablonunu tekrarlıyor; sadece range hesabı farklı. `EMPTY_FUNNEL` iki dosyada ayrı tanımlı.

**Düzeltme:** `buildHubSelfPayload(period, offset)` genel fonksiyonu + periyot branch'i ~200 satır kazandırır. `EMPTY_FUNNEL`'i `lib/domain/funnelActuals.ts`'e taşıyıp her yerden import et.

### O-6 · Cron'larda `select('*')` aşırı-çekim
**Kaynak:** Torvalds · **Konum:** `src/app/api/cron/calendar-reminder/route.ts:44-45` (+ `actions/notifications.ts:27`) · **Durum:** ✅ doğrulandı

Cron sadece 5 alan kullanırken `nmm_candidates` için `select('*')` tüm sütunları çekiyor — gereksiz bant genişliği, her gece tüm aday tablosu için.

**Düzeltme:** `select('id, owner_id, workspace_id, full_name, next_follow_up_at')` gibi açık alan listesi.

### O-7 · İkili onay deseni — `ConfirmDialog` + `ConfirmDeleteModal`
**Kaynak:** Lao Tzu · **Konum:** `src/components/ui/ConfirmDialog.tsx` + `ConfirmDeleteModal.tsx` · **Durum:** ✅ doğrulandı (kullanım sayıları gözlendi)

İki onay bileşeni, iki görsel dil, iki bakım noktası. Premium his tutarlılıktan doğar; kullanıcı "sil" ile "onayla"yı neden farklı kutuda görsün?

**Düzeltme:** `ConfirmDeleteModal`'ı `ConfirmDialog`'un `variant="danger"` haline erit. Tek desen → tutarlı his, eksi bir dosya.

### O-8 · Üç yükseltme primitifi — `UpgradeGate` / `UpgradePrompt` / `useUpgradePrompt`
**Kaynak:** Lao Tzu · **Konum:** `src/components/ui/UpgradeGate.tsx` (2 kullanım) vs `UpgradePrompt` (13) + `useUpgradePrompt.tsx` · **Durum:** ✅ doğrulandı

`UpgradeGate` neredeyse hiç kullanılmıyor; `UpgradePrompt` + hook üstüne ne kattığı belirsiz.

**Düzeltme:** `UpgradeGate` kullanımlarını `UpgradePrompt`/hook'a indir; tek yükseltme yüzeyi bırak.

### O-9 · Merkezi `queryKeys`'i atlayan inline key literalleri
**Kaynak:** Torvalds + Feynman · **Konum:** `src/lib/query/prefetchRouteMetrics.ts:165` (crown pulse) + `src/hooks/useCandidates.ts:153, 298, 333` (`['activity', id]`) · **Durum:** ✅ doğrulandı

`queryKeys` factory'si merkezileştirilmiş ama bu satırlar ham string array kullanıyor. Key değişirse prefetch ↔ useQuery cache eşleşmesi sessizce bozulur.

**Düzeltme:** `queryKeys.crownTeamWeeklyPulse(workspaceId)`, `queryKeys.candidateActivity(id)` gibi factory girdileri ekle; literal'leri değiştir.

---

## 4. DÜŞÜK

| ID | Konum | Bulgu | Kaynak |
|---|---|---|---|
| D-1 | `src/lib/domain/navigation.ts:36-88` | 5 ölü `@deprecated` alias (`PANO_LAUNCHER_ITEMS`, `NAV_MODULE_ITEMS`, `NAV_MORE_ITEMS=[]`, `NAV_SECONDARY`, `NAV_EXPERT=[]`) — boş diziye dayanan ihracatlar "burada sistem var" yanılgısı verir. Çağıranları gerçek isme yönlendirip sil. ✅ | Lao Tzu |
| D-2 | `aylik-ozet/`, `haftalik-ozet/`, `bugunku-takibim/` `_components/` | 3 boş klasör (redirect kabukları). Hemen sil; redirect mantığını tek yerde topla, eski link trafiği yoksa redirect'leri de düşür. ✅ | Lao Tzu |
| D-3 | `src/components/ui/ThemeToggle.tsx` | Gövdesi tam olarak `return <ThemeCycleButton />` — tek satırlık dolaylama. Sil, `Header`'ı doğrudan `ThemeCycleButton`'a bağla. ✅ | Lao Tzu |
| D-4 | `src/app/(dashboard)/istatistikler/actions.ts:7-8` | Aynı modülden (`aiUsage`) çift import satırı. Birleştir. (Lint geçiyor — `no-duplicate-imports` kapalı.) ✅ | Torvalds |
| D-5 | `istatistikler/actions.ts:6` | `superAdminLicenseOverride` import edilmiş, kullanılmıyor. Sil. ✅ | Torvalds |
| D-6 | `crownMockSahaRadar`, `crownMockLiveTraining` çeviri anahtarları | `Mock` eki yanıltıcı — bunlar artık gerçek (super-admin verisi "mock" değil). `Mock`'u anahtarlardan çıkar. | Lao Tzu |
| D-7 | `src/app/(dashboard)/hedef/` | Yalnız `actions.ts`, sayfa yok — "rota" yanılsaması. `hedefim/` altına veya `_shared-actions`'a taşı. | Lao Tzu |
| D-8 | `src/lib/infra/cronAuth.ts:13-15` | `CRON_SECRET` tanımsızken 401 yerine 500 daha dürüst (Shopier route bunu doğru yapıyor — tutarsızlık). | Torvalds |
| D-9 | `LanguageProvider.tsx:103-118` + `getLang.ts` | SSR→client dil tespiti: cookie ile localStorage senkron değilse kısa "yanlış dil" penceresi. Düşük risk; `getLang()` server context'te her zaman 'tr' döner — docstring uyarıyor. | Feynman + Torvalds |

---

## 5. Sadeleştirme & Çıkarma Listesi (Lao Tzu — "az çoktur")

**Hemen, sıfır risk (yarım gün):**
- 3 boş `_components/` klasörü (D-2)
- 5 `@deprecated` nav alias (D-1)
- `ThemeToggle.tsx` tek-satır sarmalayıcı (D-3)
- `saha-ozetim/page.tsx` çift skeleton + `animate-pulse` (O-3)
- `superAdminLicenseOverride` ölü import (D-5), çift import (D-4)

**Doğrulamadan sonra erit:**
- `ConfirmDeleteModal` → `ConfirmDialog variant="danger"` (O-7)
- `UpgradeGate` → `UpgradePrompt`/hook (O-8)
- `EMPTY_FUNNEL` çift tanım → tek domain modülü (O-5)

**Ölç, sonra karar ver (kör kesme yok):**
- **Altı "metrik/özet" yüzeyi:** `/pano`, `/saha-ozetim`, `/saha-radar`, `/istatistikler`, `/hedefim`, + pano-içi sabah brifingi. Kullanıcı "ben nasıl gidiyorum?" için 6 kapıdan giriyor; "Saha Özetim" (takvim-ayı) ile "İstatistikler" (kayan-30-gün) ayrımını dökümana yazmak zorunda kalman bile sürtünmenin kanıtı (`pulsePeriodLabels.ts`). **Önce rota trafiğini ölç**, düşük-trafikli olanı (muhtemelen Saha Radarım) İstatistikler içinde sekmeye indir. Hedef: performans için **tek zihinsel kapı**. — En büyük ferahlama ama veriye dayanmalı; farklı kullanıcı tiplerine (yeni üye vs lider) hizmet ediyor olabilir.

**Uzun vade:**
- `trainingData.ts` 2075 satır hardcoded TR içerik → içerik değişimi kod deploy gerektiriyor; CMS/DB'ye taşıma. MVP için kabul edilebilir.

---

## 6. En Yüksek Kaldıraçlı 3 Hamle

1. **`tsc`'yi yeşile çek + CI'a ekle (K-1).** 1 satır fix + `typecheck` script'i. Yazılım ömrü boyunca sessiz tip bug'larını yakalar. 30 dk, en yüksek getiri.
2. **`monthRange` zaman dilimi düzeltmesi (Y-1).** Aylık hub metriğinin doğruluğu doğrudan ürün güvenilirliği. Komşu fonksiyonlarla aynı kalıba 2 satır. Düşük risk, yüksek doğruluk kazancı.
3. **Ölü iskeleti süpür (D-1/D-2/D-3 + O-3, O-5 dedup).** Yarım gün, sıfır risk, anında "ferah/tertemiz" his. `lib→app` bağımlılığını (Y-2) ve `assertWorkspaceMember` konsolidasyonunu (Y-3) da bu temizlik dalgasına ekle → mimari yön düzelir.

---

## 7. Önerilen Fazlama (kod değiştirilecek bir sonraki turda)

| Faz | Kapsam | Bulgular | Risk |
|---|---|---|---|
| **A — Doğruluk** | tsc + timezone + kota | K-1, Y-1, O-1 | Düşük |
| **B — Güvenlik/hijyen** | admin client + derinlemesine-savunma + cron | Y-5, O-2, O-6, D-8 | Düşük |
| **C — Mimari yön** | lib→app, dedup, EMPTY_FUNNEL, hub action konsolidasyonu | Y-2, Y-3, O-5, O-9 | Orta |
| **D — Çift-dil & veri** | noteEn zorunlu + customContent moderasyon + coaching localStorage | Y-4, Y-6, O-4 | Orta |
| **E — Sadeleştirme/ferahlık** | nav alias, boş klasör, ThemeToggle, çift skeleton, confirm/upgrade tekilleştir, isim temizliği | D-1..D-7, O-3, O-7, O-8 | Düşük |
| **F — Stratejik (ölç→karar)** | Altı metrik yüzeyi konsolidasyonu, trainingData CMS | §5 | Yüksek — önce ölç |

---

## 8. Üyelerin "nerede yanılıyor olabilirim" notları

- **Feynman:** Shopier path'ini bulamadı (yanlış varsayım → düzeltildi); RLS'i okumadan owner-check riskini abarttı (workspace-scoped olduğu doğrulandı → O-2'ye indirildi).
- **Torvalds:** Y-6 (daily_actions filtresi) RLS yeterince sıkıysa güvenlik değil sadece açıklık meselesi olabilir — doğrulandı, derinlemesine-savunma olarak kaldı.
- **Lao Tzu:** Müdahalesizlik eğilimi, çeşitliliğin kasıtlı olabileceğini (farklı kullanıcı tipleri) gözden kaçırabilir; altı-yüzey birleştirmesini "önce ölç" şartına bağladı. Redirect kabukları SEO/yer imi için gerekliyse "boş kabuk" aslında köprüdür.

---

**Sonuç:** Proje sağlıklı ve premium eşiğinde. 1 kritik (tsc) + 1 doğruluk (timezone) bulgusu önce kapanmalı; gerisi teknik borç temizliği ve ferahlık için sadeleştirme. Bu fazlama tamamlandığında uygulama "tertemiz kod, tıkır tıkır çalışan, ferah ve premium" hedefine ulaşır.

---

## 9. Uygulama Turu (2026-06-18 — kod değiştirildi)

Yukarıdaki analizin ardından kullanıcı onayıyla A→F fazları cerrah titizliğiyle uygulandı. **Doğrulama:** `next build` ✓ · `eslint --max-warnings 0` ✓ · `tsc --noEmit` ✓ · 320/320 test ✓ · i18n paritesi (1277 anahtar) ✓. Net **−190 satır** (36 dosya).

### Uygulananlar
| ID | Faz | Ne yapıldı |
|---|---|---|
| K-1 | A | `yazarCandidateContext.test.ts` tip importu eklendi; `typecheck` script'i + CI gate'e (`unit-test.yml` lint job) `tsc --noEmit` adımı |
| Y-1 | A | `monthRange` ham `toISOString()` → `istanbulDayStartIso/EndIso` (komşu fonksiyonlarla aynı kalıp) |
| Y-5 | B | Shopier route 3× inline `createClient` → typed `createAdminClient`; **typed client gizli tip hatası yakaladı** → `newLicenseType: PlanId` daraltıldı, gereksiz cast silindi |
| O-6 | B | `calendar-reminder` cron + `notifications` action: `select('*')` → açık alan listesi |
| D-8 | B | `cronAuth`: secret yokken 500 (yapılandırma) vs yetkisiz 401 ayrıldı |
| Y-2 | C | `renderActivityText` UI util'inden `lib/domain/activityText.ts`'e taşındı; `candidateDetailUtils` re-export; `lib/domain`→`app` runtime ihlali kalktı |
| Y-3 | C | `assertWorkspaceMember` ölü `licenseType` fallback ×4 → tek destructure (−~40 satır) |
| O-5 | C | `EMPTY_FUNNEL` 7 yerel tanım → `roadmap.ts` kanonik tek kaynak |
| O-9 | C | Aday `activity`/`candidate-notes`/`-count` keyleri `queryKeys` factory'sine (3 dosyada drift kapandı) |
| Y-4 | D | `addCandidateNoteAction` `noteEn` boşsa **server-side** çeviri üretir → CLAUDE.md §2 çift-dil garantisi (lazy/on-the-fly yerine yazım anında) |
| Y-6 | D | Coaching templates global `localStorage` kaldırıldı, DB tek kaynak; **gizli bug:** üye-bazlı olmayan key yüzünden şablonsuz üye, son görüntülenen üyenin şablonunu görüyordu — düzeldi |
| O-4 | D | customContent göçü `is_approved: true` → `false` (**moderasyon-atlama sızıntısı** kapandı); göç hatası artık `dbItems` döndürür (sessiz boşaltma yok) |
| D-1 | E | navigation.ts 5 ölü `@deprecated` alias silindi (tüketicisiz) |
| D-2 | E | 3 boş `_components/` klasörü silindi (redirect kabukları köprü olarak korundu) |
| D-3 | E | `ThemeToggle` tek-satır sarmalayıcı silindi; `Header` doğrudan `ThemeCycleButton` |
| D-4 | E | istatistikler/actions çift `aiUsage` importu birleştirildi |
| D-6 | E | `crownMock*` çeviri anahtarları → `crown*` (yanıltıcı "Mock" kaldırıldı) |
| O-3 | E | saha-ozetim çift skeleton → paylaşılan `FieldSummarySkeleton`; ad-hoc `animate-pulse` (AGENTS.md ihlali) kalktı |

### Bilinçli ertelenenler (gerekçeli — cerrah titizliği)
| ID | Neden ertelendi |
|---|---|
| **O-1** (AI kota yarışı) | Gerçek atomik fix, AI çağrısından önce slot rezerve eden yeni DB fonksiyonu + 7+ çağrı yerinde "rezerve/geri-al" semantiği gerektirir. **Canlı prod DB'sine** kör deploy edilemez (lockout riski; ödeyen/super-admin asla kilitlenmemeli). Sayaç zaten atomik, etki sınırlı (eşzamanlı sekmede limit+N, veri bozulması yok) → ayrı, DB-test edilmiş tura bırakıldı. |
| **O-5 hub konsolidasyon** | `hubSelfActions` 671-satır 5-periyot birleştirmesi çalışan kodun salt-kozmetik yeniden yazımı; regresyon riski > fayda. `EMPTY_FUNNEL` dedup yapıldı. |
| **O-7** (confirm tekilleştir) | İki danger görseli **kasıtlı farklı** (ConfirmDeleteModal bordo+Trash2 vs ConfirmDialog kırmızı+AlertTriangle). Birleştirmek 5 silme akışının görünümünü değiştirir → bir **tasarım kararı**, sessiz dayatılmamalı. |
| **O-8** (upgrade tekilleştir) | **Bulgu mimariyi yanlış okumuş:** `UpgradeGate` ince sarmalayıcı değil, 273-satır 3-varyantlı **çekirdek** yükseltme bileşeni (Shopier checkout + plan grid); `UpgradePrompt` bunun üzerine kurulu. Gereksiz değil. |
| **D-5** (kullanılmayan import) | **Geçersiz:** `superAdminLicenseOverride` `istatistikler/actions.ts:245`'te kullanılıyor. |
| **D-7** (hedef/ klasörü) | `page.tsx` olmadığı için aslında rota değil; co-located actions klasörü geçerli Next deseni — 8-dosya import churn'üne değmez. |
| **O-2** (daily_actions filtresi) | RLS workspace+downline scope'u kasıtlı; `.eq('user_id')` lider notlarını/downline görünümünü kırardı. Niyet yorumla belgelendi. |
| **Faz F** (6 metrik yüzeyi, trainingData CMS) | Rota-trafiği verisi + sahip kararı gerektiren ürün/mimari kararlar; "ölç→karar" — kör kesme yok. |

**Doğrulamanın elediği üye yanılgıları (uygulama turunda da):** O-8 (UpgradeGate çekirdek bileşen), D-5 (import kullanımda), O-2 (RLS doğru sınır) — konseyin önerileri olduğu gibi uygulansa regresyon yaratırdı; her biri `dosya:satır` ile doğrulanıp düzeltildi.

---

## 10. Ertelenen Tur: O-1 + Faz F (2026-06-18)

Kullanıcı onayıyla, ilk turda bilinçli ertelenen iki kalem cerrah titizliğiyle ele alındı. **Doğrulama:** `next build` ✓ · lint ✓ · `tsc --noEmit` ✓ · **324/324 test** (4 yeni) ✓ · `migrate:check` ✓.

### O-1 — AI kota check-then-act yarışı (atomik rezervasyon, fail-open)
**Tasarım:** Yeni DB fonksiyonu `nmm_insert_ai_action_if_under_limit` (migration **104**), per-kullanıcı `pg_advisory_xact_lock` ile `count + insert`'i tek seri bölgede yapar → eşzamanlı sekme/çift-tık günlük sayımı limiti aşamaz. `logAIGeneration` limit verildiğinde bu RPC'yi çağırır; **fail-open**: RPC yoksa (migration uygulanmadan deploy) veya hata verirse düz insert'e düşer — kota **asla** ödeyen kullanıcıyı/super-admin'i kilitlemez. Limit doluysa (RPC `false`) o eşzamanlı istek sayılmaz (analitik sayaç da artmaz).
- **Neden reserve-before-AI değil:** checkAIQuota sonrası erken-return'ler (ownership/validation) rezervasyon sızdırırdı; insert AI başarısından sonra olduğu için sızıntı yok. Kimlik koruması: fonksiyon `p_user_id <> auth.uid()` ise `false` döner.
- **Dosyalar:** `supabase/migrations/104_*.sql`, `database.types.ts` (Functions), `lib/ai/checkQuota.ts` (logAIGeneration + `dailyLimit` param), 11 AI action çağrısına `dailyLimit: quota.isSuperAdmin ? null : quota.limit`.
- **Test:** `checkQuota.test.ts` +4 — atomik başarı (rezerve→sayaç), limit-dolu (sayaç yok), RPC-hatası (fail-open düz insert), limitsiz süper admin (düz insert).
- **Deploy notu:** migration normal `db push` akışıyla uygulanır; kod fail-open olduğundan deploy sırası önemsiz.

### Faz F — 6 metrik yüzeyi trafik ölçümü (additif enstrümantasyon)
**Tasarım:** Mevcut ürün-event altyapısına (`PRODUCT_EVENTS` + `logProductEventAction`) `surface_view` olayı eklendi. `useSurfaceViewBeacon(pathname, enabled)` hook'u, izlenen yüzeylere (`/pano`, `/saha-ozetim`, `/saha-radar`, `/istatistikler`, `/hedefim`) her girişte olayı gönderir; `DashboardShell`'e **tek satır** bağlandı (sayfa-başı churn yok). `lastFired` ref'i ara rotadan dönüşü yeni görüntüleme sayar, salt re-render'ı saymaz.
- **Neden kesme yok:** Bu, "tek performans kapısı" konsolidasyonunun **ön-koşulu** olan veriyi biriktirir. Birkaç hafta sonra göreli trafik görülünce (örn. saha-radar düşük → İstatistikler'e sekme) konsolidasyon **veriyle** kararlaştırılır. `morningBriefView` zaten ayrı izleniyor.
- **Dosyalar:** `lib/domain/productEvents.ts` (`surfaceView`), `hooks/useSurfaceViewBeacon.ts` (yeni), `DashboardShell.tsx` (+1 satır).
- **Sonraki adım (kod değil, karar):** ~2-4 hafta veri sonrası `surface_view` dağılımına bakıp konsolidasyon turu planla.
