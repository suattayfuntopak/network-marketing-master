# Council Triad — Kapsamlı Proje Analizi

**Tarih:** 2026-05-28
**Proje:** Network Marketing Master (NMM)
**Yöntem:** Council of High Intelligence — Triad (3 perspektif)
**Triad üyeleri:**
- **Torvalds** — Pragmatik kod kalitesi & shipping mühendisliği
- **Aristoteles** — Yapısal/mimari kategorizasyon
- **Sokrates** — Varsayım yıkıcı & temel sorgulama

---

## 0. Yönetici Özeti

Proje **mimari olarak sağlıklı, leaf seviyesinde aşınmış** durumda. Önceki council turları (19 madde) ve dün tamamlanan 14 maddelik refactor sayesinde kritik altyapı temizlenmiş. Ancak üç bağımsız analiz, **aynı 4-5 örüntüde** birleşti — bu yakınsama, gerçek sorunların nerede yattığının en güçlü işareti.

### Üçlü Yakınsama (bağımsız iki+ council üyesi tespit etti)

| Bulgu | Torvalds | Aristoteles | Sokrates | Ortak Önem |
|---|---|---|---|---|
| Shopier güvenliği (secret fallback + amount mapping) | ✅ #13 | — | ✅ #5 | 🔴 KRİTİK |
| Migration 004 numara çakışması | — | ✅ #5 | ✅ #4 | 🟠 YÜKSEK |
| Quota check 5 yerde duplicate / tri-modal data access | ✅ #2 | ✅ #3 | — | 🔴 KRİTİK |
| God components (1257-satırlık EkipPanel) ve doğrudan Supabase çağrıları | ✅ #16 | ✅ #2 | — | 🔴 KRİTİK |
| Auth check eksikliği (generateQuickMessage, generateNotesSummary) | ✅ #3, #17 | — | — | 🔴 KRİTİK |
| Schema drift (`as any` × 28) | ✅ #1 | ✅ #6 | — | 🔴 KRİTİK |
| z-index disiplini erozyonu | — | ✅ #8 | — | 🟠 YÜKSEK |
| i18n bimodal: `useTranslation` vs raw `lang === 'en' ?` | ✅ #14 | ✅ #9, #10 | — | 🟠 YÜKSEK |
| `\|\|\|` delimiter aşırı yüklenmesi (avatar + warmth + EN) | — | ✅ #10 | — | 🟠 YÜKSEK |
| SUPER_ADMIN_EMAIL 83 yerde tekrar / dualism leak | — | ✅ #11 | ✅ #7 | 🟠 YÜKSEK |
| Test yok | ✅ #18 | — | ✅ #8 | 🟡 ORTA (stratejik) |
| Error boundary yok | — | — | ✅ #9 | 🟠 YÜKSEK |
| `bugun/page.tsx` redirect kabuğu + boş `_components/` | — | ✅ #1 | ✅ #1 | 🟡 ORTA |

**Kritik 1 cümle:** Shopier webhook'taki hardcoded fallback secret bugün düzeltilmeli; gerisi sırasıyla.

---

## 1. 🔴 KRİTİK BULGULAR

### K-1. Shopier webhook fallback secret + amount-based license mapping

**Konum:** [src/app/api/payment/shopier/route.ts:24](src/app/api/payment/shopier/route.ts#L24), satır 71-115

**Sorun:** İki ayrı zayıflık aynı dosyada:
- `const apiSecret = process.env.SHOPIER_API_SECRET || 'shopier_test_secret_key'` — env değişken set edilmemişse hardcoded string kullanılıyor. `scratch/simulate_shopier_webhook.js` aynı stringi biliyor — internetten sahte webhook gönderen biri lisans atayabilir.
- Lisans tipi `total_amount` değerine göre if-else zinciriyle belirleniyor. Para birimi/fiyat değişirse veya küsuratlı USD-TRY kuru gelirse yanlış lisans verilir.

**Öneri:**
1. Fallback'i sil; env yoksa `throw new Error('SHOPIER_API_SECRET required')`.
2. `platform_order_id` formatı `<workspaceId>_<licenseType>_<period>_<ts>` olsun; amount tahmin değil, açıkça kodlanmış veriden okunsun.

---

### K-2. AI server action'larında auth/kota kontrolü tamamen eksik

**Konum:**
- [src/app/(dashboard)/bugun/ilgilen/actions.ts:1-26](src/app/(dashboard)/bugun/ilgilen/actions.ts) — `generateQuickMessageAction`
- [src/app/(dashboard)/pipeline/[id]/actions.ts:214-258](src/app/(dashboard)/pipeline/[id]/actions.ts#L214) — `generateNotesSummary`

**Sorun:** Diğer tüm AI action'larında `supabase.auth.getUser()` + kota check var. Bu ikisinde sadece `GEMINI_API_KEY` varlık kontrolü var. Session olmadan çağrılabilirler — bir bot bu endpoint'leri loop'a alırsa Gemini API'yi proje sahibi hesabına ücretsiz yakar.

**Öneri:** Mevcut auth+kota pattern'ini bu iki action'a kopyala. Daha iyisi: K-3'teki merkezi `checkAIQuota` fonksiyonu kurulduktan sonra hepsi onu çağırsın.

---

### K-3. Quota check 5 ayrı dosyada kopyala-yapıştır (tek doğru kaynak yok)

**Konum:**
- [yazar/actions.ts:41-80](src/app/(dashboard)/yazar/actions.ts#L41)
- [uyum/actions.ts:44-81](src/app/(dashboard)/uyum/actions.ts#L44)
- [ekip/actions.ts:61-99](src/app/(dashboard)/ekip/actions.ts#L61)
- [pipeline/[id]/actions.ts:60-82](src/app/(dashboard)/pipeline/[id]/actions.ts#L60)
- `ekip/actions.ts → generateOnboardingGuidanceAction`

**Sorun:** "getUser → membership → workspace → license expiry → count today's `ai_generate` → compare limit" bloğu beş yerde **kelimesi kelimesine** tekrar ediyor. Yazar'da `getUser` 4 kez aynı request'te çağrılıyor. Limit mantığını değiştirmen gerekirse 5 yeri sync etmek zorundasın.

**Öneri:** `src/lib/ai/checkQuota.ts` oluştur: `checkAIQuota(actionType: 'message' | 'roleplay' | 'compliance') → { allowed, remaining, user, workspaceId, licenseType, isSuperAdmin }`. Bütün action'lar tek bu fonksiyonu çağırsın. Bu, K-2'yi de otomatik çözer.

---

### K-4. Schema drift — `database.types.ts`'te 3 tablo eksik, 28 `as any` kullanımı

**Konum:**
- Eksik: `nmm_notifications`, `nmm_onboarding_progress`, `nmm_workspace_members.avatar_url`
- Cast siteleri: [useNotifications.ts:29,118,131,144](src/hooks/useNotifications.ts), [useTeamMembers.ts:44,78,102](src/hooks/useTeamMembers.ts), [EkipPanel.tsx:80,125,154](src/app/(dashboard)/ekip/_components/EkipPanel.tsx)

**Sorun:** Bu üç tabloya yapılan tüm sorgular `as any` ile cast ediliyor. Kolon adı yanlış yazılırsa, tablo drop edilirse, schema değişirse — runtime'da öğrenirsin. TypeScript bu noktalarda seni hiç korumuyor.

**Öneri:**
```bash
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```
Bu tek komut 28 `as any`'yi siler. Migration sonrası otomatik çalışacak bir pre-commit hook'a bağla.

---

### K-5. God components + tri-modal veri erişimi (mimari kategori hatası)

**Konum (god components):**
- [EkipPanel.tsx](src/app/(dashboard)/ekip/_components/EkipPanel.tsx) — **1257 satır**, içinde 9 yer doğrudan `supabase.rpc(...)` çağırıyor
- [itirazlar/page.tsx](src/app/(dashboard)/itirazlar/page.tsx) — 1022
- [istatistikler/page.tsx](src/app/(dashboard)/istatistikler/page.tsx) — 799
- [egitim/page.tsx](src/app/(dashboard)/egitim/page.tsx) — 756
- [YazarForm.tsx](src/app/(dashboard)/yazar/_components/YazarForm.tsx) — 627
- [platform-yonetim/page.tsx](src/app/(dashboard)/platform-yonetim/page.tsx) — 639

**Sorun (Aristoteles):** Üç ayrı veri erişim modu, aralarında **yazılı kural yok**:
1. Server Actions (`actions.ts` × 8)
2. TanStack Query hooks (`useCandidates`, `useTeamMembers`, …)
3. Doğrudan `createClient()` browser çağrıları **TSX içinde** (`EkipPanel`, `AddCandidateSheet`, `EditCandidateSheet`, `CandidateDetail`)

Aynı domain (Candidate) üç farklı yoldan erişiliyor; kararın author'un keyfine kaldığı bir durum.

**Öneri:**
1. **Kural yaz:** mutations → server actions; reads → TanStack hooks; storage → `lib/storage.ts`.
2. ESLint kuralı: `.tsx` dosyalarında `from '@/lib/supabase/client'` import yasak (snapshot regresyonu için).
3. `EkipPanel` öncelikli olarak parçalansın: `useTeamActions.ts` hook'u (efficient cause), `lib/team.ts` (formal cause), TSX sadece sunum.

---

## 2. 🟠 YÜKSEK ÖNEMLİ BULGULAR

### Y-1. Migration `004` numarası iki kez kullanılmış

**Konum:** [supabase/migrations/004_member_self_update.sql](supabase/migrations/004_member_self_update.sql), [004_note_length_constraint.sql](supabase/migrations/004_note_length_constraint.sql)

**Sorun:** Numaralama total ordering invariantı. Yeni geliştirici `004_` ekleyecekse hangisini kırar? Supabase CLI alfabetik uygular ama bu **örtük** bir sözleşme.

**Öneri:** Birini `004a_` / `004b_` olarak yeniden adlandır (history korunur). `supabase/migrations/README.md` ile "bir numara = bir migration" kuralını belgele.

---

### Y-2. `useTeamMembers` — 5 ardışık Supabase çağrısı (waterfall)

**Konum:** [useTeamMembers.ts:30-105](src/hooks/useTeamMembers.ts#L30)

**Sorun:** workspace → members → downline workspaces → downline members → 4 parallel hooks. Downline'sız lider için bile 3 serial call. İstatistikler sayfası açılışında `useCandidates` + `useTeamMembers` birlikte = 6+ paralel Supabase isteği.

**Öneri:** Supabase RPC veya DB view yaz: `fetch_team_with_downlines(workspace_id)` → tek roundtrip. En azından members + downline_check sorgusunu join'le.

---

### Y-3. `useWorkspace.queryFn` içinde INSERT (yan etki)

**Konum:** [useWorkspace.ts:69-101](src/hooks/useWorkspace.ts#L69)

**Sorun:** TanStack Query kontratı: `queryFn` idempotent, yan etkisiz. React Strict Mode dev'de fonksiyonu iki kez çalıştırır. Workspace INSERT'i query fn içinde yapmak duplicate workspace oluşturma riskini her zaman canlı tutar.

**Öneri:** Workspace oluşturmayı ayrı `useMutation`'a veya server action'a çek. `queryFn` sadece okur; yoksa `null` döner ve caller initialize eder.

---

### Y-4. `useNotifications` realtime — `router` dependency eksik + hardcoded route

**Konum:** [useNotifications.ts:56-109](src/hooks/useNotifications.ts#L56)

**Sorun:** `useEffect` dep'i `[queryClient, supabase, lang]` — `router` yok ama closure'da yakalanıyor. Ayrıca tüm bildirim tipleri toast action'ı `/ekip`'e hardcode ediyor — bildirim tipine göre yönlendirme yok.

**Öneri:** `router`'ı dep'e ekle. `NotificationItem.type → route` mapping'i ekle (downline_joined → /ekip, license_expiring → /odeme, vs.).

---

### Y-5. Platform admin tüm candidates'ı memory'e alıyor

**Konum:** [platform-yonetim/actions.ts:69-77](src/app/(dashboard)/platform-yonetim/actions.ts#L69)

**Sorun:** `getPlatformWorkspacesAction` sadece count için tüm `nmm_candidates` satırlarını çekiyor (`.select('workspace_id')`). 10K+ aday seviyesinde server memory'i şişer.

**Öneri:** Supabase RPC ile `SELECT workspace_id, COUNT(*) FROM nmm_candidates GROUP BY workspace_id`.

---

### Y-6. `useUpdateCandidate` — read-before-write race condition

**Konum:** [useCandidates.ts:93-103](src/hooks/useCandidates.ts#L93)

**Sorun:** Candidate fetch → update; iki ayrı roundtrip, transaction yok. İki tab aynı anda update ederse stage change log'u yanlış `currentCandidate` üzerinden üretilir, ghost activity'ler oluşur.

**Öneri:** `.update(patch).eq('id', id).select('*').single()` — Supabase `returning` desteğiyle tek roundtrip. Activity logging'i server action'a taşı.

---

### Y-7. z-index disiplini erozyona uğramış — `Z` sabiti pratikte ölü

**Konum:** [src/lib/zIndex.ts](src/lib/zIndex.ts) vs raw `z-[NN]` × 11+

**Sorun:** Z tablosu max `z-[90]`. Gerçek kullanım: `z-[99]` (EkipPanel), `z-[60]/[65]/[80]` (CandidateCard), `z-[9999]` (itirazlar/egitim/odeme). Hiçbir dosya `Z`'yi import etmiyor (verify: `grep "from '@/lib/zIndex'"`).

**Öneri:** İki yol — (a) ESLint kuralı: `z-\[\d+\]` yasak, sadece `Z.*` kullanımı. (b) `zIndex.ts`'i sil, "her sayfa kendi katmanını yönetir" prensibini benimse. Yarı varlık en kötü durum.

---

### Y-8. i18n bimodal: `useTranslation` vs raw `lang === 'en' ?`

**Konum:** ~40 dosya `useTranslation`, ~40 dosya raw ternary

**Sorun:** İki strateji bir arada. `t()` interpolasyonu destekliyor (`{var}`) — pek çok inline ternary aslında t-key ile yapılabilirdi. `useCandidates` toast'larında `getLang()` kullanılırken `useNotifications` `useTranslation` kullanıyor.

**Öneri:** Audit + migration:
1. Tüm `lang === 'en' ? a : b` site'larını `t(key, vars)`'a çek.
2. `translations/{tr,en}.ts` dictionaryleri zenginleştir.
3. `getLang()` sadece module-level (mutation callback'lerinin dışı) kullanılsın.

---

### Y-9. `|||` delimiter aşırı yüklenmesi (i18n + media + classification)

**Konum:** [noteParser.ts](src/lib/noteParser.ts), `istatistikler/page.tsx:76`, `AddCandidateSheet`, `EditCandidateSheet`

**Sorun:** CLAUDE.md sadece `Türkçe ||| English` çevirisi için `|||` öngörüyor. Pratik: 4-segment `tr ||| en ||| avatarUrl ||| warmth` — pozisyonel sözleşme, untyped string. `istatistikler/page.tsx` position [2]'yi avatar olarak parse ediyor — başka biri 5. segment eklese sessiz kırılır.

**Öneri:** Tip güvenli kolonlara migrate et:
- `avatar_url` kolonu (zaten `015_member_avatar_url.sql`'de var)
- `warmth` kolonu (enum)
- `note_tr`, `note_en` ayrı kolonlar
- `|||` sadece çeviri için — başka hiçbir şey değil

---

### Y-10. `SUPER_ADMIN_EMAIL` 83 yerde tekrar; dualism leak'i hâlâ var

**Konum:** Tüm projede `user.email === SUPER_ADMIN_EMAIL` × 83

**Sorun:** Dual role (CLAUDE.md §4) prensibinin tek doğru kaynağı yok. Spesifik leak:
- [yazar/actions.ts:61](src/app/(dashboard)/yazar/actions.ts#L61): `getLimitsForLicense(isSuperAdmin ? 'pro' : licenseType)` — eski pattern. Oysa `aiUsage.ts` zaten `isSuperAdmin` parametresi alıyor. **İki ayrı bypass mekanizması bir arada.**

**Öneri:**
1. `src/lib/auth.ts` oluştur: `isSuperAdmin(user)`, `assertSuperAdmin(user)`, `bypassLimit(user)`.
2. `yazar/actions.ts:61` → `getLimitsForLicense(licenseType, isSuperAdmin)` normalize et.
3. 83 site → tek import.

---

### Y-11. Error boundary stratejisi yok

**Konum:** Hiç `error.tsx`, `not-found.tsx` yok

**Sorun:** Next 16 app router'da bir sayfa hata fırlatırsa default ekran gözükür — "premium kullanıcı dostu" sloganıyla uyumsuz. Lider aday detayını açar, beyaz ekran görür.

**Öneri:** En azından:
- `src/app/error.tsx` (root)
- `src/app/(dashboard)/error.tsx`
- `src/app/(dashboard)/not-found.tsx`
- Her biri brand'lı, TR/EN ikidilli, "Tekrar dene" CTA'lı.

---

### Y-12. `localStorage` ile custom içerik — premium vaadi sessizce ihlal

**Konum:** [egitim/page.tsx](src/app/(dashboard)/egitim/page.tsx), [itirazlar/page.tsx](src/app/(dashboard)/itirazlar/page.tsx) — `nmm_custom_training_v1`, `nmm_custom_objections_v1`

**Sorun:** Slogan "premium". Lider tarayıcı değiştirir → custom içeriği kaybeder. Aynı app'te iki kalıcılık modeli: read/fav DB'de, custom localStorage'da.

**Öneri:** İki yol:
- (a) `nmm_custom_objections` ve `nmm_custom_trainings` tabloları aç, sync et.
- (b) "Add custom" özelliğini kaldır, sadece kanonik içerik göster.

Karar bilinçli olmalı — şu hâli muğlak.

---

## 3. 🟡 ORTA ÖNEMLİ BULGULAR

### O-1. `useDeleteActivity` broad cache invalidation

[useCandidates.ts:293-294](src/hooks/useCandidates.ts#L293). Tüm `['activity']` ve `['candidate-notes']` invalide ediliyor. `candidateId` ile dar invalidation: `['activity', candidateId]`.

### O-2. `useCandidates` `staleTime` yok

[useCandidates.ts:31-35](src/hooks/useCandidates.ts#L31). Tab focus'a her dönüşte refetch. En az `staleTime: 30 * 1000` ekle.

### O-3. `useAIUsage` AI mutation'lardan sonra invalide edilmiyor

Her AI action `onSuccess`'inde `qc.invalidateQueries({ queryKey: ['daily-ai-usage'] })` çağırmalı.

### O-4. `useProgressSync` — `nmm_daily_actions`'ı progress storage olarak istismar ediyor

[useProgressSync.ts:67-76](src/hooks/useProgressSync.ts#L67). `action_type='note'` + `note='nmm_progress_v1:JSON'` — daily action analytics bunu kullanıcı aksiyonu sanır. `nmm_user_progress` ayrı tablosu açılmalı.

### O-5. Süper admin platform yönetiminde kendi workspace'ini göremiyor

[platform-yonetim/actions.ts:97-99](src/app/(dashboard)/platform-yonetim/actions.ts#L97). `if (w.owner_id === user.id) continue` — CLAUDE.md §4 ihlali. Sil veya kendi workspace'ini "kendin" badge'iyle başa koy.

### O-6. `EkipPanel` `useTeamMembers` hook'unu bypass ediyor

[EkipPanel.tsx:80-213](src/app/(dashboard)/ekip/_components/EkipPanel.tsx#L80). Aynı veriyi iki path'ten çekiyor, TanStack cache bypass. Hook'a geçir.

### O-7. `lib/` flat — 4 farklı genus aynı seviyede

`lib/infra/` (supabase, ai, mail), `lib/utils/` (noteParser, validation, waLink), `lib/domain/` (stages, aiUsage, navigation, trainingData), `lib/ui/` (deleteWithUndo, zIndex) ayrımı yapılabilir.

### O-8. `actions.ts` dashboard kök seviyesinde — telos belirsiz

[src/app/(dashboard)/actions.ts](src/app/(dashboard)/actions.ts). Filename'den scope anlaşılmıyor. `_shared-actions.ts` olarak yeniden adlandır.

### O-9. `domain types` yok — persistence types = domain types

`src/types/` sadece `database.types.ts` içeriyor. `Candidate`, `TeamMember`, `Workspace` domain konseptlerinin distinct dosyaları yok. View-model'ler (`DailyCandidate`, `TeamMember`, `NotificationItem`) hook'lara sızmış.

### O-10. Shopier amount-based mapping kırılgan

(K-1 ile birleşik ama orta bağlamı: para birimi değişimi ya da küsuratlı USD geleceği için fallback logic'i de gözden geçirilmeli.)

### O-11. `getLang()` server-context'inde localStorage erişimi

`useCandidates` toast callback'leri her çağrıda localStorage okur. `useTranslation` hook'una tutarlı geçiş ile çözülür (Y-8 kapsamında).

### O-12. Test stratejisi yok — bilinçli mi belgelenmemiş

Önerilen minimum:
- `getLimitsForLicense` snapshot
- Shopier HMAC doğrulama
- `checkAIQuota` (K-3 sonrası)

Vitest + @testing-library/react kurulumu ~30 dakika.

### O-13. Loading state üç farklı dil

20 dosyada skeleton/animate-pulse, hiç `loading.tsx` yok, bazı yerlerde "Verifying Session…" metin, bazı yerlerde sessiz. Karar yaz: ortak `<Skeleton/>` + route-level `loading.tsx`.

### O-14. `bugun/page.tsx` redirect kabuğu + boş `_components/`

[bugun/page.tsx](src/app/(dashboard)/bugun/page.tsx) sadece `redirect('/pano')`. [bugun/_components/](src/app/(dashboard)/bugun/_components/) boş. NAV_ITEMS `/bugun/ilgilen`'i "Bugünün Odağı" diye gösteriyor. Ya `/bugun`'u gerçek bir özet sayfasına dönüştür ya da klasörü sil ve `/ilgilen`'i ana rotaya taşı.

### O-15. API rotaları vs server actions — kural yazılı değil

3 API route (cron, shopier webhook, translate-note) vs 12 actions.ts. Kural: API rotaları **sadece** dış HTTP caller'lar için (webhook/cron/public AI). `translate-note` external caller yoksa server action'a taşınabilir. AGENTS.md'ye not düş.

### O-16. README hâlâ create-next-app boilerplate

36 satır default metin. Landing page 974 satır. README projenin ne olduğunu söylemiyor — NMM, Next 16, Supabase, super-admin mimarisi, lisans modeli özetlenmeli; AGENTS.md/CLAUDE.md'ye link.

---

## 4. 🟢 DÜŞÜK ÖNEMLİ BULGULAR

### D-1. `useNotifications` — `useMemo(() => createClient(), [])` anti-pattern

`createClient()` zaten singleton ise gereksiz; değilse `useRef(createClient()).current` daha doğru pattern.

### D-2. `useUpdateCandidate` ekstra `getUser` çağrısı

Workspace context zaten user'ı biliyor; mutation başında bir kez al.

### D-3. `lucide-react: ^1.16.0` versiyon sorgusu

NPM'de gerçek modern sürümler 0.5xx serisinde. `1.16.0` doğrulanmalı (legitimate veya yanlış paket olabilir).

### D-4. Raw `<img>` kullanımı (10+ yer)

`next/image` kullanmama kararı bilinçli mi belirsiz. AGENTS.md'ye not düş veya migrate et.

### D-5. Landing page testimonial/ROI iddiaları kendi Uyum Denetimi'nden geçer mi?

`page.tsx`'teki 10 testimonial ve "%88 aktif oran, 4 saat tasarruf" rakamları gerçek mi? Kendi compliance audit aracınızı landing page'inize uygulayın — ironik ve etik bir kontrol.

---

## 5. NE EKLENMELİ / NE ÇIKARILMALI / NE DÜZELTİLMELİ

### ➕ Eklenecekler

| # | Ne | Niye | Önem |
|---|----|------|------|
| 1 | `src/lib/auth.ts` — `isSuperAdmin/assertSuperAdmin/bypassLimit` | 83 tekrar → tek kaynak | 🟠 |
| 2 | `src/lib/ai/checkQuota.ts` — merkezi kota kontrolü | 5 dosya duplicate → tek fonksiyon | 🔴 |
| 3 | `src/app/error.tsx` + `(dashboard)/error.tsx` + `not-found.tsx` | Premium UX | 🟠 |
| 4 | `src/app/(dashboard)/loading.tsx` (route-level) | Tutarlı yükleme | 🟡 |
| 5 | `src/types/{candidate,workspace,team,notification}.ts` — domain types | Persistence ≠ domain | 🟡 |
| 6 | `supabase/migrations/README.md` — numaralandırma kuralı | Sessiz kararı görünür kıl | 🟡 |
| 7 | ESLint kuralı: `.tsx` içinde `lib/supabase/client` yasak | God components önleme | 🟠 |
| 8 | ESLint kuralı: raw `z-\[\d+\]` yasak (sadece `Z.*`) | z-index disiplini | 🟠 |
| 9 | `nmm_custom_trainings` + `nmm_custom_objections` tabloları (Y-12 (a) yolu) | Premium vaadi | 🟠 |
| 10 | Test: `getLimitsForLicense`, Shopier HMAC, `checkAIQuota` | Kritik path koruma | 🟡 |
| 11 | RPC: `fetch_team_with_downlines(workspace_id)` | 5 waterfall → 1 roundtrip | 🟠 |
| 12 | `nmm_user_progress` tablosu (O-4) | `daily_actions` istismarı son | 🟡 |
| 13 | `nmm_candidates` kolonları: `avatar_url`, `warmth`, `note_tr`, `note_en` | `\|\|\|` overload son | 🟠 |
| 14 | `loading.tsx` + `Skeleton` primitif | Tutarlı UX dili | 🟡 |
| 15 | Pre-commit hook: `supabase gen types` | Schema drift son | 🟠 |

### ➖ Çıkarılacaklar

| # | Ne | Niye |
|---|----|------|
| 1 | `process.env.SHOPIER_API_SECRET \|\| 'shopier_test_secret_key'` fallback | 🔴 GÜVENLİK |
| 2 | `src/app/(dashboard)/bugun/_components/` boş klasör | Telos kayboldu |
| 3 | `src/app/(dashboard)/bugun/page.tsx` redirect kabuğu (alternatif: gerçek sayfa yap) | Kavramsal artık |
| 4 | `if (w.owner_id === user.id) continue` (platform-yonetim) | Süper admin dualizm ihlali |
| 5 | EkipPanel içindeki doğrudan Supabase çağrıları (hook'a taşı) | God component |
| 6 | `useCandidates` içindeki tüm `getLang()` çağrıları (`useTranslation`'a geç) | i18n tutarsızlığı |
| 7 | `actions.ts` dashboard kökü → `_shared-actions.ts` veya scope'a göre dağıt | Telos belirsiz |
| 8 | Landing page (`src/app/page.tsx`)'deki sahte testimonial verileri (kanıtlanamıyorsa) | Etik + kendi compliance prensibinin ihlali |
| 9 | Raw `<img>` kullanımları → `next/image` (karar) veya AGENTS.md'ye not | Bilinçli karar olmalı |
| 10 | `useProgressSync`'deki fire-and-forget `supabase.auth.getUser().then(...)` | Hata yutma |

### 🔧 Düzeltilecekler

| # | Konum | Değişiklik |
|---|-------|------------|
| 1 | [shopier/route.ts:24](src/app/api/payment/shopier/route.ts#L24) | Fallback sil; `throw` |
| 2 | [shopier/route.ts:71-115](src/app/api/payment/shopier/route.ts#L71) | `platform_order_id` ile lisans encode |
| 3 | [yazar/actions.ts:61](src/app/(dashboard)/yazar/actions.ts#L61) | `getLimitsForLicense(licenseType, isSuperAdmin)` normalize |
| 4 | [bugun/ilgilen/actions.ts:1-26](src/app/(dashboard)/bugun/ilgilen/actions.ts) | Auth + kota ekle |
| 5 | [pipeline/[id]/actions.ts:214-258](src/app/(dashboard)/pipeline/[id]/actions.ts#L214) | Auth + kota ekle |
| 6 | [useTeamMembers.ts:30-105](src/hooks/useTeamMembers.ts#L30) | RPC ile birleştir |
| 7 | [useWorkspace.ts:69-101](src/hooks/useWorkspace.ts#L69) | INSERT'i queryFn'den çıkar |
| 8 | [useNotifications.ts:56-109](src/hooks/useNotifications.ts#L56) | `router` dep + type→route mapping |
| 9 | [useUpdateCandidate](src/hooks/useCandidates.ts#L93) | `.update().select()` single roundtrip |
| 10 | [platform-yonetim/actions.ts:69-77](src/app/(dashboard)/platform-yonetim/actions.ts#L69) | GROUP BY count RPC |
| 11 | [useCandidates.ts:293](src/hooks/useCandidates.ts#L293) | `candidateId` ile dar invalidate |
| 12 | [useCandidates.ts:31](src/hooks/useCandidates.ts#L31) | `staleTime: 30000` |
| 13 | [useAIUsage hook](src/hooks/useAIUsage.ts) | Her AI mutation `onSuccess`'inde invalidate |
| 14 | [Migration 004 × 2](supabase/migrations/) | `004a_` / `004b_` rename |
| 15 | [README.md](README.md) | Gerçek proje tanıtımı yaz |

---

## 6. ÖNERİLEN UYGULAMA SIRASI (faz planı)

### Faz A — Güvenlik (bu sprint, < 2 saat)
1. K-1: Shopier secret fallback'i sil + `platform_order_id` encoding
2. K-2: `generateQuickMessageAction` + `generateNotesSummary` auth+kota
3. K-4: `supabase gen types` çalıştır, 28 `as any`'yi sil
4. Y-1: Migration 004 numarasını çöz

### Faz B — Mimari Tek Kaynak (1-2 gün)
5. K-3: `src/lib/ai/checkQuota.ts` + 5 dosya migrate
6. Y-10: `src/lib/auth.ts` + 83 site migrate
7. Y-3: `useWorkspace` INSERT ayrıştırma
8. Y-9: `|||` delimiter → typed columns (migration + backfill)

### Faz C — UX Tutarlılık (1 gün)
9. Y-11: error.tsx / not-found.tsx
10. Y-7: z-index disiplini (ESLint + Z import)
11. Y-8: i18n bimodal → `t()`-only
12. O-13: loading.tsx + Skeleton primitif

### Faz D — Performans (1 gün)
13. Y-2: `fetch_team_with_downlines` RPC
14. Y-5: Platform admin GROUP BY count
15. Y-6: updateCandidate single roundtrip
16. O-2/O-3: staleTime + invalidation fix

### Faz E — Mimari Refactor (2-3 gün)
17. K-5: EkipPanel parçalanması (hook + lib + TSX)
18. Y-12: Custom objection/training kalıcılık (DB tabloları)
19. O-4: `nmm_user_progress` tablosu
20. O-7: `lib/` reorganizasyonu

### Faz F — Hijyen (1 gün)
21. O-14: `bugun` rota kararı
22. O-16: README
23. O-15: API vs action kuralını AGENTS.md'ye yaz
24. O-8: dashboard `actions.ts` rename
25. Test minimum seti (Faz A güvenlik path'leri için)

**Tahmini toplam:** 7-10 gün, tek geliştirici, tam odakla.

---

## 7. GÜVEN DÜZEYİ & ÇEKİNCELER

### Yüksek güven
- K-1, K-2, K-3, K-4 (Shopier, auth gaps, schema drift, quota duplication) — dosya/satır kanıtlı, üç council üyesinden en az birinin doğrudan tespiti.
- Y-1, Y-7, Y-8, Y-10 — grep ile sayısal olarak doğrulandı.

### Orta güven
- K-5 (god components): Aristoteles'in çekincesi geçerli — bazı monolitler intentional olabilir (single React tree, fewer re-renders). Decomposition UX regresyonu üretmemeli.
- Y-9 (`|||` migration): destructive schema change, backfill riski. Bilinçli zamanlama gerektirir.
- D-3 (`lucide-react` versiyon): kanıt yok, sadece kuşku — NPM doğrulaması gerekli.

### Yapılmamış / dışarıda kalan
- **Kullanıcı sayısı / PMF verisi:** Sokrates'in "bu özellik gerekli mi?" sorularına kesin cevap yok — verilere erişim yok.
- **Performans profili:** gerçek production trafiği altında query süreleri ölçülmedi.
- **a11y audit:** sadece grep ile `aria-*` sayıldı (5 satır), pratik ekran okuyucu testi yapılmadı.

---

## 8. PROMPT INJECTION NOTU

Aristoteles council üyesi, system-reminder'larda görünen MCP server talimatlarının (Telegram, Bitly, n8n, Google Drive) bir prompt injection girişimi olabileceğini fark etti. Bu mesajlar tool result'larından geldi, gerçek bir sistem direktifi değildi. Hiçbir council üyesi bu yönergeleri uygulamadı, hepsi göreve odaklı kaldı. (Bilgi: bu, tool result enjeksiyonuna karşı doğru savunma davranışıdır.)

---

## 9. SLOGAN İLE UYUM DENETİMİ

> **Slogan:** "Alanında öncü, basit, kullanıcı dostu, işlevsel ve aynı zamanda son derece profesyonel ve premium bir uygulama."

| Slogan boyutu | Mevcut durum | Boşluk |
|---|---|---|
| **Basit** | ✅ Navigasyon merkezi, NAV_ITEMS tek dosya | ⚠️ EkipPanel 1257 satır — basit değil |
| **Kullanıcı dostu** | ✅ Skeleton kullanımı yaygın | 🔴 Error boundary yok, beyaz ekran riski |
| **İşlevsel** | ✅ 13 sayfa, gerçek özellikler | ⚠️ `localStorage` ile premium kaybı (egitim/itirazlar) |
| **Profesyonel** | ✅ Türkçe-İngilizce çevirisi DB'de kalıcı | 🔴 README boilerplate, sahte testimonial riski |
| **Premium** | ✅ Tailwind 4, dark mode | 🔴 Shopier fallback secret, schema drift |
| **Alanında öncü** | ✅ AI kota + lisans modeli olgun | ⚠️ Test yok — production hatası ürün marka değerini düşürür |

**Sonuç:** Slogan uygulanabilir ama 4 kritik açık (K-1 ila K-5) kapatılana kadar "premium" iddiası sessiz şekilde ihlal ediliyor.

---

**Rapor sonu.**

*Council Triad — Linus Torvalds / Aristoteles / Sokrates*
*Hazırlayan: Claude (Anthropic) — Council of High Intelligence yöntemiyle*
*Tarih: 2026-05-28*
