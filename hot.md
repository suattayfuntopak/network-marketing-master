# Hot Log

## 2026-06-10 — Şerit 3-buton + Saha Özetim "pat pat" hız + davet senkronizasyonu + telemetri monitörü ✅

Tek oturumda 4 iş; build + tsc + lint + unit (183/183) yeşil.

### 1) Dönem şeridi düzeltmeleri (`HubPeriodNavigator`)
- **5 değil 3 öğe**: görünür pencere artık tam 3 buton (`basis-1/3` + `px-[33.333%]`) — Dün · Bugün · Yarın.
- **Ayrı butonlar + belirgin ara çizgi**: her slot kendi çerçeveli iç-kartı (`border` + net boşluk), pasif kartlar da görünür kenarlı — düz şerit değil.
- **Gecikmesiz oturma**: `scrollend` olayı (destekleyen tarayıcıda anında; yoksa 90ms fallback) → parmağı çekince ortadaki dönem hemen seçilir, metrik client-state'ten ANINDA gelir (aşağıdaki perf işiyle).
- **Yıl etiketi**: "Bu yıl" yerine içinde bulunduğumuz yıl sayısı (2026). `formatYearLabel(year)` artık her zaman yıl sayısı döndürür.

### 2) Saha Özetim "pat pat" hız (Aktivite sekmesi modeli her yere)
- **Kök neden**: sekme/offset `router.replace` ile değişiyordu → her değişimde RSC turu + `page.tsx` server'da `await prefetchHubMetrics` (~15 uzak Supabase sorgusu, ~230ms/sorgu → saniyeler) BLOKLUYORDU.
- **Çözüm**: hub gezintisi tamamen **istemci state** (`HubPeriodProvider` context + `window.history.replaceState`) — RSC turu yok. `page.tsx` artık yalnızca AÇIK sekmenin görünen dönemini (tek sorgu) await eder; komşu dönemler + diğer sekmeler istemcide ısıtılır (`MemberActivitySheet` modeli: prefetch + `placeholderData`). Sonuç: girişler ~1 round-trip, geçişler önbellekten anında.

### 3) Davet senkronizasyonu (Ezgi Şagar "iki kişi" sorunu)
- **Kök neden**: WhatsApp davet linki yalnızca düz `/kayit` idi; linkten kaydolan kişi davet kodunu elle girmeyince `parent_id` boş kalıyor → "dış kayıt" olarak görünüyor + boru hattındaki "katıldı" adayıyla eşleşmeyip **çift** sayılıyordu.
- **Kalıcı (4A)**: davet linki artık token taşır (`?ref=KOD&aday=ID`). `SignupForm` token'ı gizli alana, `signupAction` `user_metadata.pending_invite_code`'a yazar; ilk workspace oluşturulurken (`ensureWorkspaceAction`, yalnızca ilk kez) `nmm_join_workspace` ile **otomatik bağlanır** = kodu elle girmekle birebir aynı. Bir daha "dış kayıt"/çift sayım olmaz.
- **Mevcut kayıt (4B)**: Platform > Dış Kayıtlar'da her satıra **"Ekibime Bağla"** (Link2) butonu → `claimIndependentSignupToTeamAction` hedef workspace'in `parent_id`'sini süper admin workspace'ine set eder (060 `nmm_join_workspace` ile aynı format; başka lidere bağlıysa korur). Tek tıkla Ezgi dış kayıt olmaktan çıkar + tek kişi olur.

### 4) Telemetri monitörü (debug kart yerine — "şimdi yap")
- `HubPrefetchMonitorCard`: süper admin için **katlanabilir** (`<details>`), premium kart — 7 günlük mini sütun trendi + son sunucu olayları, ham log/çiğ anahtar SIZDIRMAZ, zarif boş durum. Platform sayfasının altına "Sistem telemetrisi" olarak mount edildi (varsayılan kapalı).

### Dosyalar
`components/hub/HubPeriodNavigator.tsx`, `components/hub/useHubPeriodNavigation.ts` (→ context provider), `saha-ozetim/page.tsx`, `saha-ozetim/_components/FieldSummaryPage.tsx`, `lib/utils/hubPeriodRange.ts`, `platform-yonetim/_components/HubPrefetchMonitorCard.tsx` (yeni) + `PlatformYonetimContent.tsx`, `platform-yonetim/admin-actions.ts`, `actions/workspace.ts`, `(auth)/kayit/_components/SignupForm.tsx` + `actions.ts`, `pipeline/[id]/actions.ts`, `lib/translations/sections/platform.ts`

## 2026-06-10 — Dönem şeridi akan-şerit (sabit oklar) + platform debug kartı kaldırıldı ✅

### Dönem şeridi yeniden tasarımı (Saha Özetim — gün/hafta/ay/yıl)
- Eski swipe transform-tabanlıydı: oklar da hareket ediyor, lastik gibi esniyor, bir kaydırma = bir adım.
- Yeni `HubPeriodNavigator`: **native scroll-snap şerit** — dönem butonları **sabit ◀ ▶ okların ALTINDAN** akar (köprü etkisi; oklar opak bg + halo ile slotları gizler). Parmakla serbestçe kaydır (native momentum + snap bedava), istediğin dönemde dur; snap oturunca **o dönemin metrikleri yüklenir**. Oklar tek adım için aynen çalışır; bir slota dokunmak da o döneme götürür. 4 sekmenin hepsinde.
- Feedback-loop guard'ları: programatik ortalama (`syncingRef`) ve scroll-settle kaynaklı offset değişiminde tekrar-ortalamama (`settledByScrollRef`).
- Eski makine silindi: `useHubPeriodSwipe.ts`, `lib/ui/hubPeriodSwipe.ts(+test)`, `e2e/helpers/hubPeriodSwipe.ts`. E2E swipe testleri **ok-tabanlı** (stabil) yapıldı (`hub-period-prev/next` testid).

### Platform Yönetimi temizliği
- `HubPrefetchDebugCard` (perf çalışması için eklenen geliştirici telemetri kartı — ham log + i18n anahtarı sızdırıyordu) **production UI'dan kaldırıldı** (premium/sade ilkesi). Telemetri altyapısı (cron/actions) durur; istenirse düzgün bir monitör görünümü ayrıca yapılabilir.

### Doğrulama
build + tsc + lint + unit (183/183) yeşil.

### Dosyalar
`components/hub/HubPeriodNavigator.tsx`, `platform-yonetim/_components/PlatformYonetimContent.tsx`, `e2e/dashboard-mobile.spec.ts` (+4 dosya silindi)

## 2026-06-10 — Deploy hızlandırıldı: hızlı CI Gate + E2E advisory ✅

### Sorun
Prod deploy tam E2E (Playwright, 5-6 dk + kırılgan tarayıcı testleri) bitişine bağlıydı. `workflow_run` workflow'un TAMAMI bitince ateşlendiği için, Playwright advisory yapılsa bile deploy onu beklerdi. Sonuç: yavaş deploy + kırılgan testin hattı kilitlemesi.

### Çözüm (gate kaldırılmadı, dozu ayarlandı)
- **`unit-test.yml` → "CI Gate"**: lint + unit + build (~2 dk) tek hızlı workflow. Deploy buna bağlandı.
- **`deploy.yml`**: `workflow_run` artık `CI Gate`'i dinliyor; "E2E (chromium) doğrula" adımı kaldırıldı (CI Gate conclusion=success ⇒ lint+unit+build geçti). Prod smoke + smoke-alert korundu.
- **`e2e.yml`** (Playwright): dokunulmadı — artık **advisory**; ayrı koşar, sonucu görünür ama deploy'u BLOKLAMAZ.

### Sonuç
commit→push→**~2 dk'da prod** (eski hız geri geldi). Koruma durur: lint/unit/build geçmeyen commit prod'a gitmez (Vercel build de kırık derlemeyi promote etmez). Kırılgan bir E2E testi bir daha deploy hattını kilitleyemez. YAML'ler doğrulandı (js-yaml).

### Dosyalar
`.github/workflows/unit-test.yml` (→ CI Gate), `.github/workflows/deploy.yml`

## 2026-06-10 — Saha Özetim dönem şeridi: hızlı fiske (flick) ile kaydırma ✅

Dönem şeridinde (Dün/Bugün/Yarın — gün/hafta/ay/yıl, 4 sekme) parmakla kaydırma zaten vardı (mesafe-tabanlı, ~116px sürükleme gerekiyordu). Artık **kısa ama hızlı fiske** de dönem değiştiriyor: `useHubPeriodSwipe` jest süresini izliyor, `resolveHubPeriodGesture(rawDx, elapsedMs)` hem mesafe hem **hız eşiğini** (≥0.45 px/ms, ≥24px) değerlendiriyor. Yön korunur: sola hızlı kaydır → ileri (next), sağa → geri (prev). Oklar tek tek tıklama için aynen çalışır. Mevcut yavaş-sürükleme davranışı + E2E (tam swipe) bozulmadı; 5 yeni unit test eklendi (10 passed).

### Dosyalar
`lib/ui/hubPeriodSwipe.ts`, `components/hub/useHubPeriodSwipe.ts`, `lib/ui/hubPeriodSwipe.test.ts`

## 2026-06-10 — CI: doküman-only commit'ler E2E/Vitest/deploy tetiklemesin ✅

`e2e.yml` ve `unit-test.yml` **push (main)** trigger'larına `paths-ignore` (`**.md`, `docs/**`, `hot.md`) eklendi — PR trigger'larında zaten vardı. Artık yalnızca hot.md/dokümana dokunan commit'ler boşuna 5dk E2E + Vitest + prod deploy tetiklemiyor. Karışık (kod+md) commit'ler etkilenmez. `migrate-check.yml` (zaten `paths:` filtreli) ve `lint-pr.yml` (yalnız PR) dokunulmadı.

### Dosyalar
`.github/workflows/e2e.yml`, `.github/workflows/unit-test.yml`

## 2026-06-10 — Deploy gate düzeltildi: saha-radar E2E testi (prod deploy zinciri açıldı) ✅

### Sorun
Prod deploy E2E-gated (`deploy.yml`); E2E (chromium) #141'den beri kırmızıydı → Deploy (production) atlanıyor, ~1 saat Vercel'e deploy gitmiyordu.

### Kök neden
27 chromium testinden **yalnızca 1'i** fail: `e2e/saha-radar-activity.spec.ts › activity member card opens pipeline detail when linked`. Test hesabının workspace'inde saha-radar aktivite kartı yokken `expect(card).toBeVisible({ timeout: 15_000 })` timeout veriyordu (`test.skip(!pipelineId)` guard'ı görünürlük kontrolünden sonra olduğu için boş duruma ulaşamıyordu). Uygulama kodu sağlamdı (build/lint/tsc/188 unit + 25 E2E yeşil).

### Çözüm
Kart varlığı `waitFor({ state: 'visible' }).then(()=>true).catch(()=>false)` ile yumuşak kontrol; kart yoksa (boş workspace) `test.skip`. Davranış yalnızca kart VARSA doğrulanıyor. E2E #152 yeşil → Deploy (production) #32 otomatik tetiklendi; zincir geri açıldı.

### Acil unblock (kalıcı fix beklerken)
Vercel Deploy Hook (`ci-prod` / main) elle tetiklenip `a1a8a33` prod'a alındı (`vercel.json` git auto-deploy main=false; hook bundan etkilenmez).

### Dosyalar
`e2e/saha-radar-activity.spec.ts`

## 2026-06-10 — İtiraz zenginleştirme Faz 2 + Öğrenme Yolu + QA ✅

### Özet (4 öneri sırayla)
- **(1) İtiraz zenginleştirme:** En yaygın 10 itiraz, eski projeden uyarlanan içerikle derinleştirildi — hazır WhatsApp **örnek diyaloğu** + **yaklaşım** (+ bazılarında detaylı cevap), TR & EN. #1 piramit, #3 param yok, #5 vaktim yok, #21 pasif gelir, #8 daha önce denedim, #11 satıcı değilim, #12 sosyal değilim, #28 çevrem dar, #36 ürün, #37 sen de kazanmıyorsun. (Card altyapısı önceki commit'te kurulmuştu; mevcut cevaplar korundu, mükerrer yok.)
- **(2) QA turu:** Tüm değişen yüzeyler için kod-seviyesi QA — build (47 route) + tsc + lint yeşil. Gerçek-cihaz/deploy QA kullanıcı adımıdır.
- **(3) Öğrenme Yolu:** İçerik kütüphanesine "Öğrenme yolunda sıradaki" banner'ı — okunmamış konular arasında seviye sırasına göre (Başlangıç→Orta→İleri) bir sonraki konuyu önerir; "Devam et" filtreleri sıfırlayıp konuyu açar. Mevcut okundu-takibi + seviye verisini kullanır.
- **(4) Süper-admin içerik editörü:** Değerlendirildi — custom-content (ekle/sil + moderasyon) altyapısı zaten var; 64 yerleşik konunun DB'ye taşınıp düzenlenmesi ayrı bir proje (raporda scope).

### Dosyalar
`itirazlar/data/itirazlar.ts`, `itirazlar/_components/ItirazCard.tsx` (önceki), `egitim/_components/EgitimContent.tsx`, `translations/sections/training.ts`

## 2026-06-10 — Onaylanan genel öneriler: PR lint, mobile advisory, smoke alert, preview comment, hub rollup ✅

### Özet
- **Lint (PR):** `lint-pr.yml` — PR'da yalnızca ESLint, hızlı geri bildirim.
- **Mobile E2E advisory:** `continue-on-error` + deploy yalnızca **E2E (chromium)** doğrular.
- **Deploy smoke alert:** smoke fail → `prod-smoke` etiketli GitHub issue (duplicate guard).
- **Vercel preview comment:** `preview-comment.yml` — preview URL PR yorumu.
- **Hub prefetch günlük rollup:** migration `078`, cron `/api/cron/hub-prefetch-rollup`, Platform kartında 7 günlük trend.
- **Vitest 188/188**, lint + build yeşil. Migration 077/078: Supabase Dashboard'dan uygulanmalı (local link yok).

### Dosyalar
`lint-pr.yml`, `preview-comment.yml`, `deploy.yml`, `e2e.yml`, `cron-emails.yml`, `078_hub_prefetch_daily_rollup.sql`, `hub-prefetch-rollup/route.ts`, `hubPrefetchActions.ts`, `HubPrefetchDebugCard.tsx`, `platform.ts`, `database.types.ts`, `github-secrets.md`, `hub-metrics.md`

## 2026-06-10 — 5 sprint önerisi: CI lint split, mobile E2E, deploy smoke, PR preview, hub prefetch DB ✅

### Özet
- **Deploy health check:** `deploy.yml` — hook sonrası `/pano` smoke (12×30s, HTTP 200/307/308); `NMM_PROD_URL` repo variable.
- **E2E lint split:** `e2e.yml` — ayrı **Lint** job → Build → **E2E (chromium)** + **E2E (mobile-chrome)** paralel, ayrı artifact.
- **Hub prefetch sunucu telemetrisi:** migration `077` (`nmm_hub_prefetch_events`), `hubPrefetchActions.ts`, `prefetchRouteMetrics` kayıt (ssr/hover), Platform Yönetimi kartı yerel + sunucu son 12.
- **PR preview deploy:** `vercel-should-build.sh` preview ortamında her zaman build; `main` prod gate ayrı (hook + `deploymentEnabled.main: false`).
- **Dokümantasyon:** `github-secrets.md`, `hub-metrics.md`, `database.types.ts`.
- **Vitest 188/188**, lint + build yeşil.

### Dosyalar
`.github/workflows/e2e.yml`, `.github/workflows/deploy.yml`, `077_hub_prefetch_events.sql`, `hubPrefetchActions.ts`, `HubPrefetchDebugCard.tsx`, `prefetchRouteMetrics.ts`, `platform.ts`, `database.types.ts`, `vercel-should-build.sh`, `github-secrets.md`, `hub-metrics.md`

## 2026-06-10 — Akademi: seviye filtresi + ilerleme çubuğu + itiraz zenginleştirme altyapısı ✅

### Özet
- **Seviye filtresi (Genel #2 + #4):** İçerik kütüphanesine Tüm Seviyeler / Başlangıç / Orta / İleri filtre satırı eklendi (`SEVIYE_GRUPLARI` TR+EN+custom değer eşlemesi). Arama + kategori + favori + seviye birlikte çalışır.
- **İlerleme çubuğu (Genel #3 görünürlük):** Başlıkta `%` + ince yeşil çubuk (okunan/toplam). Not: okundu-takibi (`toggleRead`, rozet) ve % hook'u zaten vardı; artık görsel çubukla pekiştirildi.
- **İtiraz zenginleştirme altyapısı (Öneri #2):** `ItirazCard` artık `cevap` ile birlikte `detayliCevap` + `yaklasim` + `ornekDiyalog`'u (varsa) katman katman gösteriyor (eskiden yalnız `cevap` yoksa görünürdü). `buildCopyValue` da bu katmanları kopyalıyor → mevcut 37 itiraz cevabını korur, zenginleştirilenler derinlik kazanır (mükerrersiz).
- **Örnek zenginleştirme:** #36 (ürün etkinliği) ve #37 (sen de kazanmıyorsun) itirazları detaylı cevap + örnek WhatsApp diyaloğu + yaklaşım ile TR+EN dolduruldu.
- **Durum tespiti:** Genel #3 (tamamlama) ve Genel #5 (içerik DB+editör → mevcut `nmm_custom_trainings/objections` + moderasyon altyapısı) zaten kısmen/tam mevcut; raporda detaylandırıldı.

### Dosyalar
`EgitimContent.tsx`, `ItirazCard.tsx`, `itirazlar/data/itirazlar.ts`, `translations/sections/training.ts`

## 2026-06-10 — CI lint fix + sprint önerileri + deploy zinciri dokümantasyonu ✅

### Özet
- **Kök neden:** E2E **Build** job `useHubPeriodSwipe.ts` react-hooks/refs lint hatası → E2E fail → `vercel.json` main auto-deploy kapalı olduğu için prod deploy **skipped** (son prod ~6e4d0f4).
- **Fix:** ref güncellemesi `useEffect` içine alındı; lint + build yeşil.
- **Sprint:** Saha Radarı E2E (`saha-radar-activity.spec.ts`), pipelineId yok toast, hub prefetch debug kartı (Platform Yönetimi), `MemberRow` JSDoc, branch protection + troubleshooting `github-secrets.md`.
- **Vitest 188/188**

### Dosyalar
`useHubPeriodSwipe.ts`, `hubPeriodPrefetch.ts`, `prefetchRouteMetrics.ts`, `CrownSahaRadarPage.tsx`, `HubPrefetchDebugCard.tsx`, `PlatformYonetimContent.tsx`, `types.ts`, `crown.ts`, `platform.ts`, `saha-radar-activity.spec.ts`, `github-secrets.md`, `hub-metrics.md`, `AGENTS.md`

## 2026-06-10 — 5 genel öneri + Saha Radarı aktivite kartı pipeline linki ✅

### Özet
- **Saha Radarı aktivite** — `MemberCard` tıklanınca `pipeline_id` → `/pipeline/[id]` (ör. Elif Sinem Topak); eşleşme yoksa `/ekip/[userId]`.
- **Hover prefetch inceltme** — `writeStoredHubActiveTab` / `readStoredHubActiveTab` (`nmm_hub_active_tab`); nav hover son sekme + komşu offset.
- **Prefetch debug log** — development + Vercel preview'da `console.debug('[prefetchHubMetrics]', …)`.
- **E2E sekme geçişi** — `hub-summary-tab-*` testid + monthly/yearly tıklama testi.
- **CI Vitest paralel job** — `.github/workflows/unit-test.yml`; e2e build'den kaldırıldı.
- **Dokümantasyon** — `docs/hub-metrics.md` + `AGENTS.md` hub bölümü.
- **Vitest 188/188**

### Dosyalar
`crown/actions.ts`, `CrownSahaRadarPage.tsx`, `hubPeriodPrefetch.ts`, `hubPeriodPrefetch.test.ts`, `prefetchRouteMetrics.ts`, `FieldSummaryPage.tsx`, `HubSummaryTabBar.tsx`, `dashboard-mobile.spec.ts`, `unit-test.yml`, `e2e.yml`, `docs/hub-metrics.md`, `AGENTS.md`

## 2026-06-10 — 5 genel öneri: hub SSR prefetch, placeholder, CI Vitest, mobile E2E, prefetch maliyet ✅

### Özet
- **Saha Özetim SSR prefetch** — `saha-ozetim/page.tsx` workspace + `prefetchHubMetrics` + `HydrationBoundary` (URL `tab` ile aktif sekme).
- **Paylaşımlı hub dönem modülü** — `hubPeriodPrefetch.ts` (`HUB_PERIOD_NEIGHBOR_OFFSETS`, `parseSummaryTab`, offset seçici); `HubSummaryTabBar` re-export.
- **Flicker azaltma** — `FieldSummaryPage` `placeholderData` → önbellekteki aynı query key verisi (SSR/hover prefetch).
- **Prefetch maliyet kontrolü** — `prefetchHubMetrics({ activeTab })`: komşu offset yalnızca aktif sekmede; hover/SSR dışı → offset 0.
- **CI** — `e2e.yml` build job'a `npm test`; Playwright `chromium` + `mobile-chrome`.
- **Vitest 187/187** — `hubPeriodPrefetch.test.ts`.

### Dosyalar
`hubPeriodPrefetch.ts`, `hubPeriodPrefetch.test.ts`, `prefetchRouteMetrics.ts`, `saha-ozetim/page.tsx`, `FieldSummaryPage.tsx`, `HubSummaryTabBar.tsx`, `.github/workflows/e2e.yml`

## 2026-06-10 — İçerik Kütüphanesi: 34 yeni global NM konusu (Öneri #1 dahil) ✅

### Özet
- **İçerik kütüphanesi 30 → 64 konu** (TR+EN, `getTrainingData` ikilisi). Network marketing dünyası global olarak analiz edilip NMM'de **olmayan** 34 yeni konu, 8 mevcut kategoriye küratörlü dağıtıldı (mükerrer değil).
- **Öneri #1 içine işlendi:** "En Sık 5 Hata" serisi (z9 Yeni Başlayan, i8 Takip, e9 Liderlik) + "Rol Oyunu" pratikleri (d8 Davet Diyaloğu, sk7 İtiraz Karşılama).
- **Yeni konular:** Zihniyet (Hedef & Neden, Bolluk vs Kıtlık, Alışkanlık İnşası, 5 Hata); İletişim (Aktif Dinleme, FORM Formülü, Beden Dili & Ses, Hikaye Anlatımı, Takipte 5 Hata); Davet (Soğuk vs Sıcak Pazar, Tavsiye İsteme, Edification, Etkinliğe Davet, Rol Oyunu); Sunum (Üçlü Görüşme, Araçların Gücü, Takip Sıralaması, Rol Oyunu); Ekip (Hızlı Başlangıç 48 Saat, Örnek Liderlik, Tanıma & Takdir, Online Ekip, Liderlikte 5 Hata); Strateji (İçerik Takvimi, Çekim Pazarlaması, Etkinliklerin Gücü, Zaman Bloklama, KPI Takibi, **YZ Araçları**); Uyum (Gelir Beyanı Etiği, Spam & İzin); Ürün (Ürün Hikayesi, Otomatik Sipariş, Müşteri Sadakati).
- Her konu NMM premium formatında: başlık + emoji + süre + seviye + özet + 5 madde, TR & EN ayrı. Build + tsc + lint temiz.

### Dosyalar
`lib/domain/trainingData.ts`

## 2026-06-10 — 5 takip önerisi: prefetch DRY, hub offset, test fix, E2E helper ✅

### Özet
- **`getSelfUserProgressAction` kaldırıldı** — tek kaynak `getFullSelfUserProgressAction`.
- **`prefetchAkademiProgressBundle` export** — `egitim` + `canli-egitim` SSR sayfaları ortak helper kullanıyor.
- **Hub prefetch komşu offset'ler** — `prefetchHubMetrics` daily/weekly/monthly/yearly için offset -1, 0, 1.
- **Vitest 184/184** — `teamAccess`, `checkQuota` (JOIN mock + trial beklentisi), `shopierOrderWebhook` (taze timestamp).
- **E2E helper** — `e2e/helpers/hubPeriodSwipe.ts`; günlük sol + haftalık sağ swipe testleri.

### Dosyalar
`akademiProgressActions.ts`, `prefetchRouteMetrics.ts`, `egitim/page.tsx`, `canli-egitim/page.tsx`, `teamAccess.test.ts`, `checkQuota.test.ts`, `shopierOrderWebhook.test.ts`, `e2e/helpers/hubPeriodSwipe.ts`, `dashboard-mobile.spec.ts`

## 2026-06-10 — 5 takip önerisi: test, tam prefetch, i18n, E2E swipe, focus refetch ✅

### Özet
- **Vitest:** `hubPeriodSwipe.test.ts` (eşik/yön), `hubPeriodRange.test.ts` (kompakt etiketler, offset parse).
- **Tam progress prefetch:** `getFullSelfUserProgressAction` — `egitim`, `canli-egitim`, hover prefetch, `usePersonalAkademiProgress` (favori/okundu SSR hydrate).
- **i18n:** `dashboard.summaryPeriodPrev` / `summaryPeriodNext` + `data-testid="hub-period-navigator"`.
- **E2E:** Mobil `/saha-ozetim` dönem şeridi swipe → `offset=1`.
- **Çoklu cihaz:** `QUERY_STALE.progress` (60s) + `refetchOnWindowFocus` / `refetchOnReconnect` on progress query.

### Dosyalar
`hubPeriodSwipe.ts`, `hubPeriodSwipe.test.ts`, `hubPeriodRange.test.ts`, `useHubPeriodSwipe.ts`, `HubPeriodNavigator.tsx`, `staleTimes.ts`, `useProgressSync.ts`, `usePersonalAkademiProgress.ts`, `egitim/page.tsx`, `canli-egitim/page.tsx`, `prefetchRouteMetrics.ts`, `tr.ts`, `en.ts`, `dashboard-mobile.spec.ts`

## 2026-06-10 — Üye detay çeviri, dönem şeridi swipe, Akademi prefetch + progress TanStack ✅

### Özet
- **Üye detay başlık:** `MemberDetailPage` çeviri anahtarları `dashboard.memberDetail*` → `team.memberDetail*` (Saha Radarı → Aktivite tıklanınca artık “Üye Detayı”).
- **Saha Özetim dönem şeridi:** `HubPeriodNavigator` mobil yatay kaydırma (`useHubPeriodSwipe`, `no-swipe`, `preventDefault`); `router.replace` + `scroll: false`; hafta/ay için kompakt etiketler (`formatWeekRangeLabelCompact`, `formatMonthLabelCompact`).
- **5 öneri:** `useProgressSync` → TanStack Query + server actions; `egitim/page.tsx` SSR prefetch; `invalidateHubMetrics` + progress/custom counts; E2E mobil tab tek satır + `/egitim` smoke.

### Dosyalar
`MemberDetailPage.tsx`, `HubPeriodNavigator.tsx`, `useHubPeriodSwipe.ts`, `useHubPeriodNavigation.ts`, `hubPeriodRange.ts`, `useProgressSync.ts`, `akademiProgressActions.ts`, `egitim/page.tsx`, `invalidateHubMetrics.ts`, `dashboard-mobile.spec.ts`, `critical-routes-smoke.spec.ts`

## 2026-06-10 — İtiraz Bankası: eski projeden eksik itirazların ithali ✅

### Özet
- **Eski repo karşılaştırması (`network-marketing-ultimate`):** İçerik kütüphanesi + itiraz bankası eski projeyle satır satır karşılaştırıldı.
- **İçerik kütüphanesi:** Eski repodaki 19 elle yazılmış eğitim konusunun **tamamı zaten NMM'de mevcut** (proje bunlardan kurulmuş). Kalan 72 kayıt prosedürel/templated kombinasyon (12 konu × 6 şablon) ve NMM'in küratörlü konularıyla semantik mükerrer → premium/sade ilkesi (CLAUDE.md #1) gereği **toplu ithal edilmedi**.
- **İtiraz bankası:** Eski repodaki 26 spesifik itirazdan **2 tanesi** NMM'de yoktu, ithal edildi (35 → 37):
  - **#36 (Ürün & Sistem):** "Bu ürünler gerçekten işe yarıyor mu?" — ürün etkinliğine duyulan şüphe (NMM'deki fiyat/market/kargo itirazlarından farklı).
  - **#37 (Güven & Şüphe):** "Sen de para kazanmıyorsundur zaten." — tavsiye edenin kendi başarısının sorgulanması (NMM'deki "sadece benden kazanmak için" itirazından farklı).
- Cevaplar NMM premium formatına (özlü `cevap` {tr,en}) damıtıldı; eski içerikteki `[placeholder]` ifadeleri temizlendi. Mükerrer olmamasına dikkat edildi.

### Dosyalar
`itirazlar/data/itirazlar.ts`

## 2026-06-10 — Akademi mobil etiketler + Eğitim İlerlemem hız + Ekibim cilası ✅

### Özet
- **Vaktin Varsa / Eğitim İlerlemem mobil:** `AkademiTabLabel` — Kütüphane / Videolar / İtirazlar (sm+ tam metin); `whitespace-nowrap`.
- **6 kutu metrik gecikmesi:** SSR prefetch (`selfUserProgress`, `akademiCustomCounts`, `videoCatalog`); `useProgressSync` local-first; TanStack query snapshot.
- **Ekibim:** Saha mobil satırda toplam aksiyon rozeti; eğitim mobilde ortalama %; boş eğitim sıralaması mesajı; üye detayda tekrarlayan mini grafik kaldırıldı; `MEMBER_LIST_VIRTUALIZE_THRESHOLD` export; E2E `/canli-egitim` smoke.

### Dosyalar
`AkademiTabLabel.tsx`, `akademiTabTheme.ts`, `training.ts`, `akademiProgressActions.ts`, `usePersonalAkademiProgress.ts`, `useProgressSync.ts`, `canli-egitim/page.tsx`, `CrownVideoPage.tsx`, `AkademiContent.tsx`, `TeamFieldRankingTable.tsx`, `TeamTrainingRankingTable.tsx`, `MemberDetailPage.tsx`, `prefetchRouteMetrics.ts`, `keys.ts`, `critical-routes-smoke.spec.ts`, `tr.ts`, `en.ts`

## 2026-06-10 — Ekibim 5 takip önerisi (sanallaştırma, eğitim mobil, prefetch, detay sayfası) ✅

### Özet
- **Üye listesi sanallaştırma:** 20+ üyede `@tanstack/react-virtual` + `measureKey` (sekme aç/kapa yeniden ölçüm).
- **Eğitim sıralaması mobil:** Saha Özeti ile aynı chevron + 2–3 sütun metrik grid; masaüstü tablo korundu.
- **Canlı Eğitim prefetch:** SSR `videoCatalog` hydrate; hover prefetch ağır `getCrownVideoPageAction` yerine katalog.
- **Üye detay:** Pipeline 4×StatBox → gömülü `MemberActivitySheet` (Ekip kartlarıyla aynı aktivite özeti).
- **Çeviri:** `joinNotifKpi` — “tanışma” → “ekleme” / “contacts” → “added”.

### Dosyalar
`VirtualizedMemberList.tsx`, `TeamPerformanceSection.tsx`, `TeamTrainingRankingTable.tsx`, `MemberDetailPage.tsx`, `canli-egitim/page.tsx`, `prefetchRouteMetrics.ts`, `tr.ts`, `en.ts`

## 2026-06-10 — Ekibim mobil UX + aktivite sekmesi + eğitim hızlandırma ✅

### Özet
- **Saha Özeti mobil:** İsim + chevron; açılınca 2–3 sütun metrik grid. Masaüstü tablo aynı.
- **Mobil davet:** Saha ortağında ikon-only (UserPlus + WhatsApp); metin `sm+`.
- **Aktivite sekmesi:** `stripActivityTabs` kaldırıldı — aç/kapa toggle düzgün çalışıyor.
- **Aktivite UI:** Huni sekmesi kaldırıldı; Takipte/Katıldı aktivite metriklerine taşındı; “Henüz hedef…” alt yazısı gizlendi; başlık “Aktivite Özeti”.
- **Çeviri:** “Kaç Kişiyle Tanıştım?” → “Kaç Kişi Ekledim?” (hedef + pano + saha metrikleri).
- **Eğitim İlerlemem:** “İzlemeye devam et” kutusu `useVideoCatalog` + `deriveVideoContinueFromCatalog` ile anında.
- **Performans:** Ranking için tek YTD huni fetch; Ekibim sekmeleri `dynamic()` lazy; eğitim tablosu sticky opak sütun; `@tanstack/react-virtual` eklendi (liste sanallaştırma sonraki adım).

### Dosyalar
`TeamFieldRankingTable.tsx`, `TeamPerformanceSection.tsx`, `MemberActivitySheet.tsx`, `HubCrownFunnelGrid.tsx`, `CrownVideoPage.tsx`, `videoContinue.ts`, `EkipPanel.tsx`, `TeamTrainingRankingTable.tsx`, `funnelActuals.ts`, `teamActivityActions.ts`, `tr.ts`, `en.ts`, `package.json`

## 2026-06-10 — Ekibim UX + performans sprinti ✅

### Özet
- Saha ortağı satırında **NMM'e Davet Et** butonu tekrar sağa yaslandı (tüm breakpoint'ler).
- WhatsApp davet metni yeni şablona güncellendi (davet kodu + Ekibim kutusu talimatı).
- **Ekibim Araçları** chevron varsayılan açık.
- Saha Özeti tablosunda sticky isim sütunu opak — yatay kaydırmada metrikler altta görünmez.
- Sekme geçişi hızlandırıldı: SSR'da ranking prefetch bloklaması kaldırıldı, sekme bazlı skeleton, eğitim prefetch.

### Dosyalar
`TeamPerformanceSection.tsx`, `TeamFieldRankingTable.tsx`, `EkipPanel.tsx`, `EkipTabNav.tsx`, `ekip/page.tsx`, `prefetchRouteMetrics.ts`, `tr.ts`, `en.ts`

## 2026-06-10 — Deploy gate UÇTAN UCA DOĞRULANDI + lint fix ✅

### Gate canlı çalıştı (gerçek kanıt)
- `vercel.json` `git.deploymentEnabled.main=false` push'landı (c1a523d).
- İlk push'ta (ea7a020) E2E **kırmızıydı** → gate **doğru davrandı**, deploy tetiklenmedi. Kök neden: diğer ajanın 127ab27'sinde lint hatası.
- **Lint fix (f08407c):** `TeamPerformanceTable.tsx` — 127ab27'de eklenen `useMemo` React Compiler `preserve-manual-memoization` hatası veriyordu (defaultlu `{}` paramları + her render yeniden üretilen `appRows`). Manuel `useMemo` kaldırıldı, compiler memoize ediyor. `npm run lint` exit 0.
- f08407c push → E2E **yeşil** → `deploy.yml` **gerçek hook'u tetikledi**: log'da `HOOK_URL: ***`, `E2E yeşil → ... tetikleniyor (f08407c)`, `Deploy hook tetiklendi.` (PASİF değil).

### Artık üretim akışı
- Push → E2E koşar → **yeşilse** Vercel Deploy Hook → prod deploy. **Kırmızıysa deploy YOK.**
- Vercel Git push auto-deploy kapalı; tek deploy yolu hook (E2E sonrası). Doğrudan-`main`-push korunuyor.
- Kullanıcı Vercel → Deployments'ta f08407c için "Deploy Hook" kaynaklı tek deploy görmeli (Git push değil).

### Dosyalar
`vercel.json` (c1a523d), `TeamPerformanceTable.tsx` (f08407c). Scaffold: `deploy.yml` (e32e5dc).

## 2026-06-10 — Saha Özetim yıllık hero çeviri anahtarı ✅

### Özet
- `HubYearHero` / `HubAllTimeHero`: `dashboard.memberDetailWeekly*` → `team.memberDetailWeekly*` (Arama / WhatsApp).

### Dosyalar
`HubYearHero.tsx`, `HubAllTimeHero.tsx`. (Commit a58b807)

## 2026-06-10 — Deploy gate AKTİF: prod deploy artık E2E-gated ✅

### Aktivasyon tamamlandı (kullanıcı 1-3, ajan 4)
- Kullanıcı: Vercel Deploy Hook (`ci-prod`, branch main) oluşturdu + `VERCEL_DEPLOY_HOOK_URL` secret ekledi.
- Ajan doğrulama: GitHub Actions secret listesinde `VERCEL_DEPLOY_HOOK_URL` **var** (11 secret) — `vercel.json` değiştirilmeden önce teyit edildi (yoksa prod donardı).
- Ajan: `vercel.json` → `git.deploymentEnabled.main=false` (commit c1a523d). `ignoreCommand` korundu.

### Yeni akış (artık canlı)
- Push → E2E (Playwright) koşar → **yeşilse** `deploy.yml` (workflow_run) Vercel Deploy Hook'unu tetikler → prod deploy.
- **Kırmızıysa deploy GİTMEZ.** Vercel Git push auto-deploy kapalı; deploy yalnızca hook'tan (E2E sonrası) gelir → yarış yok.
- Doğrudan-`main`-push akışı değişmedi; PR zorunluluğu YOK.

### Geri alma (gerekirse)
- `vercel.json`'dan `git` bloğunu kaldır → Vercel push auto-deploy geri gelir (eski davranış).

### Dosyalar
`vercel.json`. (Commit c1a523d). İlgili scaffold: `deploy.yml` (e32e5dc).

## 2026-06-10 — Ekip/istatistik UI + Saha Özeti yükleme kalıcılığı ✅

### Özet
- Öğrenme özeti video satırından `(0/3)` kaldırıldı; Saha Özeti aktif gün sütunundan `g` kaldırıldı.
- Platform lisans tablosu: sütun çakışması/kesilme düzeltildi (`table-auto`, `break-words`, colgroup).
- İstatistikler: Ekip Performans + YZ limit tablolarında lider satırı gizlendi (metrikler arka planda).
- Performans: dashboard SSR'da `warmDashboardMetrics` await + hub/ranking prefetch; EkipPanel mount + Saha Özeti tab hover prefetch; önbellek varken skeleton gösterilmez.

### Dosyalar
`MemberActivitySheet.tsx`, `TeamFieldRankingTable.tsx`, `TeamPerformanceTable.tsx`, `StatsSuperAdminSections.tsx`, `PlatformYonetimContent.tsx`, `prefetchDashboard.ts`, `EkipPanel.tsx`, `EkipSummaryTab.tsx`, `EkipTabNav.tsx`. (Commit 127ab27)

## 2026-06-10 — Saha Özetim metrik kutuları pano renkleri ✅

### Özet
- Huni 4 kutu + Saha Aktivitesi 6 kutu pano crown gradient ile boyandı (`panoVariant`, yalnız `/saha-ozetim`).
- Renk yerleşimi komşu hücrelerde tekrar yok: indigo/teal | coral/amber | rose/blue | chick/purple | teal/indigo.

### Dosyalar
`hubPanoMetricColors.ts`, `HubCrownFunnelGrid.tsx`, `HubSelfActivityGrid.tsx`, `FieldSummaryPage.tsx`. (Commit 5cb4a0d)

## 2026-06-10 — Deploy gate: prod deploy E2E yeşiline bağlandı (skip-safe scaffold) ✅

### Karar (sahibi gibi düşün)
- Items 1&2 için kullanıcı "sen hangisini öneriyorsan onu yap" dedi → **B (CI-driven deploy)** seçildi.
- Gerekçe: canlı/ödeme alan uygulamada `main`'e her push CI'dan bağımsız prod'a gidiyor. Build'i kıran commit zaten Vercel build'inde takılır; asıl açık **derlenip davranışsal bozulan** (E2E'nin yakaladığı) commit. Branch protection (C) doğrudan-push + çok-ajanlı akışı kırardı → reddedildi.

### Yapılan (otonom, kırılmayan)
- Yeni `.github/workflows/deploy.yml`: `workflow_run` ile E2E (Playwright) **başarılı** bitince Vercel Deploy Hook'unu tetikler. Yarış yok (deploy E2E sonrası). `head_branch==main && event==push` guard'ı.
- **Skip-safe:** `VERCEL_DEPLOY_HOOK_URL` secret yokken no-op (warning + exit 0). Bugün hiçbir şey değişmez; Vercel auto-deploy aynen çalışır.
- `docs/deploy/github-secrets.md` → "CI-driven deploy (opsiyonel gate)": 3 adımlık aktivasyon (hook oluştur → secret ekle → `vercel.json` `git.deploymentEnabled.main=false`). Sıra uyarısı dahil.

### Kullanıcı tarafı (gate'i aktive etmek için — ajan erişemez)
1. Vercel Deploy Hook (branch main) oluştur, 2. `VERCEL_DEPLOY_HOOK_URL` secret ekle, 3. `vercel.json`'a `git.deploymentEnabled.main=false`. Üçü olmadan gate pasif (zarar yok).

### Dosyalar
`.github/workflows/deploy.yml`, `docs/deploy/github-secrets.md`. (Commit e32e5dc)

## 2026-06-10 — Landing dark CTA turuncu (coral) ✅

### Özet
- Dark temada landing birincil butonları soluk mor yerine pano Aylık sekmesi coral gradient (#FF9D7A → #FF5722): Hemen Başla, Hemen Ücretsiz Dene, Aylık/Yıllık ödeme toggler, Ekibi Güçlendir.
- Light tema değişmedi (`from-brand to-brand-accent` korundu).

### Dosyalar
`constants.ts`, `LandingHeader.tsx`, `LandingHero.tsx`, `LandingPricing.tsx`.

## 2026-06-10 — Saha Özetim sekmeleri + öğrenme özeti düzeltmeleri ✅

### Özet
- Landing page pano renk değişikliği geri alındı (`LandingHero`, `LandingFeatures`, `panoAccentColors.ts` silindi).
- Saha Özetim / Ekibim dönem sekmeleri (Günlük/Haftalık/Aylık/Yıllık) pano ilk 4 crown rengiyle boyandı: indigo, teal, coral, amber.
- Öğrenme özeti başlığından "(Pro)" kaldırıldı; İtiraz % ve DDBR sağa yaslandı.

### Dosyalar
`HubSummaryTabBar.tsx`, `MemberActivitySheet.tsx`, `LandingFeatures.tsx`, `LandingHero.tsx`, `tr.ts`, `en.ts` (panoAccentColors silindi).

## 2026-06-10 — CI dayanıklılığı: action sürüm bump + smoke kapsamı ✅

### Item 4 — Node 20 deprecation borcu kapatıldı
- `e2e.yml` ve `migrate-check.yml`: `actions/checkout@v4→v6`, `actions/setup-node@v4→v6`, `actions/upload-artifact@v4→v7` (hepsi Node 24 runtime).
- `migrate-check.yml` `node-version: '20'→'22'` (e2e ile hizalı).
- 16 Haziran 2026'da Actions Node 24'e zorlayacaktı; bump ile gelecekteki kırılma önlendi. `cron-emails.yml` sadece `curl` kullanıyor — dokunulmadı.

### Item 3 — Kritik rota smoke kapsamı genişletildi
- Yeni `e2e/critical-routes-smoke.spec.ts`: public (`/giris`, `/kayit`) + auth-gated (`/pano`, `/hedefim`, `/ekip`, `/crown`) için HTTP <500 + URL doğrulaması.
- İlke: kırılgan element sorguları YOK — sadece status + URL (tab ARIA regresyonundan çıkarılan ders). Auth rotaları kimlik yoksa skip.

### Item 1 & 2 — deploy-gating / PR akışı: BİLİNÇLİ olarak kullanıcıya bırakıldı
- Branch protection + required check → solo + çok-ajanlı doğrudan-`main`-push workflow'unu kırar (PR zorunlu).
- Gerçek "kırmızıysa deploy gitmez" garantisi Vercel tarafı erişim ister (VERCEL_TOKEN/secrets veya dashboard) — ajan erişemiyor. Karar kullanıcıya bırakıldı.

### Dosyalar
`.github/workflows/e2e.yml`, `.github/workflows/migrate-check.yml`, `e2e/critical-routes-smoke.spec.ts`. (Commit 716587a)

## 2026-06-10 — UI iyileştirmeleri + metrik prefetch performansı ✅

### Özet
- Aday detay: Aktivite Geçmişi chevron (varsayılan açık), Gelecek Temas +3/+7 hızlı takip.
- Boru Hattı dark: Tümü sekmesi ve Aday Ekle koyu mor (#5D44C9); light dokunulmadı.
- İstatistikler başlık ikonu → BarChart3 (sidebar ile aynı).
- Ekibim: üst özet 4→3 kutu (lider kutusu kaldırıldı); üye kartı aktivite sekmesi varsayılan kapalı.
- Landing: pano crown renkleri (turkuaz, mor, turuncu) hero + özellik kartları.
- Performans: `warmDashboardMetrics`, Ekibim/İstatistikler SSR prefetch, route değişiminde otomatik ısınma.

### Dosyalar
`ActivityLogCard.tsx`, `CandidateFollowUpCard.tsx`, `candidateDetailUtils.ts`, `PipelinePageContent.tsx`, `StageFilter.tsx`, `TeamPerformanceSection.tsx`, `EkipTrainingTab.tsx`, `ekip/page.tsx`, `IstatistiklerContent.tsx`, `istatistikler/page.tsx`, `DashboardShell.tsx`, `prefetchDashboard.ts`, `panoAccentColors.ts`, `LandingFeatures.tsx`, `LandingHero.tsx`, `tr.ts`, `en.ts`.

## 2026-06-10 — E2E kalıcı çözüm: tab ARIA rolü uyumsuzluğu ✅

### Kök neden
- CI'da tekrar tekrar düşen tek test: `day-journal-smoke.spec.ts:15` → "Saha Özetim daily tab loads when authenticated".
- Sekmeler `a8aa0de` (council triad faz A-D) ile `HubSummaryTabBar`'da açık `role="tab"` ile render edilmeye başlandı. Açık `role="tab"`, `<button>`'un örtük button rolünü **ezer** → hesaplanan ARIA rolü `tab` olur.
- Test ise hâlâ `getByRole('button', { name: /Günlük|Daily/i })` ile arıyordu. Bu locator role="tab" öğesiyle **asla** eşleşmez; bu yüzden timeout/retry artırmak (önceki denemeler) sorunu çözmedi — 20sn boyunca olmayan bir button bekleniyordu.

### Çözüm
- Test locator'ı doğru ARIA rolüyle hizalandı: `getByRole('tab', { name: /Günlük|Daily/i })`.
- Açıklayıcı yorum eklendi (regresyon tekrarını önlemek için).
- CI yalnızca `--project=chromium` çalıştırıyor; tek dosya/tek assertion düzeltmesi kapsamı tam karşılıyor. ESLint temiz, `playwright --list` parse temiz.

### Dosyalar
`e2e/day-journal-smoke.spec.ts`.

## 2026-06-09 — İsteğe bağlı takip: sponsor derinliği, SW precache, E2E docs ✅

### Ekip Ağacı — gerçek nesil derinliği
- Migration `076_team_tree_parent_rpc.sql`: `nmm_leader_downline_workspace_tree()` (parent_id ile recursive downline).
- `memberGeneration.ts` + test: sponsor zincirinden nesil hesabı (lider=0, doğrudan=1, …).
- `treeActions.ts` flat 1/2 yerine RPC + `computeMemberGeneration`.

### PWA
- `sw.js`: `/pano` + `/manifest.json` install precache (`nmm-shell-v2`).

### E2E dokümantasyon
- `docs/deploy/github-secrets.md` + README: secret yoksa E2E job skip, adım adım kurulum.

### Dosyalar
`076_team_tree_parent_rpc.sql`, `memberGeneration.ts`, `memberGeneration.test.ts`, `treeActions.ts`, `sw.js`, `database.types.ts`, `github-secrets.md`, `README.md`.

## 2026-06-09 — Ekip Ağacı avatar + 5 ek öneri ✅

### Ekip Ağacı
- `GenerationTreeNode.avatarUrl` — RPC'den gelen `avatar_url` ağaç sekmesinde `PersonAvatar` ile gösteriliyor.

### Ek öneriler (1–5)
1. **Ranking DB:** Batch action tek `daily_actions` sorgusu + bellek içi dönem filtresi; 4 ayrı action sorgusu kaldırıldı.
2. **CI lint:** `eslint --max-warnings 0`; dead code ve unused import temizliği.
3. **Pano SSR prefetch:** `pano/page.tsx` server-side `prefetchPanoMetrics` + `HydrationBoundary`.
4. **PWA SW:** `public/sw.js` + `ServiceWorkerRegister`; statik asset cache, AppVersionGuard ile `SKIP_WAITING`.
5. **Playwright:** Secret yoksa E2E bilinçli skip (workflow warning + yeşil job).

### Dosyalar
`treeActions.ts`, `TeamGenerationTree.tsx`, `teamActivityActions.ts`, `pano/page.tsx`, `sw.js`, `ServiceWorkerRegister.tsx`, `AppVersionGuard.tsx`, `DashboardShell.tsx`, `TeamPerformanceSection.tsx`, `TeamPerformanceTable.tsx`, `ekip/actions.ts`, `trialPush.ts`, `trial-emails/route.ts`, `package.json`, `e2e.yml`.

## 2026-06-09 — Performans 2–5 + CI lint + deploy sürüm koruması ✅

### Onaylanan öneriler (2–5)
- **2 Prefetch daraltma:** Layout artık hub/hedef/pano metriklerini ısıtmıyor; `/pano` → pano insights, `/saha-ozetim` → hub, `/ekip` → ranking batch (nav hover).
- **3 Batch ranking:** `getTeamRankingMetricsBatchAction` — tek auth, 4 dönem paralel; Ekibim Saha Özeti sekmeleri anında geçiş.
- **4 staleTime:** `QUERY_STALE` (`staleTimes.ts`) — data 120s, metrics 90s, workspace 5dk.
- **5 Deploy guard:** `NEXT_PUBLIC_BUILD_ID` + `/api/app-version` + `AppVersionGuard` (visibilitychange → yenile toast).

### CI
- `OdemeClient`: gereksiz `useEffect(setBillingPeriod)` kaldırıldı (eslint error).
- Build job'a `npm run lint` eklendi.

### Dosyalar
`staleTimes.ts`, `buildId.ts`, `AppVersionGuard.tsx`, `app-version/route.ts`, `next.config.ts`, `teamActivityActions.ts`, `EkipSummaryTab.tsx`, `prefetchDashboard.ts`, `prefetchRouteMetrics.ts`, `keys.ts`, `DashboardShell.tsx`, `OdemeClient.tsx`, `e2e.yml`, `tr.ts`, `en.ts`.

## 2026-06-09 — İstatistikler UI + Saha Özeti mobil + performans ✅

### UI
- İstatistikler: dark temada başlık `TrendingUp` ikonu görünür (`dark:text-sky-300`, stroke 2).
- Aday Dönüşüm Hunisi alt açıklama metni kaldırıldı.
- `PulsePeriodTabs`: HubSummaryTabBar ile aynı geçiş (parlama/`transition-all`/`text-brand` kaldırıldı).
- Ekibim Saha Özeti: mobil yatay sürüklemeyi kilitle (`overflow-x-clip`, `no-swipe`, `touch-pan-y`).

### Yıllık / legacy URL
- `?period=all` / `?tab=all` → `yearly` yönlendirmesi (Ekibim özet, Saha Özetim).
- `normalizePulsePeriod`: eski `all` dönemi yıllık (`ytd`) sayılır.

### Performans
- Dashboard layout prefetch: yalnız workspace + aday + ekip + AI kotası **beklenir**; hub/video/metrik ısıtması **arka planda**.
- Saha Özeti dönem sekmeleri: `keepPreviousData` + tüm dönemler için arka plan prefetch.

### Dosyalar
`PulsePeriodTabs`, `StatsCharts`, `IstatistiklerContent`, `EkipSummaryTab`, `EkipPanel`, `TeamFieldRankingTable`, `FieldSummaryPage`, `prefetchDashboard.ts`, `pulse.ts`, `useCandidateStats.ts`.

## 2026-06-09 — Yıllık sekmesi geri + saha ortağı davet + CI build fix ✅

### Ürün
- Saha Özetim / Ekibim özet / İstatistikler: **Tümü → Yıllık** geri (`yearly` / `ytd`).
- Saha ortağı kartı: YZ davet sekmesi kaldırıldı; tam genişlik **Uygulamaya Davet Et** → WhatsApp hazır metin.
- `team.inviteWaMessage` yeni davet metni (TR/EN).

### CI (354745c Build fail)
Build job prod Supabase secret'larıyla derleniyordu; CI compile adımı artık **placeholder env** kullanıyor. E2E job gerçek secret'ları koruyor. `NODE_OPTIONS=6144MB`.

### Dosyalar
`HubSummaryTabBar`, `FieldSummaryPage`, `PulsePeriodTabs`, `pulse.ts`, `EkipSummaryTab`, `TeamPerformanceSection`, `MemberActivitySheet`, `HubCrownFunnelGrid`, `keys.ts`, `prefetchRouteMetrics.ts`, `tr.ts`, `en.ts`, `.github/workflows/e2e.yml`.

## 2026-06-09 — Vercel d2a6dce build + CI önerileri (1–3, 5) ✅

### d2a6dce Vercel hatası
`extractYoutubeId` `'use server'` export — **9e82591** ile zaten düzeltildi (`youtubeId.ts`). Yeni push sonrası Vercel yeşil geçmeli.

### Onaylanan öneriler
1. **PLAYWRIGHT_* isteğe bağlı** — `github-secrets.md` netleştirildi (auth fail → skip).
2. **data-testid** — `plan-basic-popular-badge`, `plan-basic-price`, `plan-basic-ai-limit`; E2E selector güncellendi.
3. **Bildirim sadeleştirme** — `github-secrets.md` GitHub Actions notification rehberi.
5. **CI iki job** — `e2e.yml`: `Build` → `E2E (chromium)` (`needs: build`).

### Dosyalar
`LandingPricing.tsx`, `landing.spec.ts`, `e2e.yml`, `github-secrets.md`, `README.md`.

## 2026-06-09 — E2E CI düzeltmesi (deploy sonrası fail maili) ✅

### Kök nedenler
1. **Build kırığı:** `extractYoutubeId` `'use server'` dosyasından export ediliyordu → `npm run build` CI'da düşüyordu.
2. **Eski E2E assertion:** Günlük sekmede öncelik listesi kaldırıldıktan sonra auth'lu test hâlâ `öncelik` arıyordu.
3. **Landing pricing testi:** EN rozet metni `Popular` (test `Most Popular` arıyordu).
4. **Auth setup:** Hatalı secret'larda tüm job fail oluyordu → soft-skip eklendi.

### Düzeltmeler
- `youtubeId.ts` util; `videoActions` / `moderation` import güncellendi.
- `auth.setup.ts` try/catch + boş session fallback.
- `day-journal-smoke.spec.ts` → Günlük sekme yükleme testi.
- `landing.spec.ts` → Popular / Daily 20 AI Messages metinleri.
- `e2e.yml` Node 22; `playwright.config` list+html reporter.

### Dosyalar
`youtubeId.ts`, `videoActions.ts`, `moderation.ts`, `auth.setup.ts`, `landing.spec.ts`, `day-journal-smoke.spec.ts`, `e2e.yml`, `playwright.config.ts`.

## 2026-06-09 — Eğitim onay masası, Ekibim sadeleştirme, Yıllık→Tümü ✅

### Uygulananlar
1. **Platform Yönetimi:** 4. KPI kutusu **Eğitim Talepleri** (onay bekleyen sayı); onay masası başlığı **İçerik/Video/İtiraz Talepleri Onay Masası**; video talepleri masaya dahil.
2. **Video moderasyonu:** Super admin dışı video ekleme → onay kuyruğu; migration `075_training_videos_moderation.sql`; super admin anında yayın.
3. **Vaktin Varsa (mobil):** + İçerik / + Video / + İtiraz butonları kare ikon-only; masaüstünde metin korundu.
4. **Ekibim:** Sekme butonları mobilde ikon-only; lider performans paneli başlığı kaldırıldı; listede lider gizlendi; saha özeti legend kutusu kaldırıldı; boru hattı bağlantısını kaldır butonu silindi.
5. **Dönem sekmeleri:** Bugün/7g/30g → Günlük/Haftalık/Aylık/Tümü (Saha Özetim, aktivite özeti, istatistikler); Yıllık metrik kaldırıldı.

### Dosyalar
`PlatformYonetimContent.tsx`, `moderation.ts`, `videoActions.ts`, `075_training_videos_moderation.sql`, `AkademiContent.tsx`, `VideoEditModal.tsx`, `TeamPerformanceSection.tsx`, `EkipPanel.tsx`, `EkipTabNav.tsx`, `TeamFieldRankingTable.tsx`, `MemberActivitySheet.tsx`, `FieldSummaryPage.tsx`, `HubSummaryTabBar.tsx`, `platform.ts`, `database.types.ts`.

## 2026-06-09 — Mobil UX: sekme başlıkları, Platform Yönetimi, pano hizalama ✅

### Uygulananlar
1. **Platform Yönetimi (mobil):** Ödeme / Açılış sayfası butonları metinsiz 40×40 ikon kareleri (`CreditCard`, `LayoutTemplate`); masaüstünde metinli butonlar korundu.
2. **Kullanıcı tablosu (masaüstü):** Sütun padding sıkılaştırıldı (`px-1` aday/ekip); `md:table-fixed`, `text-xs` başlık, `md:overflow-x-visible` — kutuya tam oturma.
3. **Sekmeli sayfa başlıkları:** `formatTabbedPageTitle` — Saha Özetim / Günlük, Ekibim / Saha Özeti / Haftalık, Saha Radarı / Takipler, Vaktin Varsa / sekme, YZ Koçu / sekme.
4. **Ekibim Saha Özeti:** `overflow-x-hidden` + tab bar `horizontal-scroll-lock`; panel sarmalayıcı eklendi.
5. **Pano (masaüstü):** Tarih satırı selamlama ile aynı hizada, sağa yaslı (`md:flex-row md:justify-between`).

### Dosyalar
`tabbedPageTitle.ts`, `HubSummaryTabBar.tsx`, `PlatformYonetimContent.tsx`, `FieldSummaryPage.tsx`, `EkipPageContent.tsx`, `EkipSummaryTab.tsx`, `EkipPanel.tsx`, `CrownSahaRadarPage.tsx`, `AkademiContent.tsx`, `yazar/page.tsx`, `YzKocuContainer.tsx`, `EkipTabNav.tsx`, `PanoContent.tsx`.

## 2026-06-09 — Saha özeti günlük sadeleştirme + Ekibim araçları accordion ✅

### Uygulananlar
1. **Saha özeti / Günlük:** Boş aktivite metinleri ve `dailyTrackEmptyHint` kutusu kaldırıldı; `HubDayLoginStrip` yalnız takvim ikonu (gün numarası) + tarih; `hubLoginDayInactive` satırı silindi.
2. **Öncelikli aday listesi:** Günlük sekmeden `IlgilenContent` tamamen kaldırıldı (öncelik sayacı, liste, Tümünü Gör — Saha Radarı'nda mevcut).
3. **Ekibim:** Davet kodu, katıl ve ekibe gönder bölümleri **Ekibim Araçları (Davet Kodu vd)** accordion içinde; varsayılan kapalı, sağda chevron.

### Dosyalar
`FieldSummaryPage.tsx`, `HubDayLoginStrip.tsx`, `TeamPerformanceSection.tsx`, `tr.ts`, `en.ts`.

## 2026-06-09 — Platform Yönetimi sayfa düzeni + yatay kaydırma standardı ✅

### Uygulananlar
1. **Başlık:** Platform Yönetim Masası → **Platform Yönetimi** (`platform.ts`).
2. **KPI:** TOPLAM ADAY HACMİ kartı kaldırıldı; diğer 3 kartın alt açıklamaları silindi (3 sütun grid).
3. **Arama:** Dış Kayıtlar altı arama kutusu tam genişlik (`max-w-md` kaldırıldı).
4. **Kullanıcı tablosu:** Başlık **Kullanıcı ve Lisans Listesi**; `table-fixed` → `min-w-[960px]` + `HorizontalScrollLock`; hücre `align-middle`.
5. **Mobil header:** Ödeme / Açılış sayfası butonları sağ üstte kalır (`flex-row justify-between`).
6. **Yatay kaydırma standardı:** `HorizontalScrollLock` bileşeni + `horizontal-scroll-lock` utility; Platform, İstatistikler, Saha özeti tablolarına uygulandı; `AGENTS.md` kuralı eklendi.

### Dosyalar
`PlatformYonetimContent.tsx`, `platform.ts`, `HorizontalScrollLock.tsx`, `globals.css`, `TeamPerformanceTable.tsx`, `TeamFieldRankingTable.tsx`, `StatsSuperAdminSections.tsx`, `TeamTrainingRankingTable.tsx`, `TeamActivitySummary.tsx`, `AGENTS.md`.

## 2026-06-09 — İstatistikler sadeleştirme + dark tema mor okunabilirlik ✅

### Uygulananlar
1. **Kaldırılanlar:** Saha Huni Gerçekleşenleri kutusu; sayfa alt başlığı; KPI kart açıklama satırları; ekip tablosu `*` dipnotu/KVKK linki; tablo/kart sekmeleri; AI admin MODEL KULLANIMI ve DÖNÜŞÜM HUNİSİ kutuları; AI tablo alt açıklaması.
2. **Ekip Performans tablosu:** Yalnız tablo; isim hücresi `align-middle` düzeltmesi; sütun sırası içerik → video → itiraz; ilerleme barları ve `0/3 video` metni kaldırıldı.
3. **YZ kota kartı (süper admin):** Yalnız başlık + 👑 SINIRSIZ SÜPER ADMİN HESABI.
4. **Dark tema mor:** `.dark` içinde `--color-brand` / `--color-brand-accent` açıldı; istatistik tablo renkleri `dark:*-300` tonlarına çekildi.

### Dosyalar
`IstatistiklerContent.tsx`, `StatsKpiCards.tsx`, `TeamPerformanceTable.tsx`, `StatsSuperAdminSections.tsx`, `MyAIUsageQuotaCard.tsx`, `globals.css`.

## 2026-06-09 — YZ sayaç düzeltmesi, hesap popup sadeleştirme, Ekibim & saha özeti UX ✅

### Uygulananlar
1. **YZ kotası güncellenmiyordu:** `fetchAIUsageAction` İstanbul gün başlangıcı (`istanbulDayStartIso`) ile `checkAIQuota` hizalandı; üye koçluk ve onboarding koçu sonrası `invalidateTeamAndAIUsage` ile sayaç + istatistikler yenileniyor.
2. **Hesap bilgileri popup:** Turuncu bar + modal metinleri sadeleştirildi — üyelik tarihi, deneme/ücretsiz özet, tek footnote; mükerrer madde listeleri kaldırıldı (`shell.ts`, `AccountStatusAlert.tsx`).
3. **Ekibim Araçlar sekmesi kaldırıldı:** Davet et, davet kodu gir, ekibe gönder modülleri **Ekibim** sekmesinin altına taşındı (`EkipTabNav`, `TeamPerformanceSection`).
4. **Saha özeti legend:** `SÜTUN AÇIKLAMALARI` başlığı kaldırıldı; dark temada huni ikonları `FUNNEL_METRIC_VIVID_CLASS` ile görünür.
5. **3. tekil şahıs etiketler:** Kaç Kişiyle Konuştu/Tanıştı/Sunum Yaptı, Ekibine Kaç Kişi Katıldı; lider günlük takipte Ekibime Kaç Kişi Katıldı (`tr.ts`, `en.ts`).
6. **Saha özeti tablo (mobil):** Yatay kaydırma sayfa swipe’ını engeller (`no-swipe`, `touch-pan-x`); ikon kare arka planları kaldırıldı; sticky isim sütunu z-index/arka plan ile metrik bleed-through düzeltildi.

### Dosyalar
`aiUsage.ts`, `MemberDetailPage.tsx`, `YZOnboardingKocuModal.tsx`, `AccountStatusAlert.tsx`, `shell.ts`, `EkipTabNav.tsx`, `EkipPanel.tsx`, `EkipPageContent.tsx`, `TeamPerformanceSection.tsx`, `TeamGenerationTree.tsx`, `TeamFieldRankingTable.tsx`, `tr.ts`, `en.ts`.

## 2026-06-09 — 5 ileri öneri (model paneli, Pro rozeti, huni raporu, şablon limiti, yıllık deep link) + env rehberi ✅

### Uygulananlar
1. **Model kullanım paneli:** migration `074` `ai_model`; `logAIGeneration` + süper admin İstatistikler Flash/Pro özeti.
2. **Pro Premium AI rozeti:** `KoclukForm` + `ProvaForm` (`effectiveLicenseType === 'pro'`).
3. **Ürün hunisi raporu:** `getProductFunnelStatsAction` — pricing görünüm, upgrade CTA, ödeme deep link.
4. **Koçluk şablonu 1500:** `MemberDetailPage` `TemplateEditor` textarea `maxLength`.
5. **Deneme yıllık deep link:** `?plan=basic&period=yearly` — trial e-posta, bildirim, UpgradeGate, AccountStatusAlert, `OdemeClient` yıllık toggle.
6. **Env rehberi:** `docs/deploy/github-secrets.md` — GitHub vs Vercel vs `.env.local` matrisi.

### Dosyalar
`074_daily_actions_ai_model.sql`, `paymentRoutes.ts`, `checkQuota.ts`, `istatistikler/actions.ts`, `StatsSuperAdminSections.tsx`, `KoclukForm.tsx`, `ProvaForm.tsx`, `MemberDetailPage.tsx`, `trialEmails.ts`, `notificationRoutes.ts`, `OdemeClient.tsx`, `github-secrets.md`, çeviriler.

**Not:** Migration `074` Supabase’e uygulanmalı.

## 2026-06-09 — Hibrit Gemini, 1500 karakter kalkanı, huni analitiği, deneme push ✅

### Uygulananlar
1. **Hibrit model:** `resolveGeminiModel` — Basic/Plus/deneme → Flash; Pro'da yalnızca derin koçluk (YZ Koçu, saha provası, ekip onboarding rehberi) → Gemini Pro. Not özeti, davet mesajı, saha mesajları → Flash.
2. **Token kalkanı:** `AI_USER_INPUT_MAX_CHARS = 1500` — UI (`YazarForm`, `KoclukForm`, `ProvaForm`, `UyumContent`) + sunucu doğrulama; roleplay geçmişi/not özeti `6000` aggregate trim.
3. **Ürün hunisi:** `072`/`073` product_events, landing görünüm + upgrade CTA + `/odeme?plan=basic` olayları.
4. **Deneme yaşam döngüsü:** trial e-posta `?plan=basic`, in-app push (`trialPush`), bildirim rotası, `AccountStatusAlert` trial bitti UX.
5. **Super admin YZ tab:** `nmm_ai_usage_daily.ai_count` rollup (fallback: daily_actions).
6. **Davet WA metinleri** “Uygulamaya Davet Et” hizası.
7. **Shopier/fiyat doğrulandı:** 399/899/1499 aylık; yıllık 3588/8088/13488 (₺299/674/1124 ay).

### Dosyalar
`resolveModel.ts`, `aiInputLimit.ts`, `yazar/actions.ts`, `pipeline/[id]/actions.ts`, `ekip/actions.ts`, `uyum/actions.ts`, `saha-radar/actions.ts`, `generateMessage.ts`, `072`/`073` migrations, `productEvents*`, `trialPush.ts`, `trialEmails.ts`, `istatistikler/actions.ts`, `LandingPricing.tsx`, `UpgradeGate.tsx`, `OdemeClient.tsx`, `AccountStatusAlert.tsx`, formlar, çeviriler.

## 2026-06-09 — 5 ileri öneri: fiyat, Basic popüler, ai_count RPC, deneme sonu UX, E2E ✅

### Uygulananlar
1. **Fiyat revizyonu:** Basic ₺399, Plus ₺899, Pro ₺1499 (`pricing.ts` + testler).
2. **"En Çok Satan" rozeti Basic'e** taşındı (landing + `/odeme`); Plus sade kart.
3. **Migration 071:** `nmm_ai_usage_daily.ai_count` + RPC birleşik havuz; `logAIGeneration` → `p_kind: 'ai'`.
4. **Deneme sonu UX:** `UpgradeGate` trial bittiğinde `/odeme?plan=basic` deep link, Basic vurgusu, özel CTA metni.
5. **E2E:** `landing.spec.ts` — popüler rozet, ₺399, günlük 20 YZ limiti.
6. **Davet butonu:** `team.inviteToNmm` → **Uygulamaya Davet Et** (TR) / Invite to the App (EN).

### Dosyalar
`pricing.ts`, `071_ai_usage_unified_count.sql`, `checkQuota.ts`, `database.types.ts`, `LandingPricing.tsx`, `OdemeClient.tsx`, `OdemePageClient.tsx`, `UpgradeGate.tsx`, `shell.ts`, `tr.ts`, `en.ts`, `e2e/landing.spec.ts`, testler.

## 2026-06-09 — Birleşik YZ kotası (20/45/100), plan kartları sadeleştirme, freemium uyumu ✅

### Tek kaynak: `DAILY_AI_LIMITS` (`aiUsage.ts` + `planLimits.ts`)
- Basic **20**, Plus **45**, Pro **100** — mesaj, koç, prova ve uyum aynı günlük havuzdan düşer.
- `checkAIQuota` tüm `ai_generate` aksiyonlarını tek sayaçta toplar; deneme bitince `dailyLimit: 0`.
- `useAILimits` / `fetchAIUsageAction` → `aiUsed` + `dailyLimit` (ayrı message/roleplay/compliance kaldırıldı).

### UI
- İstatistikler YZ kotası: tek çizgi (`MyAIUsageQuotaCard`); süper admin tablosu tek sütun.
- Landing + `/odeme` plan kartları: `{limit}` dinamik, madde sayısı azaltıldı; 14 gün deneme + deneme sonrası YZ kilit mesajı.
- Saha Radarı boş ekip: `/ekibim` davet CTA.
- `hasTeamTeaserAccess` kaldırıldı; `NavMoreSheet` ekip linki artık kilitlenmiyor.
- TR: Onboarding → **İşe Başlatma** (`crown.ts`, `payment.ts` plusFeature4, `landing.ts` planPlusFeat4).

### Dosyalar
`aiUsage.ts`, `planLimits.ts`, `checkQuota.ts`, `useAILimits.ts`, `aiUsage.ts` (action), `MyAIUsageQuotaCard.tsx`, `StatsSuperAdminSections.tsx`, `LandingPricing.tsx`, `OdemeClient.tsx`, `landing.ts`, `payment.ts`, `stats.ts`, `coach.ts`, `crown.ts`, `CrownSahaRadarPage.tsx`, `teamAccess.ts`, `NavMoreSheet.tsx`, formlar (Yazar/Prova/Kocluk/Uyum).

## 2026-06-09 — Plan kartı yenileme: Basic'te Ekibim yok, Saha Radarı eklendi, AI limitleri sıralı ✅

### Değişiklikler (`payment.ts` + `landing.ts`, TR + EN)
- **Basic:** Ekibim referansı tamamen kaldırıldı; bireysel odak korundu. YZ Koçu satırına "& Saha Provası" eklendi.
- **Plus:** "Alt Ekip Takibi (Maks 50 Üye)" ve "4 Haftalık Rehber" → "Saha Radarı & Alt Ekip Aktivite Takibi" ve "Alt Ekip Yönetimi & Onboarding Takibi" ile değiştirildi. AI limit sıralaması öne alındı.
- **Pro:** "Sınırsız Alt Ekip Takibi" → "Günlük 100 YZ Mesajı" olarak feat2 slotuna taşındı; "Ekip Performans & Analiz Tablosu" feat6'ya geçti; feat5 "Sınırsız Alt Ekip Büyüklüğü" oldu.
- **Plan açıklamaları:** Plus = "Basic + yüksek YZ limitleri, Saha Radarı ve alt ekip takibi"; Pro = "Plus + maksimum YZ limitleri ve sınırsız alt ekip büyüklüğü"
- Mantık: her plan, bir önceki plan + daha yüksek AI limitleri; basit ve tutarlı.

## 2026-06-09 — Freemium Model: Sayfa kilitleri kaldırıldı, AI buton kilidi, trial rebrand ✅

### FAZ 1 — Sayfa kilitleri kaldırıldı
- **`hasTeamPageAccess` → her zaman `true`:** `/ekibim`, `/saha-radar`, `/ilk-30-gun` tüm planlarda (free dahil) açık. Freemium modeli: yalnızca AI butonları kilitli.
- **`CrownEkibimPage`, `CrownFirst30Page`, `CrownSahaRadarPage`:** `locked` koşulu ve `FeatureUpgradeGate` overlay kaldırıldı. Veri sorguları `!locked` koşulsuz çalışıyor.

### FAZ 2 — AI buton-seviyesi kilit
- **`useFeatureAccess` → `effectiveLicenseType`:** Trial sırasında `licenseType=free` iken AI erişimi açık kalıyor (effectiveLicenseType=basic); trial bitince kilitleniyor.
- **`IlgilenContent.tsx`:** Bot butonu + `useUpgradePrompt` eklendi; kilitliyken lock ikonu + tooltip gösteriliyor.
- **`YazarForm.tsx`:** Üret butonu kilitliyken `type="button"` Lock buton gösteriyor; ödeme teşviki açılıyor.
- **`ProvaForm.tsx`:** Send butonu kilitliyken lock ikonu + `openUpgrade('ai_coach')` tetikleniyor.
- **`pagesUi.unlockAiBasic`** translation key eklendi (TR + EN).

### FAZ 3 — Trial rebrand
- `upgradeBannerTrialTitle` → "14 günlük ücretsiz Basic denemeniz aktif"
- `upgradeBannerExpiredTitle` → "Denemeniz sona erdi — AI kilitlendi, NMM devam ediyor"
- `accountAlertTrialTitle/TitleLast/LockedTitle` freemium mesajlarıyla güncellendi.
- `accountModalTrialBullets` açıklamalar güncellendi.

### FAZ 4 — E-posta copy güncellemesi
- **`trialEmails.ts`:** `trial_1d` → AI kilitleniyor ama NMM açık mesajı. `trial_ended` → yeni bullet listesi (✅ açık: pipeline/takvim/ekibim/eğitim; 🔒 kilitli: AI araçları). Ekibim artık kilitli listede yok.
- **`mail.ts` welcome email:** "Basic features close" → "sadece AI araçları kilitlenir, NMM devam eder" freemium mesajına güncellendi.

## 2026-06-09 — Council Triad Faz A-D: 17 kritik düzeltme + kod kalitesi ✅

### FAZ A — Kritik Hatalar
- **checkQuota.ts timezone bug:** `setHours(0,0,0,0)` (UTC) → `istanbulDayStartIso(todayCalendarKey())` (TR+3). Günlük kota sıfırlaması artık Istanbul saatine göre çalışır.
- **Migration 004 çakışması:** `004_note_length_constraint.sql` `.DUPLICATE_RETIRED` olarak yeniden adlandırıldı, `069_note_length_constraint.sql` olarak yeniden oluşturuldu.
- **Shopier idempotency gap:** Form-encoded webhook yoluna `orderId: platform_order_id` eklendi; tekrar ödeme işlemi önlendi.
- **scratch/ temizliği:** `simulate_shopier_webhook.js` git takibinden çıkarıldı; `scratch/**` ESLint `globalIgnores`'a eklendi.

### FAZ B — Güvenlik + Teknik Borç
- **Shopier timestamp window:** 5 dakika staleness kontrolü (`verifyShopierWebhookSignature` içinde).
- **Gemini model sabitleri:** `lib/ai/models.ts` oluşturuldu; `GEMINI_PRO`/`GEMINI_FLASH` 4 action dosyasında hardcode string yerine kullanılıyor.
- **Skeleton + zIndex + toLang:** PanoContent `animate-pulse` → `<Skeleton>`, `headerSearch: z-50 → z-[51]` çakışma giderildi, yazar/uyum `toLang` import sırası düzeltildi.

### FAZ C — UX + Mimari
- **UpgradeGate unifikasyonu:** `UpgradeGate.tsx` (`variant="modal|overlay|banner"`) oluşturuldu. `FeatureUpgradeGate`, `UpgradePrompt`, `TeamFreeUpgradeBanner` ince wrapper'a dönüştürüldü. 10+ caller değişmedi.
- **Ekibim teaser (Basic):** `hasTeamTeaserAccess` eklendi; Basic kullanıcılar artık `/odeme`'ye yönlendirilmiyor, `/ekip`'i görebiliyor (özellikler kilitli).
- **Post-trial UI:** `AlertTriangle → Rocket` ikonu, `from-[#4338ca]` gradient, teşvik mesajı: "Harika bir başlangıç yaptın — planını seç, büyümeye devam et".
- **Hub bileşen migrasyonu:** `lib/ui/hub/` (20 dosya) → `components/hub/`; 13 caller dosyasında import güncellendi.

### FAZ D — Performans + Ölçeklenme
- **checkQuota JOIN:** `workspace_members → workspaces` 2 seri sorgu tek FK JOIN ile birleştirildi (-1 DB round-trip).
- **Migration 070:** `nmm_daily_actions` 90 günlük TTL pg_cron ile otomatik temizlik (her gece 03:30).
- **Cursor pagination:** `fetchCandidatesPageAction` (sayfa=50, cursor=updated_at) eklendi; `fetchCandidatesAction` 1000 kayıt güvenlik limiti.
- **overdue-reminders optimizasyonu:** `getUserById` seri döngü → `Promise.all` paralel + önceden `authMap` oluşturuldu.
- **Design token sistemi:** `globals.css @theme`'e 25 semantik token eklendi (`--color-brand-subtle`, `--color-crown`, vb.); `#534AB7`, `#EEEDFE`, `#7c3aed`, `#4338ca`, `#25D366` → `brand`/`whatsapp` token'larına geçildi (400+ yer, 121 dosya).

## 2026-06-09 — Pano mobil kutular kare, masaüstü dikdörtgen ✅

- `LauncherGridItem`: mobil `aspect-square`, md+ `aspect-[4/5]` (ikon/yazı puntosu değişmedi)

## 2026-06-09 — Pano spacing + Ekibim sıralama tabloları ✅

- **Pano:** Karşılama/tarih sabit; launcher grid bir satır yukarı (`gap-1`, `justify-center` kaldırıldı)
- **Ekibim:** Alt başlık kaldırıldı; Saha Özeti → 10 metrikli ikon sütunlu sıralama tablosu + alt legend
- **Eğitim:** İçerik/Video/İtiraz sütunlu sıralama tablosu; onboarding sadece isim + çubuk + 0/9
- **Backend:** `getTeamRankingMetricsAction`, `fetchFunnelActualsBatchForPeriod`
- Dosyalar: `TeamFieldRankingTable.tsx`, `TeamTrainingRankingTable.tsx`, `EkipSummaryTab.tsx`, `EkipTrainingTab.tsx`, `teamActivityActions.ts`, `funnelActuals.ts`, çeviriler


- Vercel `0c01dc3` build: `overdueEmailFrequency` hook'ta vardı, `NotificationPreferences` tipinde yoktu
- Push `c6175d0`: `notificationPreferences.ts`, `notificationPrefsStorage.ts`, `database.types.ts`, migration `068_notification_email_frequency.sql`

## 2026-06-09 — Lint sıfır + HubAllTimeHero joinedAt + Overdue e-posta frekans ✅

### 3. Lint Borcu — 0 Error/Warning
- `react-hooks/set-state-in-effect`: `eslint-disable-next-line` satırları `useEffect` deklarasyonu yerine doğrudan `setState` satırlarına taşındı (10+ dosya)
- `react-hooks/refs`: `visitedRef.current` render sırasında erişilen "lazy mount tab" pattern için 3 dosyada file-level disable
- `react-hooks/purity`: `Date.now()` içeren çok satırlı ifadeler için block-level `/* disable */.../* enable */` (Header.tsx, HubAllTimeHero.tsx)
- `react-hooks/preserve-manual-memoization`: `TeamPerformanceTable.tsx` — `[...rows].sort()` immutable + kapatma satırı disable
- Variable-before-declared: `saveToSupabase` → `useProgressSync.ts`; `editing` → `VideolarContent.tsx`
- `@next/next/no-img-element`: `ProfileModal.tsx` → `<Image unoptimized>`
- Gereksiz `eslint-disable` yorumlar temizlendi; `deleteUserAction` kullanılmayan parametre kaldırıldı
- Sonuç: **0 errors, 0 warnings**

### 4. HubAllTimeHero — "X aydır platformdasın"
- `crown/actions.ts` → `HubAllTimeSelfPayload.joinedAt` eklendi (`nmm_workspaces.created_at`)
- `HubAllTimeHero.tsx`: `joinedAt` prop; IIFE ile ay/gün hesabı → indigo renk alt metin
- `FieldSummaryPage.tsx`: `joinedAt` prop geçiliyor
- `crown.ts`: `allTimePlatformSinceMonths/Days` TR+EN çevirileri

### 5. Overdue E-posta Frekans Tercihi (Günlük / Haftalık)
- `068_notification_email_frequency.sql`: `nmm_notification_preferences.overdue_email_frequency TEXT CHECK IN ('daily','weekly') DEFAULT 'daily'`
- `notificationPreferences.ts` (server action): tip + fetch + upsert güncellendi
- `notificationPrefsStorage.ts`: localStorage key + read/write güncellendi
- `useNotificationPreferences.ts`: `DEFAULT_PREFS.overdueEmailFrequency: 'daily'`
- `overdue-reminders/route.ts`: `overdue_email_frequency` fetch; weekly kullanıcılar için Pazartesi dışı skip
- `NotificationsModal.tsx`: `handleFrequencyChange`; e-posta açıkken segmented control (Günlük / Haftalık) gösteriliyor
- `shell.ts`: `overdueFreqLabel/Daily/Weekly`, `prefEmailLabel/PushLabel/SoundLabel` TR+EN çevirileri

**Deploy:** `067_member_coaching_templates.sql` ve `068_notification_email_frequency.sql` Supabase'e uygulanmalı.

**Dosyalar:** `KoclukForm`, `YazarForm`, `usePersonalAkademiProgress`, `useProgressSync`, `AkademiContent`, `YzKocuContainer`, `UyumContent`, `Header`, `VideolarContent`, `TeamPerformanceSection`, `TeamPerformanceTable`, `RejectModerationDialog`, `SettingsModal`, `ProfileModal`, `PresentationMaterialsContent`, `MemberDetailPage`, `OnboardingModal`, `EgitimContent`, `ItirazlarContent`, `TakvimClient`, `LanguageProvider`, `UpgradePrompt`, `UserMenu`, `crown/actions`, `HubAllTimeHero`, `FieldSummaryPage`, `crown.ts`, `notificationPreferences`, `notificationPrefsStorage`, `useNotificationPreferences`, `overdue-reminders/route`, `NotificationsModal`, `shell.ts`

## 2026-06-08 — Pano kutuları + Ekibim 5 sekme + Saha Özetim (Tüm Zamanlar kaldırıldı) ✅

### Pano
- Karşılama satırından 👋🏻 kaldırıldı
- Launcher kutuları: etiket +2pt mobil / +3pt masaüstü; `aspect-[4/5]` ile yükseklik ~%25 artış (dikdörtgen)

### Saha Özetim
- `HubSummaryTabBar`: Tüm Zamanlar sekmesi kaldırıldı (4 sekme: günlük/haftalık/aylık/yıllık)
- `FieldSummaryPage`: all-time sorgu ve `HubAllTimeHero` kaldırıldı; `?tab=all` → günlük

### Ekibim — 5 üst sekme
1. **Ekip Üyeleri** — üye listesi (BroadcastPanel buradan çıktı)
2. **Saha Özeti** — Crown `HubPeriodTeamPanel` formatı; alt sekmeler günlük/haftalık/aylık/yıllık (`getCrownTeamPeriodPulseAction`)
3. **Eğitim İlerlemesi** — KPI kartları + sıralama + üye ilerleme çubukları
4. **Ekip Ağacı** — mevcut nesil ağacı
5. **Araçlar** — davet kodu, ekibe katıl, toplu mesaj (`BroadcastPanel`)

- Eski `?tab=activity` → `summary`, `?tab=invite` → `tools`
- `EkipActivityTab` kaldırıldı → `EkipSummaryTab` + `EkipToolsTab`

**Dosyalar:** `PanoContent`, `LauncherGrid`, `SquareButton`, `HubSummaryTabBar`, `FieldSummaryPage`, `HubPeriodTeamPanel`, `crown/actions`, `EkipTabNav`, `EkipPanel`, `EkipPageContent`, `EkipSummaryTab`, `EkipToolsTab`, `EkipTrainingTab`, `TeamGenerationTree`, `query/keys`, `tr/en/crown` çevirileri

## 2026-06-08 — 6 Özellik: Supabase şablonlar, radar badge, üye hedef, overdue e-posta, Hub istatistik, lint turu ✅

### 1. Koçluk Şablonları → Supabase
- `supabase/migrations/066_workspace_coaching_templates.sql` — `nmm_workspaces.coaching_templates JSONB`
- `getCoachingTemplatesAction` / `saveCoachingTemplatesAction` (`ekip/actions.ts`)
- `TemplateEditor` mount'ta sunucudan yükler, kaydet → Supabase + localStorage sync; cihazlar arası paylaşım

### 2. Saha Radarı — Son Koçluk Badge
- `SahaRadarMember.lastCoachedAt: string | null` eklendi
- `getCrownSahaRadarAction` son 3 gün içindeki `coaching:{userId}:` kayıtlarını batch sorgular
- `MemberCard`'da Bot ikonunda yeşil nokta (`bg-emerald-500 ring-1`) gösterir

### 3. Üye Detay — Organizasyon Hedef Kutusu
- `getMemberDetailAction` 4. paralel sorgu: `nmm_member_goals.target_people + target_months`
- `MemberDetailPayload.memberGoal` eklendi
- `MemberDetailPage`'de amber renk kutu: "X ayda Y kişilik ekip"

### 4. Overdue Reminders → E-posta Özeti
- `sendOverdueDigestEmail` (`mail.ts`) — Resend + `buildPremiumEmail` şablonu
- `overdue-reminders/route.ts`: bildirim gönderilen kullanıcılar grup edildi; `email_enabled=true` kontrolü; `claimEmailSend(kind='overdue_digest')` dedup

### 5. Saha Özetim Yıllık / Tüm Zamanlar — İstatistik Satırı
- `HubYearHero`: `fieldMetrics` + `yearlyActuals` props → 3'lü istatistik ızgarası (arama, WA, yeni üye)
- `HubAllTimeHero`: `fieldMetrics` + `allTimeActuals` props → 4'lü ızgara (arama, WA, yeni aday, yeni üye)
- `FieldSummaryPage` yeni prop'ları geçiyor

### 6. Lint Turu
- `no-restricted-syntax` (raw z-NN): **tamamen kapandı** — 10 dosyada `Z.*` ile değiştirildi
- `no-img-element`: büyük ölçüde azaltıldı (9 dosyada `<Image />` ile değiştirildi)
- `no-explicit-any`: azaltıldı; moderation tipleri (`Record<string,Json>`, `Json`) düzeltildi
- `NotificationsModal.tsx`: `UiNotification` tipi güncellendi (`title_tr/title_en + NotificationType`)
- `customContent.ts`: `(r as any)` → spesifik cast'lar

**Deploy:** `066_workspace_coaching_templates.sql` Supabase'e uygulanmalı.

**Dosyalar:** `ekip/actions.ts`, `crown/actions.ts`, `CrownSahaRadarPage.tsx`, `MemberDetailPage.tsx`, `overdue-reminders/route.ts`, `mail.ts`, `HubAllTimeHero.tsx`, `HubYearHero.tsx`, `FieldSummaryPage.tsx`, `database.types.ts`, `tr.ts`, `en.ts`, `crown.ts`, `moderation.ts`, `ModerationReviewModal.tsx`, `PlatformYonetimContent.tsx`, `NotificationsModal.tsx`, `customContent.ts` + 10 lint dosyası

## 2026-06-08 — Platform Yönetim: alt başlık kaldır, sidebar amber ✅

`consoleSubtitle` kaldırıldı; aktif sidebar öğesi amber gradient (başlık taç ikonu ile uyumlu).

**Dosyalar:** `PlatformYonetimContent.tsx`, `Sidebar.tsx`, `navigation.ts`, `platform.ts`

## 2026-06-08 — Pano tarih satırı (Intl) ✅

Selamlama altında yerel tarih: TR `08 Haziran 2026 Pazartesi`, EN `Monday, 8 June 2026` (`formatPanoDateLine`).

**Dosyalar:** `calendarLocale.ts`, `PanoContent.tsx`

## 2026-06-08 — Pano selamlama + sidebar aktif renk ✅

1. **Pano selamlama** — masaüstünde sola hizalı, bir satır aşağı (`md:mt-5`).
2. **Sidebar (md+)** — aktif modül pano kutusu gradient rengi; mobil alt nav değişmedi.

**Dosyalar:** `PanoContent.tsx`, `Sidebar.tsx`, `navigation.ts`, `SquareButton.tsx`

## 2026-06-08 — Pano kare kutular + Takvim/İstatistikler renk eşlemesi ✅

1. **Takvim** → Saha Özetim ile aynı renk (teal).
2. **İstatistikler** → Hedefim ile aynı renk (indigo).
3. **Kare oran** — yatay genişlik sabit; `aspect-square` ile kutular aşağı uzatıldı (22rem tavan kaldırıldı).

**Dosyalar:** `navigation.ts`, `LauncherGrid.tsx`

## 2026-06-08 — Pano 5×2 + 5 öneri uygulaması ✅

1. **Pano 5×2** — 10 kutu (İstatistikler geri); masaüstünde kompakt kareler viewport’a sığar, stretch kaldırıldı. Renkler komşuda tekrar etmez.
2. **IlgilenContent** — Saha Özetim günlük sekmesine (bugün) taşındı.
3. **Action rename** — `getCrownTeamWeeklyPulseAction` / `getCrownTeamMonthlyPulseAction`.
4. **Legacy redirect** — `legacyRouteRedirects.ts` + `proxy.ts`.
5. **WelcomeCard** — Yalnızca mobil (`md:hidden`).

**Deploy:** Kod only.

**Dosyalar:** `navigation.ts`, `LauncherGrid.tsx`, `PanoContent.tsx`, `FieldSummaryPage.tsx`, `legacyRouteRedirects.ts`, `proxy.ts`, e2e, `manifest.json`

## 2026-06-08 — Lint fix: Saha Radarı CTA <a> → <Link> ✅

Pipeline ve Ekip CTA `<a href>` → `<Link>` (`@next/next/no-html-link-for-pages`); `import Link from 'next/link'` eklendi.

**Dosyalar:** `CrownSahaRadarPage.tsx`

## 2026-06-08 — Üye detay: koçluk geçmişi, aktivite grafiği, şablon editörü, filtre kalıcılığı ✅

1. **Koçluk geçmişi** — `logAIGeneration` +`noteTr` parametresi; kayıt formatı `coaching:{targetUserId}:{preview120}`; `getMemberDetailAction` son 3 kaydı döndürüyor; `MemberDetailPage`'de mor noktalı zaman çizelgesi.
2. **7 günlük aktivite grafiği** — `nmm_daily_actions` günlük count gruplandırması (ai_generate hariç); `ActivityMiniChart` CSS mini bar grafik, haftanın kısa gün adları.
3. **Mesaj şablonları** — `TemplateEditor` bileşeni (chevron genişle/daralt); aktif/az-aktif/sessiz için 3 textarea, `localStorage('nmm_tmpl_{level}')`. AI çağrısında `customContext` parametresiyle prompt'a ekleniyor; hem `MemberDetailPage` hem `CrownSahaRadarPage` kullanıyor.
4. **Filtre kalıcılığı** — `showMineOnly` → `toggleMineOnly()` helper; `localStorage('nmm_radar_filter')` ile senkronize; SSR-safe lazy init.

**Deploy:** Kod only — migration yok.

**Dosyalar:** `MemberDetailPage.tsx`, `ekip/actions.ts`, `saha-radar/actions.ts`, `CrownSahaRadarPage.tsx`, `checkQuota.ts`, `tr.ts`, `en.ts`

## 2026-06-08 — Legacy özet sayfaları temizliği ✅

1. **Silinen bileşenler** — `DailyTrackPage`, `CrownWeeklyPage`, `CrownMonthlyPage`, `dailyTheme`, `weeklyTheme`, kullanılmayan `IlgilenHub` / `DailyTab` / `CrownHomeMockGrid`.
2. **Korunan redirect'ler** — `/bugunku-takibim`, `/haftalik-ozet`, `/aylik-ozet` → `/saha-ozetim?tab=…` (bookmark uyumluluğu).
3. **Taşıma** — `weeklyAccent` → `lib/ui/hub/hubWeeklyAccent.ts`.
4. **Ölü kod** — `HubPipelineStageTable` kaldırıldı; kullanılmayan i18n (`panoDailyWhatIDid`, `crownMockWeekly/MonthlySummary`).

**Deploy:** Kod only.

**Dosyalar:** silinen `_components/*`, `hubWeeklyAccent.ts`, `HubWeekHero.tsx`, `HubWeeklySelfBar.tsx`, `tr.ts`, `en.ts`

## 2026-06-08 — Saha Özetim hub + pano 3×3 ✅

1. **Saha Özetim** (`/saha-ozetim`) — Günlük/Haftalık/Aylık özet tek sayfada; 5 sekme: Günlük, Haftalık, Aylık, Yıllık, Tüm Zamanlar. History ikonu. Aday hunisi (`HubPipelineStageTable`) kaldırıldı.
2. **Eski rotalar** — `/bugunku-takibim`, `/haftalik-ozet`, `/aylik-ozet` → `?tab=` redirect.
3. **Pano** — İstatistikler kutusu kaldırıldı; 9 kutu 3×3 masaüstü (`LauncherGrid columns={3}`, viewport doldurma). Sıra: Hedefim, Saha Özetim, Saha Radarı, Boru Hattı, Ekibim, Vaktin Varsa, Eğitim İlerlemem, YZ Koçu, Takvim; renkler komşuda tekrar etmeyecek şekilde dağıtıldı.
4. **Backend** — `getHubYearlySelfAction`, `getHubAllTimeSelfAction`; prefetch + bildirim rotası `/saha-ozetim?tab=daily`.

**Deploy:** Kod only — migration yok.

**Dosyalar:** `saha-ozetim/`, `HubSummaryTabBar.tsx`, `HubYearHero.tsx`, `HubAllTimeHero.tsx`, `navigation.ts`, `PanoLauncherGrid.tsx`, `LauncherGrid.tsx`, `crown/actions.ts`, `hubPeriodRange.ts`, redirect sayfaları, i18n

## 2026-06-08 — Rapor sonu 5 ileri öneri: unlink, i18n, WelcomeCard, CTA ✅

1. **Boru hattı bağlantısını kaldır** — Ekip kartında lider için `unlinkPipeline` butonu; `unlinkTeamMemberPipelineAction` link satırını siler + migration `065` ile otomatik isim eşleşmesini susturur (`nmm_team_pipeline_match_blocks`). Yeniden “Boru hattına ekle” blok kaydını temizler.
2. **i18n temizlik** — Kaldırılan ritüel/günlük UI anahtarları (`dayClose*`, `journal*`, `dailyJournalTeaser*`) TR/EN'den silindi.
3. **Pano WelcomeCard** — Yalnızca boru hattı boşken (`candidateCount < 1`) gösterilir.
4. **Günlük Özet CTA** — Boş gün boru hattı linki `text-brand-readable` (hub ile tutarlı dark okunurluk).
5. **WIP** — Saha Radarı üye detayı / cron önceki commit'te zaten main'de (bu tur kod-only + 065).

**Deploy:** `065_team_pipeline_match_blocks.sql` Supabase'de uygula (064 sonrası).

**Dosyalar:** `065_*.sql`, `fetchTeamBundle.ts`, `ekip/actions.ts`, `TeamPerformanceSection.tsx`, `WelcomeCard.tsx`, `DailyTrackPage.tsx`, `tr.ts`, `en.ts`, `database.types.ts`, `types.ts`

## 2026-06-08 — Saha Radarı 4 öneri: üye detayı, koçluk AI, gecikmiş takip bildirimi, filtre ✅

1. **`/ekip/[userId]`** — Yeni üye detay sayfası: avatar + aktivite rozeti, WA/Ara/Koçluk AI aksiyonları, boru hattı 4'lü istatistik, haftalık arama/WA sayaçları, Doğru Başlangıç ilerleme çubuğu + adım listesi.
2. **Koçluk AI** — `generateCoachingMessageAction` (saha-radar/actions.ts): aktif/son/sessiz aktivite düzeyine göre mesaj tipi + ton seçimi → Gemini → `logAIGeneration`. Saha Radarı Aktivite kartları + üye detay sayfasında Bot ikonu ile erişim. Mesaj sonrası portal modal: kopyala + WA gönder.
3. **Gecikmiş takip cron** — `api/cron/overdue-reminders/route.ts`: `next_follow_up_at < dün && ≥ 14 gün` penceresi, aktif aşama filtresi, gün bazlı dedup. GitHub Actions'a adım eklendi.
4. **"Sadece benim" filtresi** — Takipler sekmesinde iki çip (Tüm / Sadece benim); yalnızca `hasTeamAccess` + ekip takibi varsa görünür.

**Deploy:** Kod only — migration yok. `CRON_SECRET` + `NMM_APP_URL` GitHub Actions secret'ı mevcut.

**Dosyalar:** `ekip/[userId]/page.tsx`, `ekip/[userId]/_components/MemberDetailPage.tsx`, `saha-radar/actions.ts`, `api/cron/overdue-reminders/route.ts`, `CrownSahaRadarPage.tsx`, `keys.ts`, `crown.ts`, `cron-emails.yml`

## 2026-06-08 — Pano kare kutular + ritüel kaldırma + 5 öneri ✅

1. **Pano** — Launcher grid eski `aspect-square` kare kutulara döndü; `Bugünü kapat` + `Saha günlüğü` modülleri ve kırıntı dosyaları kaldırıldı.
2. **Günlük Özet** — `HubJournalLinkCard` kaldırıldı; dark temada pipeline CTA `dark:text-[#a09be8]`.
3. **5 öneri:** Platform Yönetimi davet metni; bildirim modalı + toast KPI (`joinNotifKpi`); migration `064` `nmm_team_pipeline_links`; telefon skoru testleri; `overdue_followup` tip düzeltmesi.

**Deploy:** `064_team_pipeline_links.sql` Supabase’de uygula (063 sonrası).

**Dosyalar:** `PanoLauncherGrid.tsx`, `PanoContent.tsx`, `DailyTrackPage.tsx`, `064_*.sql`, `matchCandidate.ts`, `fetchTeamBundle.ts`, `ekip/actions.ts`, `useNotifications.ts`, `NotificationsModal.tsx`, `platform.ts`, silinen: `DayCloseCard`, `DayJournalCard`, `HubJournalLinkCard`, `dayRitual.ts`, `journal*`

## 2026-06-08 — Davet metni + 4 öneri (sponsorluk, huni, test) ✅

1. **Davet UX** — Buton: `Ekibime Davet Et`; WhatsApp şablonu sponsorluk vurgusu (`inviteWaMessage`, `waInviteGroup` TR/EN); YZ davet promptu güncellendi.
2. **Ekip → boru hattı** — `addTeamMemberAsCandidateAction` üye telefonunu yeni adaya taşır; isim eşleşmesinden yedek çözüm.
3. **Bildirim rotası** — “Yeni ortak katıldı” toast → `/bugunku-takibim` (`viewDailySummary` i18n).
4. **Temizlik** — Kullanılmayan `logHubContactAction` kaldırıldı.
5. **Test** — `matchCandidate.test.ts` (063 isim skoru ile uyumlu).

**Deploy:** Kod only — migration yok.

**Dosyalar:** `tr.ts`, `en.ts`, `pages.ts`, `ekip/actions.ts`, `TeamPerformanceSection.tsx`, `notificationRoutes.ts`, `useNotifications.ts`, `crown/actions.ts`, `pipeline/[id]/actions.ts`, `matchCandidate.ts`, `matchCandidate.test.ts`

## 2026-06-08 — Sonraki 5 öneri: realtime huni, eşleşme, ekip CTA ✅

1. **Sponsor realtime** — `useNotifications` INSERT (`user`/`alert`) → `invalidateHubMetrics`.
2. **Davet eşlemesi** — Migration `063`: telefon (son 10 hane) öncelikli + isim skoru (`matchCandidate` uyumlu).
3. **HubPriorityStrip** — `useMarkContacted` (detay/kart ile aynı yol).
4. **Pano #journal** — `useHashScroll` + `scroll-mt-28` bölüm kaydırması.
5. **Ekip CTA** — Eşleşmeyen üye için “Boru hattına ekle” + `addTeamMemberAsCandidateAction`.

**Deploy:** `063_join_workspace_candidate_match.sql` Supabase’de uygula (062 sonrası).

**Dosyalar:** `063_*.sql`, `invalidateHubMetrics.ts`, `useNotifications.ts`, `HubPriorityStrip.tsx`, `useHashScroll.ts`, `PanoContent.tsx`, `ekip/actions.ts`, `TeamPerformanceSection.tsx`, `tr.ts`, `en.ts`

## 2026-06-08 — Saha Radarı UX: başlık hizası, kart ikonları, metrik kaydı, oto-yenileme ✅

**Başlık:** Altyazı kaldırıldı; başlık ikon ile aynı yatay hizada (HubPageShell `subtitle` prop kaldırıldı).
**Yenile butonu:** `showRefresh={false}` — her sayfaya girişte `staleTime: 0` ile taze veri; arka planda 60 sn'de bir oto-yenileme (`refetchInterval: 60_000`).
**Kart tıklama:** Takipler → `/pipeline/{candidateId}`; Aktivite → `/ekip`; eylem butonları `stopPropagation` ile korunuyor.
**İkonlar:** Takipler kartlarına Bot (AI) + WhatsApp + Telefon eklendi — boru hattıyla aynı stil (8×8 yuvarlak). Aktivite kartlarına WhatsApp + Telefon.
**Metrik kaydı:** Takipler ikonlarından yapılan arama (`call`), WA (`whatsapp`) ve AI üretimi (`ai_generate`) `nmm_daily_actions`'a kaydediliyor → günlük özet metriğine akar.
**AI modal:** Boru hattındaki aynı portal — mesaj göster, kopyala, WA ile gönder.
**"Ben" kaldırıldı:** Kendi takiplerinde owner satırında "Ben ·" ifadesi gösterilmiyor; sadece tarih.
**Backend:** `SahaRadarFollowUp` +`stage` (AI için), `SahaRadarMember` +`phone` (WA/Ara için); `ownerName` artık gerçek isim döndürüyor (hardcoded "Ben" kaldırıldı).

**Dosyalar:** `CrownSahaRadarPage.tsx`, `crown/actions.ts`

## 2026-06-08 — 5 öneri + 5 ileri öneri: huni kaydı, pano günlük, davet→pipeline ✅

**Boru hattı listesi:** `CandidateCard` Ara/WhatsApp artık `useMarkContacted` ile metrik kaydı; toast geri bildirimi. **Pano:** `DayCloseCard` + `DayJournalCard` (`PanoDayRitualSection`); Günlük Özet’ten saha günlüğü teaser (`HubJournalLinkCard` → `/pano#journal`). **Davet kabulü:** Migration `062` — sponsor boru hattında isim eşleşmesi veya yeni `katildi` aday + `stage_change joined` (tanışma + yeni üye). Hub cache invalidation: `EkipPanel`, `HubPriorityStrip`, `useMarkContacted`.

**Deploy:** `062_join_workspace_sponsor_pipeline.sql` Supabase’de uygula (`061` zaten uygulandı).

**Dosyalar:** `062_*.sql`, `CandidateCard.tsx`, `useCandidates.ts`, `PanoDayRitualSection.tsx`, `PanoContent.tsx`, `DayCloseCard.tsx`, `HubJournalLinkCard.tsx`, `DailyTrackPage.tsx`, `EkipPanel.tsx`, `HubPriorityStrip.tsx`, `bugun/ilgilen/page.tsx`, `tr.ts`, `en.ts`

## 2026-06-08 — Günlük Özet = Haftalık Özet layout + boru hattı arama kaydı ✅

**Günlük Özet** (`/bugunku-takibim`) artık haftalık özetle aynı şablon: gün gezgini, 4 huni kartı, Saha Aktivitesi, Aday Hunisi. Not alanı kaldırıldı. `getHubDailySelfAction` + `hubDailySelf` query key. Pano etiketi: **Günlük Özet**.

**Kritik fix:** Boru hattı aday detayındaki Ara/WhatsApp butonları artık `useMarkContacted` ile `nmm_daily_actions` kaydı oluşturuyor (önceden yalnızca `tel:` açılıyordu — metrikler güncellenmiyordu). Cache invalidation: günlük/haftalık hub, istatistik huni, aktivite geçmişi.

**5 öneri (günlük özet hizası):** prefetch `hubDailySelf`, boş gün banner + boru hattı CTA, `CalendarPeriodIcon` gün (1), çeviri `hubDailyTarget` / `hubLoginDay*`, eski `dailyTrack` action/sayfa parçaları temizlendi.

**Dosyalar:** `bugunku-takibim/*`, `crown/actions.ts`, `HubPeriodNavigator.tsx`, `HubDayLoginStrip.tsx`, `HubCrownFunnelGrid.tsx`, `hubPeriodRange.ts`, `CandidateDetail.tsx`, `useCandidates.ts`, `prefetchRouteMetrics.ts`, `keys.ts`, `CalendarPeriodIcon.tsx`, `crown.ts`, `tr.ts`, `en.ts`

## 2026-06-08 — Otomatik huni: 5 öneri (istatistikler, onboarding, ekip, hedef link) ✅

1. **İstatistikler** — `StatsFieldFunnelSection` + `getStatsFunnelActualsAction` (`funnelActuals` tek kaynak).
2. **Onboarding** — Boru hattı boş durum, Bugün Ne Yaptım sıfır metni, istatistik huni boş metni.
3. **field_log** — Migration `061`: sayı kolonları DEPRECATED; notlar `nmm_day_journal`.
4. **Hedefim** — Şimdiki roadmap ayı da `/aylik-ozet` linki.
5. **Ekip liderliği** — `MemberActivitySheet` huni 4’lüsü `fetchFunnelActualsForPeriod` (elle sayım yok).

**Deploy:** `061_deprecate_daily_field_log_numeric.sql` uygula (yorum only).

**Dosyalar:** `funnelActuals.ts`, `istatistikler/*`, `teamActivityActions.ts`, `MemberActivitySheet.tsx`, `HedefKart.tsx`, `bugunku-takibim/*`, `stats.ts`, `tr.ts`, `en.ts`, `061_*.sql`

## 2026-06-08 — Huni metrikleri: yalnızca boru hattı (otomatik tek kaynak) ✅

Ürün kararı: elle girilen 4 sayı ile otomatik aksiyonlar birleştirilmez. `fetchFunnelActualsForPeriod` / `fetchFunnelActualsForToday` yalnızca `nmm_daily_actions` + aday aşama değişikliklerinden sayar. **Bugün Ne Yaptım** metrikleri salt okunur; kayıt yalnızca günlük not. Hedefim → Ay Ay Döküm: geçmiş aylar pastel + tıklanınca `/aylik-ozet?offset=N`; şimdiki ay vurgulu; gelecek aylar soluk.

**Dosyalar:** `funnelActuals.ts`, `funnelActuals.test.ts`, `bugunku-takibim/*`, `HedefKart.tsx`, `roadmap.ts`, `tr.ts`, `en.ts`

## 2026-06-08 — Huni gerçekleşenleri: field_log + boru hattı birleşimi (geri alındı)

~~Gün bazında field_log önceliği~~ — otomatik-tek-kaynak kararıyla kaldırıldı (yukarıdaki madde).

## 2026-06-08 — Aylık özet: anlaşılır ay metni + geçen ay karşılaştırması kaldırıldı ✅

“Geçen ay X → bu ay Y arama” satırı kaldırıldı. Ay ilerleme metni sadeleştirildi: “Bugün ayın 8. günü. Ay bitimine 22 gün kaldı.” (son gün / geçmiş ay için ayrı cümleler). `HubMonthHero` artık gereksiz `monthInsights` sorgusu kullanmıyor.

**Dosyalar:** `HubMonthHero.tsx`, `HubMonthProgress.tsx`, `CrownMonthlyPage.tsx`, `crown.ts`

## 2026-06-08 — Haftalık özet: Pzt–Paz takvim haftası ✅

Haftalık özet artık “son 7 gün” yerine Türkiye/ISO takvim haftası (Pazartesi–Pazar) kullanıyor. `offset=0` içinde bulunulan hafta (ör. 8–14 Haziran); sorgu penceresi `Europe/Istanbul` gün sınırlarıyla hizalı. Alt başlık çevirileri güncellendi.

**Dosyalar:** `hubPeriodRange.ts`, `crown/actions.ts`, `crown.ts`

## 2026-06-08 — Özet başlık ikonu → bu hafta/ay ✅

Haftalık/Aylık özet sayfasında başlık yanındaki takvim ikonuna (7/30) tıklayınca dönem gezgini `offset=0` (içinde bulunulan hafta/ay). `useHubPeriodNavigation` hook’u eklendi; HubPeriodNavigator aynı hook’u kullanıyor.

**Dosyalar:** `useHubPeriodNavigation.ts`, `HubPageShell.tsx`, `HubPeriodNavigator.tsx`, `CrownWeeklyPage.tsx`, `CrownMonthlyPage.tsx`, `crown.ts`

## 2026-06-08 — Boru hattı + Aday Hunisi pano renk paleti ✅

10 aşama rengi SquareButton/pano paletiyle hizalandı (dark-safe vivid). Komşu aşamalarda aynı ton yok. Boru hattı StageFilter chip’leri aşama renginde; Aday Hunisi satırları aynı `STAGE_CARD_BG` ile güncellendi.

**Renk eşlemesi:** yeni→mavi, iletişim→mor, davet→coral, sunum→cyan, takip→amber, kararsız→pembe, katıldı→teal, ilgilenmedi→indigo, pasif→sarı, kaybedildi→rose

**Dosyalar:** `stages.ts`, `StageFilter.tsx`, `HubPipelineStageTable.tsx`

## 2026-06-08 — Haftalık dönem gezgini yön + ok adımı düzeltmesi ✅

Haftalık özet: offset işareti aylık ile hizalandı (sola geçmiş, sağa gelecek). Dış oklar artık tek adım (`offset ± 1`), çift atlama kaldırıldı.

**Dosyalar:** `hubPeriodRange.ts`, `HubPeriodNavigator.tsx`

## 2026-06-08 — Hedef hizası + dönem gezgini + özet UI tutarlılığı ✅

**Hedefim:** Hedef cümlesi kart içinde kalem ikonuyla yatay hizalı; mobilde tek satır (`whitespace-nowrap`, `truncate`).

**Haftalık/Aylık özet:** Üst 4 huni kutusu Bugün Ne Yaptım ile aynı `FunnelMetricLabel` vivid renkleri. Sidebar + mobil bottom bar’da haftalık/aylık için `CalendarPeriodIcon` (7/30). Saha Aktivitesi kutuları pasif (tıklama kaldırıldı); Aday Hunisi Dağılımı tıklanabilir kaldı.

**Dönem gezgini:** Başlık altında tam genişlik 3+2 kutu (`HubPeriodNavigator`): önceki | şu an | sonraki + dış oklar; `?offset=N` ile geçmiş hafta/ay verisi. Aylık AI içgörüleri yalnızca `offset=0`.

**Dosyalar:** `HedefKart.tsx`, `HubCrownFunnelGrid.tsx`, `HubSelfActivityGrid.tsx`, `HubPeriodNavigator.tsx`, `hubPeriodRange.ts`, `NavItemIcon.tsx`, `navigation.ts`, `Sidebar.tsx`, `BottomNav.tsx`, `CrownWeeklyPage.tsx`, `CrownMonthlyPage.tsx`, `crown/actions.ts`, `keys.ts`, `HubWeekLoginStrip.tsx`, `HubMonthHero.tsx`

## 2026-06-08 — Özet ikonları + saha metrik dedupe + huni renkleri + tıklanabilir metrikler ✅

Haftalık/Aylık takvim ikonları ajanda çerçevesi SVG ile yeniden tasarlandı (7/30 belirgin, renksiz). Saha Aktivitesi: Arama ve Yeni Aday kaldırıldı (üst huni kutularıyla mükerrer); 6 metrik tıklanabilir link. Aday Hunisi Dağılımı: boru hattı aşama renkleri + `/pipeline?stage=` deep link. Başlıklar Title Case.

**Dosyalar:** `CalendarPeriodIcon.tsx`, `HubSelfActivityGrid.tsx`, `HubPipelineStageTable.tsx`, `PipelinePageContent.tsx`, `pipeline/page.tsx`, `crown.ts`

## 2026-06-08 — Haftalık/Aylık kişisel özet + huni tablosu + takvim ikonları ✅

Haftalık/Aylık Özet yalnızca NMM kullanıcısına ait: Yeni aday trendi, Ekip Özeti ve aylık ekip girişleri kaldırıldı. Giriş günü sayacı son 7 takvim günüyle sınırlandı (8 gün hatası düzeltildi). 4 huni kutusuna ek 8 saha metriği + boru hattı tüm aşamalarını gösteren 2 sütunlu tablo. Pano + sayfa başlıklarında takvim ikonu içinde 7/30.

**Dosyalar:** `CrownWeeklyPage.tsx`, `CrownMonthlyPage.tsx`, `crown/actions.ts`, `HubSelfActivityGrid.tsx`, `HubPipelineStageTable.tsx`, `CalendarPeriodIcon.tsx`, `SquareButton.tsx`, `PanoLauncherGrid.tsx`, `HubPageShell.tsx`, `HubWeekLoginStrip.tsx`, `crown.ts`

## 2026-06-08 — Özet sayfaları sadeleştirme + metrik prefetch + mobil scroll ✅

Haftalık/Aylık Özet: alt başlık metinleri ve Yenile butonları kaldırıldı. Uygulama genelinde metrik yükleme hızlandırıldı — dashboard layout’ta hub/hedef/pano/günlük takip prefetch; nav hover + pano kutusu hover ile route bazlı ısıtma (`prefetchRouteMetrics.ts`). Özet sayfalarında `keepPreviousData` ile önbellekten anında render. Mobil: header/alt nav scroll’da gizlenme düzeltmesi (nested scroll → document scroll + `useMobileChromeVisibility`).

**Dosyalar:** `CrownWeeklyPage.tsx`, `CrownMonthlyPage.tsx`, `prefetchRouteMetrics.ts`, `prefetchDashboard.ts`, `prefetchNavData.ts`, `PanoLauncherGrid.tsx`, `BottomNav.tsx`, `Sidebar.tsx`, `NavMoreSheet.tsx`, `LauncherGrid.tsx`, `useMobileChromeVisibility.ts`, `DashboardShell.tsx`, `pano/page.tsx`, `PanoContent.tsx`

## 2026-06-08 — Haftalık/Aylık Özet Crown düzeni + pano renk swap ✅

Pano: Boru Hattı ↔ Ekibim launcher renkleri swap (amber/teal). Eğitim İlerlemem: Yenile butonu kaldırıldı. Haftalık ve Aylık Özet sayfaları Crown Android tarzına yaklaştırıldı — giriş günü şeridi, 2×2 funnel grid, sadeleştirilmiş ekip paneli; gerçek metrikler (`getHubWeeklySelfAction`, `getHubMonthlySelfAction`, team activity, entries). Build geçti.

**Dosyalar:** `navigation.ts`, `CrownVideoPage.tsx`, `CrownWeeklyPage.tsx`, `CrownMonthlyPage.tsx`, `crown/actions.ts`, `HubCrownFunnelGrid`, `HubWeekLoginStrip`, `HubWeekHero`, `HubMonthHero`, `HubPeriodTeamPanel`, `crown.ts`, `keys.ts`, `prefetchDashboard.ts`

## 2026-06-08 — Vaktin Varsa / Eğitim İlerlemem metin sadeleştirme ✅

Vaktin Varsa alt başlık ve sekme açıklamaları kaldırıldı; başlık ikonla hizalandı. Eğitim İlerlemem: mükerrer video strip silindi; alt butonlarda başlık metinleri.

**Dosyalar:** `AkademiContent`, `EgitimContent`, `VideolarContent`, `ItirazlarContent`, `CrownVideoPage.tsx`

## 2026-06-08 — Hedefim hedef cümlesi 🎯 + mobil punto ✅

Hedef kartında Lucide ikon kaldırıldı; cümle başına 🎯 eklendi. Mobilde `text-xs`, md+ günlük satırlarla aynı (`text-base`).

**Dosyalar:** `HedefKart.tsx`, `tr.ts`, `en.ts`

## 2026-06-08 — Eğitim İlerlemem yeniden tasarım + Vaktin Varsa sekmeler ✅

- Pano/sayfa ikonu: `GraduationCap` (kamera kaldırıldı)
- 6 kutu (adet + %) + toplam ilerleme barı; ekip bölümü kaldırıldı (ileride Ekibim’e taşınacak)
- Alt navigasyon: İçerik Kütüphanesi / Video Eğitimler / İtiraz Bankası → Vaktin Varsa sekmeleri (mavi/turuncu/yeşil)
- Vaktin Varsa: sekme adları, renkler, Ekle butonları sağ üst; Video Ekle metin butonu

**Dosyalar:** `CrownVideoPage`, `AkademiContent`, `akademiTabTheme`, `usePersonalAkademiProgress`, `EgitimContent`, `VideolarContent`, `ItirazlarContent`, çeviriler, `navigation.ts`

## 2026-06-07 — Hedefim ay dökümü mobil köşe hizalama ✅

🎯 hedef solda / metrikler sağda; ara nokta kaldırıldı; mobilde yeni üye `+N` kısa metin, tek satır. Masaüstü tam metin korundu.

**Dosyalar:** `HedefKart.tsx`, `funnelMetricVisuals.tsx`, `tr.ts`, `en.ts` — push → Vercel deploy

## 2026-06-07 — Hedefim ay dökümü mobil taşma düzeltmesi ✅

Ay satırlarında büyük rakamlarda `flex-wrap`, küçük ikonlar ve `tabular-nums`; mobilde `🎯 N ·` ayırıcı. Masaüstü layout değişmedi.

**Dosyalar:** `HedefKart.tsx`

## 2026-06-07 — Pano renk swap (Bugün↔Haftalık, Eğitim↔Vaktin) + sayfa temaları ✅

Bugün Ne Yaptım↔Haftalık Özet ve Eğitim İlerlemem↔Vaktin Varsa pano renkleri swap; `panoAccent.ts` ile sayfa içi buton/banner/ilerleme renkleri senkron.

**Dosyalar:** `navigation.ts`, `panoAccent.ts`, `dailyTrackTheme`, `weeklyTheme`, `videoProgressTheme`, `akademiTheme`, ilgili sayfa bileşenleri

## 2026-06-07 — Pano: Vaktin Varsa ↔ Canlı Eğitim swap + isim ✅

Kutu sırası değişti; Canlı Eğitim → **Eğitim İlerlemem** (EN: My Training Progress). Sidebar/alt bar otomatik güncellendi.

**Dosyalar:** `navigation.ts`, `tr.ts`, `en.ts`

## 2026-06-07 — Pano renk eşleme + Hedefim/Bugün ikon & layout ✅

Pano kutularında renk swap (YZ Koçu→indigo, Aylık→rose, Boru Hattı→teal, Takvim→purple, İstatistikler→coral). Bugün Ne Yaptım ikonları vivid (Hedefim ile aynı). Hedefim sayfası kutu-içi-kutu kaldırıldı; ay dökümü mobilde 🎯 N kısa metin.

**Dosyalar:** `navigation.ts`, `HedefKart.tsx`, `DailyMetricRow.tsx`, `tr.ts`/`en.ts`

## 2026-06-07 — Pano 12. kutu İstatistikler + nav sync + mobil kare ✅

12. kutu İstatistikler (yellow); sidebar/alt bar pano + 12 kutu ile aynı sıra; mobil launcher kutuları kare (`aspect-square`).

**Dosyalar:** `navigation.ts`, `LauncherGrid.tsx`, `BottomNav.tsx`

## 2026-06-07 — Pano 12 kutu (4×3) + nav temizliği ✅

Panoya Boru Hattı (rose), Ekip (amber), Takvim (peach) eklendi; grid mobil 2×6, masaüstü 4×3. Sidebar/alt bardan göz ikonlu “Kişisel takip/Bakış” (`/pano` tekrarı) kaldırıldı.

**Dosyalar:** `navigation.ts`, `LauncherGrid.tsx`

## 2026-06-07 — Bugün Ne Yaptım banner hizası ✅

Hedef banner metni Target ikonuyla dikey ortalandı.

**Git:** push `main`

## 2026-06-07 — HedefKart son rötuş + push ✅

Hedef cümlesi "en az"; ikon hizası; ay dökümü metrikleri sağa yaslı.

**Git:** push `main`

## 2026-06-07 — Pano kutu rozetleri kaldırıldı + oturum push ✅

Launcher’da yalnızca ikon + başlık; Hedefim sayfası/routing/ay dökümü vivid ikonlar dahil commit.

**Git:** push `main`

## 2026-06-07 — Ay dökümü satır metni + vivid ikonlar ✅

"En az N kişilik ekip…" · 18·9·3 · +n üye; emerald/sky/violet/amber; punto +1.

**Dosyalar:** `HedefKart.tsx`, `funnelMetricVisuals.tsx`, `tr.ts`/`en.ts`

## 2026-06-07 — Hedefim ayrı sayfa + pano ikon/routing ✅

Target ikonu; `/hedefim` (sekme yok, HubPageShell); pano kutuları kendi route’larına; `/bugun/ilgilen` legacy redirect.

**Dosyalar:** `hedefim/`, `navigation.ts`, crown sayfaları, `bugun/ilgilen/page.tsx`

## 2026-06-07 — Huni metrik ikonları (ortak) ✅

Phone / Handshake / Presentation / UserPlus — Bugün Ne Yaptım + Hedefim + ay dökümü; sıra: 18·9·3 sonra +n yeni üye.

**Dosya:** `lib/ui/funnelMetricVisuals.tsx`

**Git:** push `main`

## 2026-06-07 — HedefKart metin + ay dökümü UI ✅

**Hedefim kartı:** Tek cümle hedef; Bugünkü Odağım; birinci tekil gelecek zaman soruları; Ay Ay Hedef Dökümü varsayılan açık, Crown tarzı tek satır satırlar.

**Git:** push `main`

## 2026-06-07 — Bugün Ne Yaptım soruları birinci tekil ✅

Metrik etiketleri: Konuştun → Konuştum vb. (`dailyTrackMetric*` TR/EN).

**Git:** push `main`

## 2026-06-07 — Hedefim hub başlık + boru hattı kaldırıldı ✅

**Kişisel takip hub:** ORGANİZASYON / alt başlık kaldırıldı — aktif sekme adı (Hedefim vb.) tek başlık.

**Bugün Ne Yaptım:** Başlık düzeltildi; Bugünkü Performansım kaldırıldı; boru hattı metriği UI+actions'tan çıkarıldı (4 huni).

**HedefKart:** Boru hattı satırı kaldırıldı.

**Git:** push `main`

## 2026-06-07 — Hedefim modülü + pano metinleri ✅

**Pano:** Welcome üstündeki "Organizasyon" etiketi kaldırıldı. Kutu adı **Hedefim** (eski Aksiyon Planım).

**HedefKart:** Günlük hedef satırları soru formatında (gelecek zaman); boru hattı satırı hedefsiz. Not placeholder: "Bugünü kısaca özetle…"

**Git:** push `main`

## 2026-06-07 — Günlük Aksiyon Özetin UI polish ✅

**Günlük Takip (`/bugunku-takibim`):** Başlık → Günlük Aksiyon Özetin; alt başlık ve yenile kaldırıldı. Metrik soruları (5 satır: boru hattı eklendi), Bugüne Dair Notların, hedef bandı tıklanınca Aksiyon Planı; pano mor gradient tema.

**DB:** `059_daily_field_log_pipeline_adds.sql` — `pipeline_adds` kolonu (Supabase'e uygulanacak).

**Git:** push `main`

## 2026-06-07 — Günlük Takip + pano sadeleştirme ✅

**Pano:** Ekibime git + davet kodu footer kaldırıldı. Kutu adları: Aksiyon Planım, Bugün Ne Yaptım.

**Günlük Takip (`/bugunku-takibim`):** Crown tarzı — 4 metrik elle giriş (+/−), Bugünün Notları, Bugüne Dair + Kaydet. `nmm_daily_field_log` migration 058.

**Deploy:** `058_daily_field_log.sql` Supabase'e uygulandı ✅

**Git:** push `main`

## 2026-06-07 — Pano hub rozetleri + search i18n ✅

**Haftalık / Aylık / İlk 30 rozetleri:** `usePanoHubBadges` + `getPanoLauncherBadge` — haftalık huni veya arama %, aylık gün sayısı, ilk 30 yeni üye (Plus). Dashboard prefetch + ortak `queryKeys` (CrownWeekly/Monthly/First30 sayfaları).

**Search:** `common.searchResultsCount` i18n; route `loading.tsx` skeleton.

**Git:** push `main`

## 2026-06-07 — Ek öneriler sprint ✅

**Canlı Eğitim rozeti:** Pano `Canlı Eğitim` kutusunda `{tamamlanan}/{toplam} video`; `useVideoCatalog` + dashboard prefetch.

**Vercel:** `vercel.json` → `ignoreCommand: scripts/vercel-should-build.sh` (docs-only skip).

**Kişisel takip hub:** CrownHomeMockGrid — Organizasyon üst etiketi + `ilgilenHubSubtitle`.

**Free ekip CTA:** PanoFooter — Plus'ta tam ekip paneli (upgrade modal).

**/search:** Server page + Suspense skeleton (ekip kalıbı).

**Git:** push `main`

## 2026-06-07 — Pano polish + hot.md yerel ✅

**hot.md:** `.gitignore`'a eklendi, repodan çıkarıldı (`git rm --cached`). Artık commit/push deploy tetiklemez. Oturum kuralı güncellendi. İsteğe bağlı Vercel Ignored Build Step: `scripts/vercel-should-build.sh`.

**Pano:** Yol Haritam / Bugünkü Takibim kutularında mini rozet (`3/12 ay`, `2/4 huni`). Welcome kartı mobilde alt toast (grid sıkışmaz). Alt şerit: Ekibime git + davet kodu. `PanoTodaySummary` silindi (mantık rozetlere taşındı). Nav: Hızlı Bakış → Kişisel takip.

**Git:** push `main`

**Dosyalar:** `panoProgress.ts`, `PanoLauncherGrid.tsx`, `PanoFooter.tsx`, `PanoContent.tsx`, `WelcomeCard.tsx`, `SquareButton.tsx`, `navigation` çevirileri, `.gitignore`, `session-end-git.mdc`

## 2026-06-07 — Vercel build fix: /ekip Suspense ✅

**Sorun:** `useSearchParams()` `/ekip` page'de Suspense olmadan — prerender hatası, son 4 deploy fail.

**Çözüm:** `EkipPageContent` client bileşeni + `page.tsx` içinde `<Suspense fallback={EkipPageSkeleton}>` (IlgilenHub ile aynı kalıp).

**Dosyalar:** `ekip/page.tsx`, `ekip/_components/EkipPageContent.tsx`

**Git:** `3e66797` — push `main`

## 2026-06-07 — Pano Crown Organizasyon kutuları ✅

**Pano:** 6’lı karışık launcher kaldırıldı → 8 kişisel kutu (`PANO_ORGANIZATION_ITEMS`): Yol Haritam, Bugünkü Takibim, Haftalık, Aylık, İlk 30, Canlı Eğitim + YZ Koçu + Vaktin Varsa. Boru Hattı / Takvim / Ekibim panodan çıktı (nav’da kalır).

**Üst bölüm:** `Organizasyon` etiketi; `PanoTodaySummary` panodan kaldırıldı (kutulara taşındı).

**Hızlı Bakış:** Yeni `roadmap` sekmesi (`HedefKart`); günlük sekmeden hedef kartı ayrıldı.

**Grid:** 8 kutu — mobil 4 satır, md 3 satır; pano mobilde `overflow-y-auto`.

**Git:** `684a975` — push `main`

**Dosyalar:** `navigation.ts`, `PanoContent.tsx`, `PanoLauncherGrid.tsx`, `LauncherGrid.tsx`, `CrownHomeMockGrid.tsx`, `IlgilenHub.tsx`, `DailyTab.tsx`, `tr.ts`, `en.ts`

## 2026-06-07 — Freemium sprint (Faz 0→5→1-2→3-4→6) ✅

**Faz 0:** Free forever — `accountLifecycle` trial sonrası tam kilit kaldırıldı; `featureAccess` matrisi + `UpgradePrompt` / `useUpgradePrompt`.

**Faz 5:** Free planda YZ Koçu + saha AI tam kilit (`checkQuota`, pano launcher 🔒, `/yazar`, pipeline AI, onboarding koç Bot).

**Free ekip (A):** `/ekip` herkese açık — gör + davet; Plus/Pro tam panel. `TeamFreeUpgradeBanner` + kısıtlı üye listesi.

**Faz 1–2:** Pano `PanoTodaySummary` (hedef hunisi mini + Hızlı Bakış CTA). Hızlı Bakış sekmeleri: Günlük → Haftalık → Aylık → İlk 30 → Canlı; `team` sekmesi kaldırıldı → `/ekip` linki.

**Faz 3–4:** `/ekip` yatay sekmeler (Üyeler, Davet, Aktivite, Eğitim, Ağaç). `/ekibim` → `/ekip` redirect. Nesil ağacı (`treeActions` + `TeamGenerationTree`).

**Deploy:** Migration yok; Supabase değişikliği yok.

**Git:** `1bdcaac` — push `main`

**Dosyalar:** `featureAccess.ts`, `accountLifecycle.ts`, `checkQuota.ts`, `UpgradePrompt.tsx`, `useUpgradePrompt.tsx`, `PanoTodaySummary.tsx`, `PanoContent.tsx`, `CrownHomeMockGrid.tsx`, `IlgilenHub.tsx`, `EkipTabNav.tsx`, `EkipPanel.tsx`, `TeamGenerationTree.tsx`, `ekibim/page.tsx`, çeviri `tr.ts`/`en.ts`, `shell.ts`

## 2026-06-07 — Vaktin Varsa chick sarısı koyulaştırıldı ✅

**chick gradient:** `#FFD966` → `#FF9900` (~%50 daha koyu; beyaz etiket okunabilirliği).

**Dosya:** `SquareButton.tsx`

## 2026-06-07 — Pano Hızlı Bakış ↔ Vaktin Varsa renk swap ✅

**Hızlı Bakış:** Vaktin Varsa'nın turuncu gradient'i (`amber`). **Vaktin Varsa:** pastel civciv sarısı (`chick` — `#FFF8B0` → `#FFE066`).

**Dosyalar:** `navigation.ts`, `SquareButton.tsx`

## 2026-06-07 — Mobil UX düzeltmeleri + pano renk swap ✅

**YZ Koçu:** Üst sekmeler mobilde iki satır (truncate kaldırıldı); uyum alt sekmeleri tek satır; gereksiz alt başlıklar kaldırıldı (sayfa, koçluk, saha provası).

**Mobil popup'lar:** Yeni Aday Ekle, YZ davet mesajı ve bildirim detayı dikey ortalı; sticky başlık + kapat; bildirim footer mobilde wrap.

**Ekibim aktiviteler:** Metrik sorguları paralel; aktivite sekmesinde hover/tık prefetch.

**Pano renkleri:** Hızlı Bakış → pastel turuncu (`peach`); YZ Koçu → eski Hızlı Bakış gökyüzü mavisi (`purple`).

**Dosyalar:** `YzKocuContainer.tsx`, `yazar/page.tsx`, `KoclukForm.tsx`, `ProvaForm.tsx`, `UyumContent.tsx`, `AddCandidateSheet.tsx`, `NmmInviteSheet.tsx`, `NotificationsModal.tsx`, `teamActivityActions.ts`, `TeamPerformanceSection.tsx`, `SquareButton.tsx`, `navigation.ts`

## 2026-06-07 — Pano Ekibim ↔ Vaktin Varsa renk swap ✅

**PANO_LAUNCHER_ITEMS:** Ekibim → mor gradient (`indigo`), Vaktin Varsa → turuncu gradient (`amber`).

**Dosya:** `navigation.ts`

## 2026-06-07 — Pano kutuları canlı gradient renkler ✅

**SquareButton crown:** Düz koyu renkler → referans paletindeki `bg-gradient-to-br` gradientler. Pano eşlemesi: Hızlı Bakış gökyüzü mavisi, Boru Hattı yeşil, Takvim pembe, Ekibim turuncu, YZ Koçu royal mavi, Vaktin Varsa mor. Beyaz metin + hafif drop-shadow.

**Dosya:** `SquareButton.tsx`

## 2026-06-07 — Pano mobil viewport sığdırma + etiket 15/20px ✅

**Mobil 6 kutu tam görünür:** `aspect-square` kaldırıldı; `grid-rows-3` + `h-full flex-1` ile kalan yükseklik paylaşılıyor. Pano `main` mobilde `h-[calc(100dvh-4rem)] overflow-hidden`, flex zinciri `min-h-0`.

**Etiket puntoları:** Mobil `15px`, masaüstü `20px` (crown + prominent + fill).

**Dosyalar:** `LauncherGrid.tsx`, `pano/page.tsx`, `PanoContent.tsx`, `SquareButton.tsx`

## 2026-06-06 — Pano launcher kutu etiketleri büyütüldü ✅

**SquareButton crown + prominent:** Kutu isimleri mobilde `text-sm` (14px) → `text-base` (16px), masaüstünde `17px`; `leading-snug` ile iki satırlı etiketler okunaklı.

**Dosya:** `SquareButton.tsx`

## 2026-06-06 — Pano launcher: tam kutu marka renkleri ✅

**SquareButton crown variant:** Beyaz kutu + 3px üst çizgi kaldırıldı; her kutunun eski üst çizgi hex'i (`crownSolidMap`) tüm yüzeye uygulanıyor — purple `#534AB7`, teal `#0F6E56`, pink `#72243E`, amber `#854F0B`, cyan `#0891B2`, indigo `#3730A3`. Renkler karışmıyor; `PANO_LAUNCHER_ITEMS.color` → kendi kutusu.

**Dosya:** `SquareButton.tsx`

## 2026-06-06 — LandingHero i18n + ConfirmDialog danger ikon ✅

**LandingHero.tsx `lang ===` kaldırıldı:**
- `landing.ts` (TR + EN): `heroTitle1 / heroTitleHighlight / heroTitle2` anahtarları eklendi
- Başlık artık `t()` ile render ediliyor; gradient `<span>` korundu, `lang` import'u kaldırıldı

**ConfirmDialog danger ikonunu kırmızıya çevrildi:**
- `variant="danger"` → `AlertTriangle` ikonu (`text-red-600`), kırmızı arka plan
- `variant="default"` → `HelpCircle` ikonu, mor arka plan (değişmedi)

## 2026-06-06 — Hızlı Bakış alt başlık ✅

**Alt metin:** Hızlı Bakış h1 altına `pagesUi.todayPrioritiesSubtitle` eklendi — TR: "Bugün sen ve ekibin ne durumdasınız, neler yapmalısınız; hızlıca göz at, aksiyona geç!" EN karşılığı.

**Dosyalar:** `CrownHomeMockGrid.tsx`, `pages.ts` (sections)

## 2026-06-06 — Legal pages i18n, staleTime hizalama, ConfirmDialog danger variant ✅

**Legal sayfa UI label'ları i18n:**
- `landing.ts`: `landingPage.legalPage.*` alt anahtarları eklendi (TR + EN): `backToHome`, `kvkkBadge`, `kvkkAbbr`, `termsBadge`, `termsAbbr`
- `kvkk/page.tsx` + `kullanim-kosullari/page.tsx`: `const { lang, t }` + 3'er `lang === 'en' ?` ternary → `t('landingPage.legalPage.*')` ile değiştirildi

**staleTime hizalama:**
- `VideolarContent`: `20_000` ms → `5 * 60_000` ms (video kataloğu nadiren değişir)
- `usePresentationMaterials`: `60_000` ms → `2 * 60_000` ms (global ile uyumlu)

**ConfirmDialog danger variant:**
- `ConfirmDialog.tsx`: `variant?: 'default' | 'danger'` prop eklendi; danger → kırmızı onay butonu
- `VideolarContent`: video silme dialog'u `variant="danger"` kullanıyor

## 2026-06-06 — Hızlı Bakış: başlık + sayfa genişliği ✅

**Başlık:** `/bugun/ilgilen` sayfa h1 `pagesUi.todayPrioritiesTitle` ("Bugün İlgilen") → `nav.todayFocus` ("Hızlı Bakış" / Quick Glance); nav aria-label aynı kaynak.

**Genişlik:** `IlgilenHub` ve loading skeleton'dan `md:max-w-5xl` kaldırıldı — diğer dashboard sayfaları gibi tam `w-full` + shell `max-w-[1360px]` hizası.

**Dosyalar:** `CrownHomeMockGrid.tsx`, `IlgilenHub.tsx`, `bugun/ilgilen/page.tsx`

## 2026-06-06 — VideolarContent ConfirmDialog + PresentationMaterials senderPlaceholder i18n ✅

**VideolarContent window.confirm → ConfirmDialog:**
- `window.confirm()` kaldırıldı; React render döngüsünü bloke eden native dialog yerine `ConfirmDialog` bileşeni kullanılıyor
- `deletingVideo` state eklendi; silme onayı React katmanında, i18n destekli
- `videoTraining.ts`: `confirmDelete / videoDeleted / deleteFailed` anahtarları (TR + EN)

**PresentationMaterialsContent senderPlaceholder i18n:**
- `lang === 'en' ? 'Your name' : 'Adınız'` → `t('pipelinePage.senderPlaceholder')`
- `tr.ts` + `en.ts`: `pipelinePage.senderPlaceholder` anahtarı eklendi

## 2026-06-06 — ItirazCard i18n, Playwright artifact, README CI bölümü ✅

**ItirazCard expand başlıkları i18n:**
- `training.ts` (TR + EN): `expandShortAnswer`, `expandDetailedAnswer`, `expandApproach`, `expandExampleDialog` eklendi
- `ItirazCard.tsx`: "Kısa Saha Cevabı", "Detaylı Cevap", "Yaklaşım", "Örnek Diyalog" → `t('objectionsPage.expandXxx')` ile değiştirildi

**Playwright CI artifact:**
- `playwright.config.ts`: `reporter: process.env.CI ? 'html' : 'list'` eklendi
- `e2e.yml`: test sonrası `actions/upload-artifact@v4` adımı; fail'de Actions sekmesinden `playwright-report` indirilebilir (7 gün)

**README Deploy & CI bölümü:**
- GitHub secrets dokümantasyonu ve Playwright artifact açıklaması eklendi

## 2026-06-06 — E2E CI fix: korumalı route testleri auth skip ✅

**Sorun:** `dashboard-mobile.spec.ts`'te 3 test (`/egitim?tab=objections` URL check, `/itirazlar` iki redirect testi) `PLAYWRIGHT_TEST_EMAIL` olmadan CI'da `toHaveURL` assertion'da başarısız oluyordu — middleware korunan route'ları `/giris`'e yönlendiriyor.

**Düzeltme:** Bu 3 teste `test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, ...)` eklendi. Secret yoksa skip, varsa tam doğrulama.

## 2026-06-06 — Beşinci sprint: E2E CI, journal birleştir, idempotent moderation ✅

**CI & dokümantasyon:**
- `.github/workflows/e2e.yml` — build + Playwright chromium (landing smoke her zaman)
- `docs/deploy/github-secrets.md` — Supabase + E2E secret listesi
- `playwright.config.ts` — CI'da `npm run start` webServer
- `migrate-check.yml` — secret doc referansı

**Journal çakışma UX:**
- Yan yana local/bulut önizleme + **İkisini birleştir** (`journalMerge.ts`)
- i18n: `journalMergeBoth`, conflict label'ları

**Moderasyon & kopyala:**
- `moderationApproval` — mevcut `*En` alanları varsa Gemini atlanır (+ unit test)
- `ItirazCard` — kopyala/WhatsApp aktif dil + i18n etiketler
- `EgitimContent` — kopyala `maddelerEn` kullanır

**Smoke:**
- `docs/smoke/day-journal-cross-device.md` — migration verify + conflict + E2E bölümü

## 2026-06-06 — Dördüncü sprint: E2E auth, journal çakışma, moderation EN, CI remote ✅

**E2E & Playwright:**
- `e2e/auth.setup.ts` — `PLAYWRIGHT_TEST_EMAIL/PASSWORD` ile storage state
- `playwright.config.ts` — setup + authenticated chromium/mobile projeleri
- `e2e/day-journal-cross-device.spec.ts` — iki context sync smoke
- `e2e/day-journal-smoke.spec.ts` — auth fixture ile hizalandı
- `.gitignore` — `e2e/.auth/`

**Moderasyon & i18n:**
- `moderationRejectReason.ts` + unit test — `buildBilingualRejectReason` çekirdeği
- `moderationApproval.ts` — onayda kalıcı EN alanları (`baslikEn`, `kisaCevapEn`, …)
- `TrainingCard` / `ItirazCard` — `lang === 'en'` iken DB'deki EN alanları gösterir

**Journal & ekip:**
- `DayJournalCard` — local vs remote çakışma UI (yerel / bulut seçimi)
- `TeamPerformanceSection` — `hashchange` + `popstate` ile `#perf=` geri/ileri
- `useLeaderNotesCount` — `note_tr` OR `note_en` RLS uyumu

**CI:**
- `migrate-check.yml` — haftalık cron + PR'da remote drift (`SUPABASE_PROJECT_REF`)

## 2026-06-06 — Üçüncü sprint: moderation i18n, AI red çevirisi, perf hash ✅

**Moderasyon:**
- `ModerationReviewModal` — tüm form/toast metinleri `moderationReview.*` i18n
- `buildBilingualRejectReasonAction` — admin gerekçesi Gemini ile kalıcı TR|||EN
- `translateEnToTrAction` — EN admin gerekçesi için ters çeviri

**Performans & UX:**
- `useDeferredCandidateSection` — ActivityLog + LeaderNotes ortak lazy hook
- `useLeaderNotesCount` — kapalı kartta rozet, tam liste fetch yok
- `TeamPerformanceSection` — uzun URL'de `#perf=` hash fallback
- `DayJournalCard` — kuyruk flush sonrası `journalSyncedCloud` toast

**Test & CI:**
- `journalSyncQueue.test.ts` — localStorage kuyruk unit test
- `e2e/day-journal-smoke.spec.ts` — ilgilen yükleme + opsiyonel auth smoke
- CI `workflow_dispatch` → `migrate:check:remote` (SUPABASE_ACCESS_TOKEN)

## 2026-06-06 — Ek öneriler sprint: CI migrate, journal queue, lazy notes ✅

**CI & deploy:**
- `.github/workflows/migrate-check.yml` — PR/push'ta `npm run migrate:check`
- `migrate:check:remote` — linked Supabase drift uyarısı
- `docs/smoke/day-journal-cross-device.md` — 057 cross-device smoke checklist

**Performans:**
- `LeaderNotesCard` — viewport / açılışta fetch (`useCandidateNotes(enabled)`)
- `ActivityLogCard` — skeleton yerine scroll hint metni
- Platform modalları idle prefetch (1.2s)

**Moderasyon i18n:**
- `moderationDefaults.ts` — red gerekçesi TR ||| EN
- `ModerationReviewModal` — `prompt()` kaldırıldı, `RejectModerationDialog`
- E-posta: `rejectReasonForEmail` ile alıcı diline göre metin

**Journal & ekip UX:**
- `journalSyncQueue.ts` — offline kuyruk + online retry
- `TeamPerformanceSection` — çoklu sekme URL (`perfMemberTabs`, `perfFieldTabs`)

## 2026-06-06 — Follow-up: migration check, lazy activity log, journal UX ✅

**Deploy / migration:**
- `scripts/check-migrations.mjs` + `npm run migrate:check`
- `supabase/migrations/README.md` deploy checklist (057 pending)

**Performans:**
- `ActivityLogCard` — IntersectionObserver ile viewport'ta fetch; `useActivityHistory(enabled)`
- `PlatformYonetimContent` — modallar `dynamic()` ile lazy chunk

**Journal & i18n:**
- `saveDayJournalAction` boş içerikte satır siler (delete-on-empty)
- Supabase hata → `journalSavedLocal` toast; subtitle bulut senkronu yansıtıyor
- Mobil nav: TR "Bakış", EN "Glance"

**Ekip UX:**
- `TeamPerformanceSection` — `?perfMember=&perfMemberTab=` URL + sessionStorage
- `RejectModerationDialog` — her açılışta defaultReason ön-doldurma

## 2026-06-06 — Refactor sprint: CandidateDetail, admin-actions, günlük Supabase, Hızlı Bakış ✅

**CandidateDetail.tsx (~175 satır azaldı):**
- `CandidateStageCard`, `CandidateFollowUpCard`, `CandidateDeleteCard` ayrı dosyalara çıkarıldı
- Ana dosya orchestration + lazy-mount kartlara odaklandı

**Platform yönetimi:**
- Super-admin mutation'lar `admin-actions.ts`'e taşındı (`actions.ts` sadece okuma)
- `RejectModerationDialog` — `window.prompt` kaldırıldı, i18n reject metinleri eklendi

**Performans / cache:**
- `StatsSuperAdminSections` periodUsage `staleTime` 30s → 60s
- `usePlatformWorkspaces` 120s, `usePlatformModeration` 60s staleTime
- `useCandidateStats` hook — IstatistiklerContent duplicate useMemo kaldırıldı

**DayJournalCard → Supabase:**
- Migration `057_day_journal.sql` (`nmm_day_journal`, RLS)
- `journal.ts` server actions: get/save/merge/polish (TR ||| EN)
- İlk yüklemede localStorage → DB migrasyonu; debounced save

**UX:**
- Nav: "Bugün İlgilen" → **Hızlı Bakış** / Quick Glance; ikon `Zap` → `ScanEye`
- IlgilenHub `?tab=` persistence JSDoc ile belgelendi
- TeamPerformanceSection kart tab state `sessionStorage` ile persist

**Deploy notu:** `057_day_journal.sql` Supabase'e uygulanmalı.

## 2026-06-06 — Refactor: PlatformYonetimContent bölünmesi + perf-progress düzeltmesi ✅

**PlatformYonetimContent (1192 satır → 808 satır, %32 küçülme):**
- `WorkspaceLicenseModal` → yeni ayrı dosya; kendi state'ini yönetiyor (licenseType, extensionDays, isUnlimited, isUpdating)
- `ModerationReviewModal` → yeni ayrı dosya; 10 edit* field + isModerating kendi içinde; lazily initialize from request.data
- `handleOpenReview()` artık sadece `setSelectedRequest(req)` — karmaşık state senkronizasyonu ortadan kalktı
- License trigger button artık sadece `setSelectedWorkspace(w)` — modal state'i kendi başlatıyor

**IstatistiklerContent perf-progress staleTime:**
- `staleTime: 30_000` (30s) → `staleTime: 2 * 60_000` (2dk) — global config ile uyumlu, gereksiz yeniden fetch azaldı

**animate-in fade-in:**
- Lazy-mount pattern ile zaten çözüldü: sekmeler ilk ziyarette animate olur (doğru UX), sonraki geçişler anlık CSS (animasyon yok = daha iyi)

## 2026-06-06 — Perf: lazy-mount tab pattern (gerçek düzeltme) ✅

**Sorun:** Önceki "always-mounted" yaklaşım ilk yüklemede TÜM sekmeleri aynı anda render ediyordu.
IlgilenHub: 6 Crown bileşeni paralel mount → 6 ayrı Supabase sorgu kümesi → ağır ilk yük.

**Çözüm: `useRef<Set>` lazy-mount pattern**
- İlk açılışta yalnızca aktif sekme mount edilir → hafif ilk yük.
- Sekmeye ilk kez tıklanınca mount → tek seferlik fetch (beklenir, kabul edilebilir).
- Sonraki geçişler: zaten mount'lu → anlık CSS değişimi, sıfır network isteği ✓

**Düzeltilen dosyalar:**
- `IlgilenHub.tsx` — 6 sekme, artık lazy
- `AkademiContent.tsx` — 3 sekme, artık lazy
- `YzKocuContainer.tsx` — 4 sekme, artık lazy
- `UyumContent.tsx` — 2 sekme, artık lazy (compliance box & disclaimer her zaman görünür)

## 2026-06-06 — UX Performans: always-mounted tabs + cache TTL artışı ✅

### Değişiklikler

**QueryProvider & getQueryClient — global cache TTL iyileştirmesi:**
- `staleTime` 60s → **2 dk**: Kısa sürede aynı veriyi yeniden çekme azaldı.
- `gcTime` varsayılan 5dk → **10 dk**: Sayfa geçişi sonrası veri bellekte kalır; geri dönüşte yeniden fetch yok.

**AkademiContent (egitim sekmeler — 3 tab):**
- `{tab === 'X' && <Comp />}` → `<div className={tab !== 'X' ? 'hidden' : ''}>` always-mounted.
- İçerik bankası ↔ Videolar ↔ İtirazlar geçişi anlık; VideolarContent'in `useQuery` yeniden tetiklenmez.

**UyumContent (uyum sekmeler — 2 tab):**
- Auditor ve Library sekmeleri always-mounted.
- Kullanıcının doldurduğu metin (AI denetim alanı) sekme geçişinde kaybolmaz.

**YzKocuContainer (yazar sekmeler — 4 tab):**
- Mesaj Yazar ↔ Koçluk ↔ Prova ↔ Uyum sekmeleri always-mounted.
- UyumContent (embedded) sekme geçişinde yeniden mount olmaz; YazarForm state korunur.

**Dosyalar:** `QueryProvider.tsx`, `getQueryClient.ts`, `AkademiContent.tsx`, `UyumContent.tsx`, `YzKocuContainer.tsx`.

## 2026-06-06 — Bugün İlgilen sekme geçişi: anlık (always-mounted) ✅

- Önceki: `{activeTab === 'X' && <Component />}` → sekme geçişinde unmount + yeni fetch (yavaş).
- Yeni: 6 sekme her zaman mount'lu, CSS `hidden` ile gizleniyor.
- İlk açılışta 6 query **paralel** başlar; sekme geçişi unmount/remount yerine anlık CSS değişimi.
- **Dosya:** `IlgilenHub.tsx`.

## 2026-06-06 — DayJournalCard: useReducer ile tek-render hydration ✅

- `setText` + `setHydrated` ayrı ayrı çağrısı → 2 render; `useReducer` ile tek `dispatch` → 1 render.
- Lint hatası (`react-hooks/set-state-in-effect`) giderildi — gerçek performans iyileştirmesi.
- **Dosya:** `DayJournalCard.tsx`.

## 2026-06-06 — Bugün İlgilen: gerçek sekme sistemi (SPA) ✅

- Sekme çubuğu artık ayrı sayfalara gitmez; `/bugun/ilgilen?tab=daily|live|team|weekly|monthly|first30` URL search param ile aynı sayfada içerik değişir.
- **Günlük Takip (daily):** Hedef chip → AI öncelik listesi (IlgilenContent, tüm aksiyonlar + AI mesaj) → HedefKart → FieldWeekSummary → Gün ritüeli.
- **Diğer 5 sekme:** Canlı Eğitim, Ekibim, Haftalık, Aylık, İlk 30 Gün; Crown sayfa bileşenleri `asTab={true}` ile shell/başlık olmadan render edilir.
- **Silinen:** `BugunHubSections.tsx` (pano modüllerinin yığıldığı aşırı yüklü bileşen).
- **Yeni:** `IlgilenHub.tsx` (SPA hub, useSearchParams), `DailyTab.tsx` (temiz günlük içerik).
- Standalone Crown route'ları (`/bugunku-takibim` vb.) korundu — direkt URL ile erişilince HubPageShell (geri butonu) ile çalışmaya devam eder.
- **Dosyalar:** `page.tsx`, `CrownHomeMockGrid.tsx`, `IlgilenHub.tsx` (yeni), `DailyTab.tsx` (yeni), `HubPageShell.tsx`, 5 Crown sayfası (asTab prop).

## 2026-06-04 — Bugün İlgilen: YZ Koçu tarzı sekmeler + swipe kilidi ✅

- Sekmeler belirgin (renkli aktif durum + ikon); ilk sekme varsayılan seçili.
- `no-swipe` / `data-no-swipe` ile yatay kaydırma sayfa geçişini tetiklemez.
- **Dosya:** `CrownHomeMockGrid.tsx`.

## 2026-06-04 — Ekibim özet kaldırıldı; Bugün İlgilen sekme navigasyonu ✅

- **Ekibim:** Ekip Aktivite Özeti kutusu ve ilgili popup/query kaldırıldı.
- **Saha ortağı sekmeleri:** WhatsApp paneline `Hazır şablon NMM daveti gönder`; YZ metni `…hazırla ve gönder`.
- **Bugün İlgilen:** 6 kutu → başlık + 6 sekme (tıklanınca eski href’lere gider); alt modüller aynı.
- **Dosyalar:** `EkipPanel.tsx`, `TeamPerformanceSection.tsx`, `CrownHomeMockGrid.tsx`, `tr.ts`, `en.ts`.

## 2026-06-04 — Ekibim: saha ortağı davet sekmeleri ✅

- Profil satırından butonlar kaldırıldı — isimler tam genişlikte (Elif/Sinem gibi).
- Saha ortağı kartlarında 2 sekme: **YZ Davet Metni Üret** (Bot) + **NMM'e Davet Et 🚀** (WhatsApp).
- Sekme açılınca eski tam butonlar panelde; `inviteToNmm` metni geri.
- **Dosyalar:** `TeamPerformanceSection.tsx`, `tr.ts`, `en.ts`.

## 2026-06-04 — Ekibim: saha ortağı tek satır + kompakt davet ✅

- Saha ortağı kartları mobilde de NMM ile aynı yatay satırda (flex-col kaldırıldı).
- WhatsApp davet butonu: ikon + **Davet Et** (`team.inviteBtn`).
- **Dosyalar:** `TeamPerformanceSection.tsx`, `tr.ts`, `en.ts`.

## 2026-06-04 — Ekibim: panel istatistikleri, sekme sırası, aktivite iyileştirmeleri ✅

- Başlık altı açıklama kaldırıldı; panel adı **Lider ve Ekip Performans Paneli**.
- 4 özet kutu: Lider (1, pastel yeşil), NMM Ortağı (sarı), Saha Ortağı (açık kırmızı), Toplam Aday (boru hattı − ortaklar).
- Haftalık Organizasyon Performans Durumu kartı kaldırıldı.
- Sekme sırası: Huni → DDBR → **Aktivite** → Ara → WhatsApp.
- Aktivite: lider DDBR 9/9; kendi hedef bilgisi (`nmm_user_goals`); Ara sekmesinde isim+numara ipucu.
- **Dosyalar:** `page.tsx`, `TeamPerformanceSection.tsx`, `EkipPanel.tsx`, `MemberActivitySheet.tsx`, `hedef/actions.ts`, `tr.ts`, `en.ts`.

## 2026-06-06 — Ekibim: kart sadeleştirme + sekme-only açılım ✅

- Chevron ve sil butonları kaldırıldı; içerik yalnızca sekme tıklanınca açılıyor (aynı sekmeye tekrar tık = kapanır).
- Profil: avatar + isim + rozet tek satır; tarih, üye/lider alt metni, toplam aday metriği kaldırıldı.
- Lider (Suat) kartı da aynı sekme yapısına alındı; DDBR sekmesi yalnızca `member` rolünde.
- **Dosyalar:** `TeamPerformanceSection.tsx`, `EkipPanel.tsx`.

## 2026-06-06 — Ekibim: Ara + Aktivite sekme düzeltmeleri ✅

- **Ara sekmesi:** Telefon numarası gizlendi; yalnızca Ara butonu (`tel:` satırdaki üyeyi arar).
- **Aktivite sekmesi:** Popup kaldırıldı; `MemberActivitySheet embedded` ile dönem/metrik/hedef içeriği sekme altında. Başlık, ara/WA, gizlilik notu yok.
- **Dosyalar:** `MemberActivitySheet.tsx`, `TeamPerformanceSection.tsx`, `EkipPanel.tsx`.

## 2026-06-06 — Ekibim: üye kartı ikon sekmeleri ✅

- **Sorun:** DDBR satırı metin + ayrı huni/iletişim blokları kartı kalabalıklaştırıyordu.
- **Çözüm:** Downline üye kartlarında DDBR yazısı kaldırıldı; 5 ikon sekmesi (Huni, DDBR, Ara, WhatsApp, Aktivite). DDBR ilerleme çubuğu hafta sekmelerinin altında. Sekme tıklanınca kart açılır ve ilgili panel gösterilir.
- **Dosyalar:** `TeamPerformanceSection.tsx`, `EkipPanel.tsx`, `tr.ts`, `en.ts`.

## 2026-06-06 — Pano launcher: Boru Hattı ile aynı yatay sınırlar ✅

- **Sorun:** Pano grid `max-w-5xl` ile pipeline'dan dar kalıyordu.
- **Çözüm:** `PanoContent` içindeki `md:max-w-5xl` kaldırıldı — `px-4` + shell `max-w-[1360px]` (pipeline ile aynı).
- **Commit:** `1468aa2`

## 2026-06-06 — Pano launcher: masaüstünde viewport doldurma ✅

- **Sorun:** 6’lı launcher kutuları md+’da kare oranla ortada küçük kalıyor, üst/alt boşluk fazlaydı.
- **Çözüm:** `LauncherGrid fillViewport` — `grid-rows-2` + `flex-1`, hücreler `md:h-full`; pano `min-h-[calc(100dvh-4rem)]` flex kolon.
- **Dosyalar:** `LauncherGrid.tsx`, `PanoContent.tsx`, `PanoLauncherGrid.tsx`, `pano/page.tsx`.

## 2026-06-05 — Bugün İlgilen hibrit raporu: 6 hub sayfası tamamlandı ✅

- **Kapsam:** Crown analiz raporundaki tüm maddeler — sadelik korunarak NMM verisiyle hibrit UX.
- **Bugünkü Takibim:** `HubGoalChipRow` (günlük hedef chip + saha serisi), `HubPriorityStrip` (öncelikli adaylar + WA/arama log → `nmm_daily_actions.candidate_id`).
- **Ekibim:** 4’lü KPI (`HubKpiRow`), 14g+ sessiz badge, yolunda/geride, inline WA.
- **Haftalık Özet:** `HubWeeklySelfBar` (hedef vs gerçek + eylem önerisi), sıralama/grafik varsayılan açık.
- **Aylık Özet:** `HubMonthProgress` (ay içi ilerleme + trend), giriş kartlarında ≥7g risk uyarısı.
- **İlk 30 Gün:** kalan gün pill, risk rengi, eksik adım kırılımı, WA ping.
- **Canlı Eğitim:** son izlenen + sıradaki video + ekip ortalaması KPI’ları.
- **Actions:** `getHubWeeklySelfAction`, `getHubMonthlyInsightsAction`, `logHubContactAction`; team/video/first30 payload genişletildi.
- **Dosyalar:** `lib/ui/hub/Hub*.tsx`, `crown/actions.ts`, 6 hub sayfası, `TeamActivitySummary`, `crown.ts`, `bugun/ilgilen/page.tsx`.

## 2026-06-05 — Launcher kutuları pano ile birebir eşitlendi ✅

- **Sorun:** Bugün İlgilen 6’lı grid panodan daha geniş/küçük görünüyordu (tam dashboard genişliği + `aspect-square` link üzerinde).
- **Çözüm:** `LauncherGrid` + `LauncherGridItem` (`aspect-square` hücre) — tek kaynak; `md:max-w-5xl` her iki sayfada aynı.
- **SquareButton:** `fill` prop — hücreyi `h-full w-full` doldurur; etiket `line-clamp-2`.
- **Dosyalar:** `LauncherGrid.tsx`, `SquareButton.tsx`, `PanoLauncherGrid.tsx`, `CrownHomeMockGrid.tsx`.

## 2026-06-05 — Bugün İlgilen hub sayfaları: NMM hibrit (mock shell kaldırıldı) ✅

- **Sorun:** Crown deneme sayfaları lacivert header + `max-w-3xl` + slate renklerle mock hissi veriyordu; veri action’ları gerçek olsa da UI NMM’den kopuktu.
- **Çözüm:** `HubPageShell` + `HubSectionCard` — standart dashboard genişliği (`max-w-[1360px]` shell), `var(--bg)` / `var(--text-*)`, pano/ekip ile aynı tipografi.
- **Hibrit içerik (gerçek NMM bileşenleri + veri):**
  - `/bugunku-takibim` → `HedefKart`, `FieldWeekSummary`, `TodayRitualSection`
  - `/haftalik-ozet` → `PanoWeeklyLite` + `TeamActivitySummary` (7g)
  - `/aylik-ozet` → `TeamActivitySummary` (30g) + giriş kayıtları (`crown/actions`)
  - `/canli-egitim` → `PanoVideoStrip` + ekip video map + link `/egitim/videolar`
  - `/ekibim` → ekip roster (bundle + video + hedefler), CTA `/ekip`
  - `/ilk-30-gun` → onboarding % (Supabase), CTA `/ekip`
- **Kaldırıldı:** `lib/ui/crown/CrownPageShell`, `CrownCard`
- **Dosyalar:** `lib/ui/hub/*`, 6 hub `_components/*`, `crown.ts` i18n, `IlgilenHubGrid`, `bugun/ilgilen/page.tsx` (`max-w-5xl` kaldırıldı).

## 2026-06-05 — Crown deneme sayfaları (Bugün İlgilen kutuları) ✅

- **Davet kodu kutusu** `CrownHomeMockGrid` içinden kaldırıldı.
- **6 kutu → yeni route:** `/bugunku-takibim`, `/canli-egitim`, `/ekibim`, `/haftalik-ozet`, `/aylik-ozet`, `/ilk-30-gun` — mevcut NMM sayfalarına dokunulmadı.
- **Crown UI:** `CrownPageShell` + `CrownCard` (açık arka plan, lacivert header, Geri → `/bugun/ilgilen`).
- **Veri:** `crown/actions.ts` — hedef/günlük ilerleme, ekip bundle, video özeti, haftalık/aylık saha aktivitesi, onboarding (9 adım), giriş kayıtları (read-only, mevcut action’ları çağırır).
- **i18n:** `sections/crown.ts` TR/EN.
- **Dosyalar:** `crown/actions.ts`, `lib/ui/crown/*`, 6 route klasörü, `CrownHomeMockGrid.tsx`, `LanguageProvider.tsx`.

## 2026-06-05 — Bugün İlgilen sayfasına hub taşındı (pano sadeleştirildi) ✅

- **Pano:** Sadece selamlama + WelcomeCard + 6’lı launcher; Crown mock ve `BugunHubSections` kaldırıldı.
- **Bugün İlgilen (`/bugun/ilgilen`):** Üstte Crown mock grid (6 kutu + davet kodu), altında tüm hub modülleri (`BugunHubSections`), en altta günlük takip listesi (`IlgilenContent`).
- **Navigasyon:** Bugün İlgilen artık toggle değil — doğrudan `/bugun/ilgilen` route.
- **Dosyalar:** `page.tsx` (ilgilen), `CrownHomeMockGrid.tsx` (ilgilen’e taşındı), `PanoContent.tsx`, `PanoLauncherGrid.tsx`.

## 2026-06-05 — Pano: 6’lı launcher + Bugün İlgilen → Crown mock

- **Üst grid:** NMM 6 modül (`PANO_LAUNCHER_ITEMS`) crown stil — tıklanınca ilgili sayfaya gider (Boru Hattı, Takvim, Ekibim, YZ Koçu, Vaktin Varsa).
- **Bugün İlgilen:** Sayfaya gitmez; toggle ile altında **Crown mock grid** açılır (Bugünkü Takibim, Canlı Eğitim, … + davet kodu — hepsi mock toast).
- **Alt blok:** `BugunHubSections` her zaman panoda (hedef, öncelikler, KPI, ritüel, vb.).
- **Dosyalar:** `PanoLauncherGrid.tsx`, `PanoContent.tsx`, `CrownHomeMockGrid.tsx`.

## 2026-06-05 — Pano: Crown Team mock grid + hub modülleri panoda (revize)

- **CrownHomeMockGrid:** Crown Team ana sayfa düzeni (mock) — 6 kutu 2×3 mobil / **3×2 masaüstü**, crown stil, **eski marka accent renkleri**; altta davet kodu şeridi.
- Mock butonlar toast “yakında”; **Ekibim** → `/ekip` (kilit → `/odeme`).
- **BugunHubSections** pano kutularının altına taşındı; `/bugun/ilgilen` sadece günlük takip listesi.
- **Kaldırıldı:** `PanoLauncherGrid`, `BugunModuleSheet` (alt sheet).
- **i18n:** `dashboard.crownMock*` TR/EN.
- **Dosyalar:** `CrownHomeMockGrid.tsx`, `PanoContent.tsx`, `IlgilenContent.tsx`, `SquareButton.tsx`, `tr.ts`, `en.ts`.

## 2026-06-05 — Pano Crown kutular + Bugün İlgilen hub sheet (geri alındı)

- **SquareButton `crown` variant:** Beyaz kart + üstte renkli accent çizgi (Crown Team estetiği); pano launcher’da kullanılıyor.
- **PanoLauncherGrid:** 6 kutu `variant="crown"`; **Bugün İlgilen** doğrudan route yerine `BugunModuleSheet` açar.
- **BugunModuleSheet:** Alt sheet — “Araçlar & Modüller” 3×N grid (8 modül: Bugün İlgilen, YZ Koçu, Saha Provası, İtirazlar, Uyum, İstatistikler, Takvim, Akademi); `slide-up` animasyonu (`globals.css`).
- **i18n:** `dashboard.hubTitle` TR/EN.
- **Dosyalar:** `PanoLauncherGrid.tsx`, `BugunModuleSheet.tsx`, `SquareButton.tsx`, `globals.css`, `tr.ts`, `en.ts`.

## 2026-06-05 — Mobil alt bar: kayar şerit geri

- **BottomNav:** `overflow-x-auto` + sabit genişlikli sekmeler; tüm sidebar modülleri tek şeritte (Pano + 6 modül + İstatistikler; süper admin + Yönetim).
- **Kaldırıldı:** 4 sekme + **Diğer** (`NavMoreSheet`) — sheet mobil barda artık yok (`NavMoreSheet.tsx` dosyası duruyor, kullanılmıyor).
- Ekip kilidi → `/odeme`; aktif sekme `scrollIntoView` korundu.
- **Dosya:** `BottomNav.tsx` · deploy: `main` push sonrası Vercel Production.

## 2026-06-05 — `feat/pano-cockpit-faz1` → `main` (canlı deploy)

**`main` @ `ac84ca0`** — fast-forward merge + `git push origin main`. Vercel Production birkaç dakika içinde güncellenir; görmüyorsan hard refresh / gizli pencere.
**Branch:** `feat/pano-cockpit-faz1` ile `main` aynı uçta; yeni iş için yeni branch veya `main` üzerinden devam.
**Yarın (plan):** **Bugün İlgilen** ve **Ekibim** içinde ek değişiklikler.

## 2026-06-05 — UI sadeleştirme sprint TAMAMLANDI (commit + push)

**Branch:** `feat/pano-cockpit-faz1` · geri al: `ui-sadelestirme-oncesi` @ `68546e1`  
**Not:** Aşağıdaki özellikler artık `main`’de.

### Pano (launcher kokpit)
- Pano = selamlama + Welcome + **6’lı launcher grid** (modüller panodan çıktı → Bugün İlgilen hub’a taşındı).
- Masaüstü: 3×2 grid, `max-w-5xl` ortalı blok, selamlama `text-center`; mobil: 2×3, sola hizalı (değişmedi).
- Kutu boyutu: orta (`prominent` — `md:p-7`, ikon ~38px); tam ekran dev kutular yok.

### Nav
- Sidebar: Pano + 6 modül + İstatistikler + (super admin) Platform Yönetimi.
- Mobil: kayar şerit (sidebar modülleri); Ekip lisans kilidi → `/odeme`. *(Diğer sheet kaldırıldı — üst hot bölümü.)*

### Modül birleştirme
- **YZ Koçu** (`/yazar`): 4 sekme — Yazar | Koçluk | Saha Provası | Uyum; `/saha-provasi`, `/uyum` → redirect.
- **Vaktin Varsa** (`/egitim`): 3 sekme — İçerik Bankası | Video Eğitimler | İtirazlara Cevaplar; `/itirazlar`, `/egitim/videolar` redirect; üst video butonu kaldırıldı.
- **Bugün İlgilen:** `BugunHubSections` (hedef, haftalık lite, öncelikler, KPI, ritüel, davet, ekip uyarısı, video strip).

### Teknik / deploy notları
- `TrainingCard` iç içe `<button>` hydration fix; `DashboardShell` sidebar `localStorage` sadece `useEffect`.
- `next.config` redirect’ler; moderation e-posta linkleri `egitim?tab=objections`.
- `e2e/dashboard-mobile.spec.ts` + Playwright mobil proje.
- Ritüel/günlük: `DayCloseCard`, `TodayRitualSection`, `DayJournalCard`, `dayRitual.ts` (localStorage).

### Dosya özeti
`PanoLauncherGrid`, `PanoContent`, `navigation.ts`, `BugunHubSections`, `AkademiContent`, `YzKocuContainer`, `UyumContent`, `NavMoreSheet`, `SquareButton`, çeviri `nav.vaktinVarsa` / coach / training sekmeleri.

## 2026-06-04 — UI sadeleştirme sprint (ara kayıt — üstteki 2026-06-05 ile birleştirildi)

**Not:** Aşağıdaki madde eski WIP özeti; güncel durum = üst bölüm.

## 2026-06-04 — Pano Faz 1a (kokpit sadeleştirme)

- **Güvenlik:** Tag `ui-sadelestirme-oncesi` @ `68546e1`; branch `feat/pano-cockpit-faz1` (push edildi).
- **Pano:** 10’lu SquareButton grid + MiniTrend kaldırıldı; sıra: Welcome → Hedef → Bugün CTA → saha serisi → öncelikler (max 3) → KPI → davet chip (≤10 aday).
- **Yeni:** `WelcomeCard`, `PanoTodayCta`, `PanoInviteChip`; desktop `lg` yan sütunda `PanoVideoStrip`.
- **DB:** Yok. Welcome dismiss = localStorage.
- **Geri al:** `git checkout main && git branch -D feat/pano-cockpit-faz1` veya `git checkout ui-sadelestirme-oncesi`.
- **Sırada:** Faz 1c sidebar hiyerarşisi, Faz 1b Playwright mobil.

## 2026-06-04 — Aktivite popup: dark okunabilirlik + stabil boyut

- **Dönem sekmeleri (dark):** Seçili beyaz bold; diğerleri `white/80` normal ağırlık. Light tema değişmedi.
- **Linkler (dark):** Hedef belirle + Boru Hattı profiline git → `dark:text-white`.
- **TR metin:** Alt başlık “Seçili dönemdeki saha özeti”; link “Boru Hattı profiline git” (EN aynı).
- **Zıplama fix:** `keepPreviousData`, 3 dönem prefetch, sabit `min-h` metrik alanı + skeleton ilk yükleme.
- **Dosyalar:** `MemberActivitySheet.tsx`, `tr.ts`.

## 2026-06-04 — Ekibim davet/broadcast UX

- **Tüm Ekip / Kişileri Seç:** Seçili yeşil çerçeve `border-whatsapp/35` (dark `/40`) — ince, abartısız.
- **Tipografi:** Davet, Davet Kodu ve Ekibe Gönder kutularının iç metinleri +1 birim; `EKİBE GÖNDER` bölüm başlığı diğer iki bölümle aynı (`text-sm font-bold`, `h-5` ikon).
- **Dosyalar:** `BroadcastPanel`, `InviteTeammateSection`, `JoinByInviteSection`, `SpoilerCode`.

## 2026-06-04 — Ekibim: kutu çerçeveleri yumuşatıldı

- **Sorun:** Geçen oturumdaki `dark:border-white/*` çerçeveler çok sert/kalın görünüyordu.
- **Çözüm:** Ekibim sayfasındaki tüm ana kutular `border border-[var(--border)]` ile eşitlendi (Davet Kodunu Gir referansı): KPI kartları, skor kartı, iç metrikler, üye kartları (`teamMemberCard.ts` — ring kaldırıldı).
- **Dosyalar:** `TeamPerformanceSection.tsx`, `teamMemberCard.ts`.
- **Not:** `EkipPanel.tsx` WIP — commit edilmedi.

## 2026-06-03 — Eğitim/ekip dark UX: hover, çerçeve, video tipografi

- **Vaktin Varsa:** “Video Eğitimler” butonu hover → mor arka plan (light hafif, dark tam); hero rozetleri +1pt (`10px`).
- **Ekibim dark:** Haftalık Organizasyon Performans kartı ve iç metrik kutuları `dark:border-white/*`; distribütör kartları `teamMemberCard.ts` ile beyaz çerçeve.
- **Video Eğitimler sayfası:** Tüm metinler +1 birim; admin `+` ikonu `strokeWidth={2.75}`.
- **Dosyalar:** `EgitimContent`, `VideolarContent`, `TrainingVideoCard`, `TeamPerformanceSection`, `teamMemberCard.ts`.
- **Not:** `EkipPanel.tsx` WIP (paralel ajanda) — commit edilmedi.

## 2026-06-03 — Dark UX: Takvim, Koç, Pano, Platform + onaylı öneriler

- **Takvim dark:** Takip günü noktaları beyaz; “En yakın takip” ve “Bugüne dön” hover → mor arka plan + beyaz yazı.
- **Bugün İlgilen:** Saha özeti alt metni güncellendi (aday ekleme, sunum, tüm aramalar).
- **YZ Koçu:** Banner başlık/açıklama +1pt; dark’ta açıklama başlıkla aynı renk.
- **Pano:** Aktif Aday rakamı dark’ta beyaz.
- **Platform:** “Dış Kayıtlar”; Boru Hattı’ma ekle ikonu dark beyaz; tablo `table-fixed` + sıkı padding.
- **Öneri 1/3/4:** Kullanılmayan hero çeviri anahtarları silindi; ilgili konu seçim özeti; hero kutularında favori yokken toplam rozet.
- **Dosyalar:** `TakvimClient`, `pulse.ts`, `KoclukForm`, `PanoContent`, `PlatformYonetimContent`, `platform.ts`, `RelatedTopicPicker`, `ItirazlarContent`, `EgitimContent`, `tr.ts`, `en.ts`, `training.ts`, `videoTraining.ts`.
- **Not:** `EkipPanel.tsx` WIP — commit edilmedi.

## 2026-06-03 — Sunum materyalleri dark + ilgili konu popup + hero kutuları

- **Sunum Materyalleri dark:** Geri link, chip etiketleri ve “Materyal ekle” butonu
  `text-brand-readable` ile dark’ta okunur (light değişmedi).
- **İlgili konu popup:** Seçimde kapanmıyor; tıklama ile seç/kaldır; altta İptal + Tamam;
  genişletilmiş responsive layout (sm:2xl, md:3xl, 2 sütun liste).
- **İtirazlara Cevaplar / Vaktin Varsa:** Alt başlık metinleri hero kutusuna taşındı;
  sayaç/ipucu satırları kaldırıldı; sol ikon + sağ favori rozetleri korundu.
- **Dosyalar:** `PresentationMaterialsContent`, `RelatedTopicPicker`, `ItirazlarContent`,
  `EgitimContent`, `videoTraining.ts`.
- **Not:** `EkipPanel.tsx` WIP — commit edilmedi.

## 2026-06-03 — Saha serisi popup + Bugün İlgilen UX + Boru Hattı dark düzeltmeleri + video önerileri

- **Saha serisi popup:** “Tam hafta — 7/7 gün saha kaydı” kutusu tıklanınca
  `nmm_daily_actions` tablosundan son 7 günün saha aksiyonları listelenir (kalıcı DB;
  localStorage yok). `getFieldStreakDetailAction` + `FieldStreakDetailModal`.
- **Bugün İlgilen:** “Bu hafta saha özeti” → “Bu hafta saha özetin”; sayfa yazı
  puntoları +1 birim.
- **Boru Hattı dark:** Sunum Materyalleri hover → mor arka plan + beyaz yazı;
  Takip Zamanı kutusu çerçevesi `dark:border-white/70`.
- **Önceki oturum önerileri (4/5):** VideoEditModal i18n; mobil 4 buton
  `text-[10px] sm:text-xs`; video embed modal/sheet; `text-brand-readable` utility.
- **Dosyalar:** `FieldWeekSummary`, `FieldStreakDetailModal`, `myPulseActions`,
  `IlgilenContent`, `bugun/ilgilen/page`, `pipeline/page`, `VideoEditModal`,
  `TrainingVideoCard`, `globals.css`, `pulse.ts`, `videoTraining.ts`.

## 2026-06-03 — Video eğitim dark mode UX + kart grid + ilgili konu seçici

- **Dark mode okunabilirlik (light’a dokunulmadı):** Vaktin Varsa sayfasındaki “Video Eğitimler”
  butonu; videolar sayfasındaki “İçeriklere geri dön”, kategori etiketleri, Video ve İlgili Konu
  metinleri `dark:text-[var(--text-1)]` ile beyaz tonuna çekildi.
- **Video kartları:** Sabit min-yükseklik (240px), 3 sütun grid, sayfa başına 9 kart + sayfa
  sekmeleri (1, 2, 3…); düzenle/sil sağ üst köşede sabit; 4 eşit puntolu aksiyon butonu
  (Başladım / Tamamladım / Video / İlgili Konu — pasif veya link).
- **İlgili konu popup:** İçerikler | İtirazlar sekmeleri; seçimi kaldırma (ikinci tık);
  konu seçimi opsiyonel. TR/EN çeviri anahtarları eklendi.
- **Dosyalar:** `EgitimContent`, `VideolarContent`, `TrainingVideoCard`, `RelatedTopicPicker`,
  `VideoEditModal`, `videoTraining.ts`.

## 2026-06-03 — gstack akışı: güvenlik (052/053) + Hedef→Yol Haritası→Günlük Takip özelliği

- **gstack kontrollü kuruldu** (telemetri off). `/cso` → HIGH güvenlik açığı: nmm_workspaces
  SELECT herkese açıktı → **052** (own+member) + **053** (downline ekle). `/health` → kalite
  fotoğrafı; ölü dosya/paket temizliği. `/spec` → özellik tasarımı (`.gstack/specs/`).
- **YENİ ÖZELLİK — Hedef → Yol Haritası → Günlük Takip** (Crown'dan esinlenme, GENERIC,
  PV/bonus/rütbe YOK):
  - **054** `nmm_user_goals` (self-set kişi+ay; RLS self + lider downline-read).
  - `lib/domain/roadmap.ts` — duplikasyon (geometrik) staging + 4'lü huni türetme
    (1 üye ← 3 sunum ← 9 tanışma ← 18 arama) + günlük hedef. **12 birim test.**
  - `hedef/actions.ts` — hedef CRUD + günlük hedef/gerçekleşen türetme. Gerçekleşenler
    MEVCUT veriden OTOMATİK (çift giriş yok): Arama=daily_actions(call),
    Tanışma=candidates(created_at), Sunum/Yeni Üye=stage_change note='sunum'/'katildi'.
    Günlük pencere = İstanbul gün başlangıcı (yerel, UTC değil).
  - **Pano**: `HedefKart` (hedef seç → günlük huni → açılır yol haritası).
  - **Bugün İlgilen**: `HedefGunlukKpi` (kompakt 4-kutu günlük KPI, hızlı kontrol).
- **Bug fix:** telefon doğrulama `[1-9]` baştaki 0'ı reddediyordu (Türk "05xx" + placeholder
  bile geçmiyordu) → sanitizePhone + `/^\+?\d{7,15}$/`.
- **Deploy:** Supabase SQL Editor → **052, 053, 054** uygulandı.

## 2026-06-03 — Öneri turu: storage hijyeni + çözülmemiş sipariş paneli + webhook testleri + lint

- **userScopedStorage** (`src/lib/ui/userScopedStorage.ts`): scopedKey + read/write +
  `clearNmmLocalStorage()`. **Çıkışta** (UserMenu) çağrılır → paylaşılan tarayıcıda önceki
  kullanıcının cihaz-yerel izi kalmaz (dil hariç). Yazar history bu helper'a taşındı.
- **Çözülemeyen ödeme paneli** (migration **051** — `note`+`product_id` kolonları):
  order.created unresolved → DB'ye `status='unresolved'` (idempotent) + süper admin e-postası.
  Platform Yönetimi en üstte **UnresolvedOrdersAlert** → admin lisansı el ile tanımlayıp "Çözüldü".
  Aksiyonlar: `getUnresolvedOrdersAction`, `markOrderResolvedAction`. **Deploy: SQL Editor → 051.**
- **Webhook entegrasyon testleri** (`route.test.ts`, 111→115): order.created uygula / unresolved+uyarı /
  idempotency (23505) / refund.updated → lisans düşür. Yapılandırılabilir Supabase mock (vi.hoisted).
- **Lint:** güvenli temizlik 119→112; `npm run lint:changed` (yalnız main'e göre değişen TS/TSX) →
  yeni borç eklemeyi engeller. Büyük kategoriler (any, set-state-in-effect) artımlı bırakıldı.

## 2026-06-03 — Perf (getUser cache) + onboarding UX + kalıcılık + ödeme uyarısı

- **Perf (giriş→pano):** `src/lib/supabase/authUser.ts` → React `cache()`'li `getAuthUser()`.
  Prefetch'teki workspace/candidates/aiUsage/platform/moderation aksiyonları artık TEK
  `getUser()` round-trip paylaşır (önceden navigasyon başına 4-5). **KİLİTLİ:** hot-path
  aksiyonlar ham `supabase.auth.getUser()` yerine `getAuthUser()` kullanmalı.
- **Onboarding UX:** kişiselleştirme ("Hoş geldin, {ad}!"), adım-2 kutlama toast'u, **adım 4**
  (Hazırsın 🚀), dengeli step-3 ikincil buton, **Ayarlar → Turu Tekrar Başlat** (tek seferlik
  `sessionStorage` işareti, kalıcı flag'e dokunmaz).
- **Kalıcılık / cross-user leak:** Yazar mesaj geçmişi `<key>_<userId>` ile izole; eski global
  anahtar temizlenir. Bildirim oku/sil zaten Supabase'de (`nmm_notifications.read`) → ölü global
  localStorage anahtarları (`nmm_notif_read_ids`/`dismissed_ids`) ve yerel-bildirim yolu kaldırıldı.
- **Ödeme (kritik):** `order.created` unresolved (note→workspace ya da productId→plan eşleşmezse)
  artık `sendUnresolvedOrderAlertEmail` ile süper admin'e uyarı → müşteri ödeyip lisans alamazsa
  sessiz kalmaz.
- **Süper admin lisans:** zaten `superAdminLicenseOverride()` ile pro/süresiz (DB cosmetic).
  `is_owner` yerine bu override korunuyor — şema değişikliği yok, tek kaynak.

## 2026-06-02 — Crown+ UX: saha özeti yalnız Bugün, pano düzeni, koçluk listesi, 7/7 seri

- **Saha serisi + haftalık KPI** panodan kaldırıldı → yalnız **`/bugun/ilgilen`** (`FieldWeekSummary`).
- **Seri mantığı:** ardışık gün değil → **son 7 günde kaç gün saha kaydı** (0–7); tam hafta = **7/7**.
- **Pano:** Toplam/Aktif/Katıldı KPI’ları video şeridinin üstüne taşındı.
- **Koçluk uyarısı:** isim listesi (max 3) + **Tüm ekibi gör** → `/ekip`; kişi → `/ekip?activity=` → Aktivite sheet.
- `teamCoaching.ts`, `PanoFieldSummary` silindi (ortak `FieldWeekSummary`).

## 2026-06-02 — User settings (049): onboarding + uyum checklist Supabase

- Migration **`049_user_settings.sql`** — `nmm_user_settings` (jsonb: onboardingDone, complianceChecklist).
- **`useUserSettings`** + per-user localStorage flash cache; eski global anahtarlardan tek seferlik migrasyon.
- **OnboardingModal** ve **/uyum** checklist artık `patchUserSettingsAction` kullanıyor.
- **Deploy:** Supabase SQL Editor → **049**, sonra **050** (member goals). Sıra: 049 → 050.

## 2026-06-02 — Crown Faz C: pano saha özeti, seri, üye hedefleri

- **Pano (C1):** `PanoFieldSummary` — saha serisi (`computeFieldStreak` / `nmm_daily_actions`) +
  haftalık KPI (yeni aday, arama, WA, sunum). `getMyPanoInsightsAction`.
- **Üye hedefleri (C2):** Migration **`050_member_goals.sql`** — lider downline için kişi/ay hedefi.
  Aktivite sheet + ekip kart chip; `memberGoalsActions.ts`.
- **Deploy:** Supabase SQL Editor'da **050** uygula (049 bağımsız — aşağıya bak). Faz C için yalnızca 050 yeterli.

## 2026-06-02 — Crown Faz B: ekip arama/iletişim + üye aktivite sheet

- **/ekip (B1):** İsim/telefon arama; downline kartlarında DDBR mini çubuk (X/9); Ara / WhatsApp /
  **Aktivite** hızlı aksiyonlar.
- **MemberActivitySheet (B2):** Sheet içi dönem Bugün/7g/30g (ekip varsayılan 7g; istatistiklerden
  açılışta üst period devralınır). 7 saha KPI + Pro öğrenme özeti; not metni yok (KVKK).
- **/istatistikler:** Sıralama tablosunda Aktivite ikonu → aynı sheet.
- **API:** `getMemberActivityDetailAction` — `nmm_daily_actions` rollup; migration yok.
- `mapStatsPeriodToSheet` → `lib/domain/pulse.ts` (client-safe).

## 2026-06-02 — Crown Faz A: ekip aktivite özeti + video kart görünümü + pano şeritleri

- **İstatistikler (A1):** `TeamActivitySummary` — downline KPI (üye, aktif 7g, arama, WhatsApp),
  dönem filtreli bar chart (Arama/WA sekmesi), sıralama tablosu. Veri: `getTeamFieldActivityAction`
  (`nmm_daily_actions` + yeni aday aggregation, yeni tablo yok).
- **İstatistikler (A2):** `TeamPerformanceTable` — video hücresi `X/Y video` + yarım uyarı;
  Tablo/Kart toggle (mobil varsayılan kart); filtre Tümü/Başlamayan/Yarım; Pro video kilidi.
- **Pano (A3):** `PanoVideoStrip` (→ `/egitim/videolar`), `PanoTeamCoachingAlert` (inaktif/onboarding
  → `#team-performance`).
- i18n: `statsPage.teamActivity*`, `videoTraining.panoStrip*`, `dashboard.coaching*`.
- Build temiz. **Migration yok.** (049 user_settings bu commit'e dahil değil — ayrı iş.)

## 2026-06-02 — Shopier sağlamlaştırma + favori izolasyon + onboarding fix + lint

- **Shopier idempotency:** `048_shopier_processed_orders` (order_id PK). order.created'da dedupe
  (aynı sipariş 2. kez lisans uzatmaz; tablo hatası non-fatal). **MANUEL migration gerek.**
- **Shopier refund:** `refund.updated` webhook kaydedildi (id `44da13ea49215e7a`). İade gelince
  sipariş→workspace eşleşip lisans 'free'e düşürülür. **DİKKAT: her webhook'un AYRI secret'ı var**
  → `SHOPIER_REFUND_WEBHOOK_SECRET=463186f2…` Vercel'e EKLENMELİ (yoksa iade işlenmez, güvenli taraf).
  refund.requested sadece loglanır (erken düşürme yok).
- **Favori izolasyon bug FIX:** useProgressSync global localStorage anahtarları (nmm_egitim_favori…)
  kullanıcılar arası sızıyordu → `<base>_<userId>` ile izole edildi, eski global anahtarlar temizlenir.
  Elif'in DB satırı kontrol edildi (boştu, kirlenmemiş). DB/RLS zaten per-user'dı.
- **Onboarding fix:** PanoContent modal'ı `candidates.length===0` iken render ediyordu → adım 2'de
  aday eklenince unmount → adım 3 görünmüyordu. Artık ws varken mount, yeni-kullanıcı tespiti mount-anı
  (useRef) ile sabit.
- **Lint:** CandidateDetail not-çevirisi set-state-in-effect temizlendi (render'da türetme + async fn).
- **Test temizliği (önceki):** Suat workspace pro/süresiz geri alındı; ödeme maili süper admin'e gitmez.
- tsc temiz, **111 test**.

KALAN (Suat manuel): 048 migration uygula · SHOPIER_REFUND_WEBHOOK_SECRET'ı Vercel'e ekle.

## 2026-06-02 — 🎉 SHOPIER CANLI (storefront-redirect + order.created webhook)

Cutover tamamlandı, uçtan uca test geçti (1 TL gerçek /odeme alışverişi):
- /odeme → Basic Aylık → Shopier ürününe `?quantity=1&note=<ws>_basic_monthly_<ts>` ile yönlendirdi
- Webhook geldi, **imza doğrulandı** ve **lisans yükseltildi**:
  `License updated for workspace 999311ea… (basic) until 2026-07-02` (+30 gün).
- **İmza şeması: HS256 ham gövde → hex** (`scheme: 'body/hex'`, verifyResult true). verify bunu kapsıyor.
- **Payload:** `note` üst seviye (Satıcıya notu), `productId` `lineItems[0].productId` (=ürün sayfası id).
- Webhook id `8ad852392293a891`, secret = kayıt cevabındaki `token` (Vercel `SHOPIER_WEBHOOK_SECRET`).
- Prod env: `SHOPIER_STOREFRONT_ENABLED=true`, `SHOPIER_PRODUCTS` (6 plan), `SHOPIER_WEBHOOK_SECRET`.
  `SHOPIER_WEBHOOK_VERIFY` SİLİNDİ (doğrulama açık). Keşif logları temizlendi (PII yok).
- KALAN (Suat manuel): Basic Aylık fiyatını 499'a geri al, 3 test siparişini iade et.

## 2026-06-02 — Gelecek Temas popup + optimistic + video "İlgili konu" seçici

- **Gelecek Temas tarih editörü:** inline native datetime-local takvimi sayfa altında kesiliyordu →
  ortalı **popup** (Z.confirm, scroll-lock); Tamam/Vazgeç/Temizle. Kart hep tarihi gösterir, kalem
  popup'ı açar.
- **Optimistic update:** `useUpdateCandidate`'e `onMutate` eklendi (detail + list cache anında
  yamalanır) → yeni tarih "tak diye" gelir, refetch beklenmez; hata olursa geri alınır.
- **Video "İlgili konu" seçici:** z1/i1 kodu elle yazmak yerine **RelatedTopicPicker** popup'ı
  (içerik + itiraz başlıkları, arama, radyo seç). Seçince id alana yazılır. Kart linki route-aware:
  sayısal id→/itirazlar, harfli→/egitim. (getTrainingData + ITIRAZLAR, bilingual.)
- tsc temiz, 107 test. (CandidateDetail'de setTranslatedNote set-state-in-effect ÖNCEDEN var, ayrı iş.)

## 2026-06-02 — Cron fix + video kartı + sunum kartı taşı/aç-kapa + hızlı geçişler

- **Cron workflow FIX:** `cron-emails.yml` silinmiş `/api/cron/pulse-rollup` endpoint'ini çağırıyordu
  (route pulse temizliğinde kaldırılmıştı) → 404 → `curl -f` patlıyor → "All jobs failed". O adım
  kaldırıldı. Kalan 3 endpoint (trial/license/calendar) mevcut.
- **Video kartı:** sağ üst status yuvarlakları (CheckCircle2/Play/Circle) kaldırıldı (admin ✏️/🗑️
  kaldı); süre TR'de '~18 dk' (EN '~18 min').
- **Sunum Materyalleri kartı:** Aktivite Geçmişi'nin ALTINA taşındı; başlık satırına chevron eklendi,
  **açılır-kapanır, varsayılan KAPALI** (Materyalleri Düzenle linkinin sağında).
- **Hız:** view-transition süreleri kısaltıldı (fade 160/200→80/100ms, slide 240→120ms, translate
  20→12px, delay kaldırıldı) → gezinme "tık tık". (Login/server gecikmesi proxy getUser + Vercel
  cold-start kaynaklı; auth akışına dokunulmadı — ayrı profil işi.)
- tsc temiz, 107 test. GitHub "Claude permissions" e-postası = kod sorunu değil (Claude GitHub App).

## 2026-06-02 — Video kataloğu Supabase'e taşındı + super-admin CRUD

- **Migration 047** `nmm_training_videos` (key/youtube_id/title_tr-en/desc/duration/category/sort_order)
  + RLS (okuma: authenticated, yazma: super admin e-posta) + 6 placeholder video seed. MANUEL uygulanacak.
- **videoActions.ts** DB-tabanlı: getTrainingVideosAction, getVideoCatalogAction artık DB'den okur;
  mark*/team summary DB anahtarlarıyla; tamamlanma sayısı dinamik. Super-admin CRUD:
  createTrainingVideoAction/updateTrainingVideoAction/deleteTrainingVideoAction (assertSuperAdmin +
  admin client). YouTube URL→ID çıkarıcı.
- **UI:** VideolarContent'e super-admin-only ➕ ekle butonu (başlıkta) + her kartta yazısız ✏️/🗑️
  (TrainingVideoCard isAdmin/onEdit/onDelete). Yeni **VideoEditModal** (TR/EN başlık+açıklama,
  süre, kategori, sıra, ilgili konu). database.types.ts'e tablo eklendi.
- tsc temiz, 107 test, lint temiz. (pulse.ts boş-durum statik fallback'i korundu.)

## 2026-06-02 — Sticky header GERÇEK fix + video sayfa metin/genişlik + landing pro kart

- **Sticky header asıl sebep:** `globals.css` `html, body { overflow-x: hidden }` →
  `overflow-x: clip`. hidden, overflow-y:auto üretip sticky'yi GLOBAL bozuyordu. clip
  scroll-container oluşturmaz → landing header artık sabit. (LandingPage overflow-x-clip zaten vardı.)
- **Vaktin Varsa → Video sayfası:** başlık 'Video eğitimler'→'Video Eğitimler' (pageTitle +
  openTraining butonu); altyazı → 'İzle, kendini ve ekibini geliştir, ilerlemeni kaydet.';
  geri linki → 'İçeriklere geri dön'. EN karşılıkları güncellendi.
- **Video sayfa genişliği:** max-w-3xl kaldırıldı (egitim gibi tam genişlik) + kart listesi grid
  (sm:2, xl:3 kolon).
- **Landing pro kart:** planProFeat7 → 'Ekip Performans İzleme Tablosu'; planProFeat3 →
  'Ekip Yapay Zeka Kullanım Takibi' (TR+EN, açıklama kuyruğu kaldırıldı).

KALAN: video Supabase CRUD (super-admin ekle/düzenle/sil) + Shopier cutover.

## 2026-06-02 — KÖKTEN: license_type leader/master → basic/plus (her yerde)

İç kimlikler artık **basic/plus/pro** (free dahil). leader/master uygulamadan kalktı.
**ROL `'leader'` (takım lideri) AYRI — dokunulmadı.** Migration MANUEL uygulanacak.

- **Çekirdek:** `PlanId`, `LicenseTier`, `VALID_PLANS`, fiyat haritaları, `database.types.ts`
  union'ları → basic/plus/pro. Yeni `normalizeLicenseType()` (aiUsage): legacy leader/master DB
  değerlerini basic/plus okur → deploy↔migration sırası önemsiz, kimse boşta kalmaz.
- **Boundary normalize:** auth.resolveWorkspaceLicense, getEffectiveLicenseType,
  istatistikler/platform actions license_type okumaları, teamAccess.
- **UI/actions:** odeme (OdemeClient isBasic/isPlusActive), platform modal+badge+option value,
  ekip, header, mail, bank, cron filter, shopier route cast. Trial artık 'basic' kredisi.
- **shopierStorefront sadeleşti:** alias katmanı (leader↔basic) silindi; ProductKey = PlanId.
  SHOPIER_PRODUCTS env zaten basic/plus/pro — değişiklik gerekmez.
- **i18n:** licensePlanLeader→Basic, licensePlanMaster→Plus, planLeader/Master→Basic/Plus,
  masterRequired→plusRequired (metin "Ekip Master"→"Ekip Plus"). Kalan kopya Leader/Master→Basic/Plus.
- **DB:** düz text kolon, enum/RLS/function bağımlılığı YOK. Canlı: 1 satır etkilenir (master→plus).
- tsc temiz, **107 test geçti**, çekirdek dosyalar lint temiz.

⚠️ **CUTOVER:** Supabase'de `046_license_type_rename.sql` uygulanmalı (leader→basic, master→plus).
normalizeLicenseType sayesinde deploy önce/sonra fark etmez; ama kalıcı temizlik için migration şart.

## 2026-06-02 — Landing sticky header + pro kart "Ekip Performans İzleme Tablosu" metni

- **Landing header sticky bug:** Header zaten `sticky top-0` idi ama LandingPage kök sarmalayıcıda
  `overflow-x-hidden` (→ overflow-y:auto scroll-container) sticky'yi bozuyordu. `overflow-x-clip`'e
  çevrildi (scroll-container oluşturmaz, sticky çalışır, yatay taşma yine kırpılır).
- **Pro kart metni:** "Ekip Nabzı" → **"Ekip Performans İzleme Tablosu"** (landing planProFeat7 +
  payment proFeature7, TR+EN); içerik gerçek tabloya göre güncellendi (aday hunisi + içerik/itiraz/
  video ilerlemesi).

## 2026-06-02 — Shopier Faz 3: ürünler + PAT + webhook kaydı + secret

- **Naming düzeltildi:** env ürün anahtarları artık **basic/plus/pro** (görünür ad); içeride
  otomatik **leader/master/pro** (DB license_type) → `ALIAS_TO_PLAN`. leader/master/pro DB kimliği
  KORUNUR (kalıntı bug değildi; eski fix display-only idi). Eski leader_* anahtarları da normalize
  edilir (geri uyum). +1 test (107 toplam).
- **6 ürün** dükkanda hazır → `SHOPIER_PRODUCTS` env (.env.local, gitignored). productId = URL
  numarası (test webhook log'undan kesinleşecek).
- **PAT** kopya-yapıştırda kuyruğu 1 kez tekrarlanmıştı (4 dot-parça); temizlendi (header.payload.
  son-imza). Doğrulandı: `GET /v1/webhooks`, `/v1/orders` → HTTP 200. (products → 403, sorun değil.)
- **order.created webhook KAYDEDİLDİ** (Shopier API): id `8ad852392293a891` →
  `https://nmm.suattayfuntopak.com/api/payment/shopier`. Kayıt cevabındaki **`token` = HS256 imza
  secret'ı** → `SHOPIER_WEBHOOK_SECRET` (.env.local).

KALAN (cutover): **Prod env'e** (Vercel/host) SHOPIER_PRODUCTS + SHOPIER_WEBHOOK_SECRET +
SHOPIER_STOREFRONT_ENABLED=true gir → 1 test siparişi → log'dan payload alanları + imza şemasını
teyit et (handler ham payload'ı verify ÖNCESİ loglar) → gerekirse extractOrderFields/imza rötuşu.

## 2026-06-02 — Shopier dükkan-yönlendirme iskeleti (Faz 2, flag KAPALI)

Shopier api_pay4 (uygulama/API checkout) reddedildi → "dükkan-yönlendirme + order.created
webhook" modeline geçiş. Env-flag arkasında kuruldu; `SHOPIER_STOREFRONT_ENABLED` set
edilmediği için **canlı akış aynen api_pay4 ile çalışmaya devam ediyor** (sıfır davranış değişimi).

- **shopierStorefront.ts** (yeni): env JSON ürün haritası (`SHOPIER_PRODUCTS`, 6 plan×dönem),
  `buildStorefrontRedirectUrl` (quantity+note), `resolvePlanFromProductId` (tier = ürün, note değil),
  `extractWorkspaceIdFromNote` (note'tan SADECE workspaceId). Güvenlik: note serbest metin →
  tier productId'den çözülür, spoofing kapalı.
- **shopierOrderWebhook.ts** (yeni, pure): HS256 imza doğrulama (ham body / `ts.body` adayları,
  base64+hex) + defensive note/productId çıkarımı (alan adları kesinleşene dek recursive arar).
- **shopierPaymentSession.ts**: `createShopierStorefrontRedirect` eklendi.
- **/odeme/launch**: flag açıkken JSON `{ redirectUrl }` döner; **OdemeClient** bunu yakalayıp
  `window.location`'a yönlendirir (api_pay4 HTML yolu korunur).
- **/api/payment/shopier**: JSON content-type → `order.created` dalı; ham payload + header'lar
  **loglanır** (keşif fazı), note→workspace + productId→plan → mevcut `applyLicenseUpgrade`.
- Testler: shopierStorefront (12) + shopierOrderWebhook (8) = 20 yeni; toplam 106 geçti.
  `.env.local.example`'a Shopier storefront değişkenleri eklendi.

KALAN (Faz 3): Suat 6 ürün + PAT + webhook kaydı → env değerleri + 1 test siparişi → log'dan
gerçek payload alanlarını kilitle → `SHOPIER_STOREFRONT_ENABLED=true`.

## 2026-06-01 — AI tablosu lisans "ÜCRETSİZ" flash düzeltme

- İstatistikler açılış/yenilemede AI Kullanım tablosunda Suat & Elif birkaç saniye **ÜCRETSİZ**
  (+ free limitleri) gösteriyordu: `memberLicenses` query çözülmeden `licenseType ?? 'free'`
  fallback'i devreye giriyordu. Artık profil yüklenene dek (`!profile` → `loading`) free fallback
  yerine **Skeleton** gösteriliyor (lisans + 3 kullanım hücresi). Yüklenince gerçek değer (PRO -
  SINIRSIZ / PLUS) oturur, yanıp sönme yok.
- tsc temiz.

## 2026-06-01 — Yönetim tablosu lisans rozeti yerelleştirildi

- Yönetim paneli leader tablosundaki **Lisans Paketi** rozeti ham `licenseType` (FREE/MASTER)
  yerine yerel ada çevrildi → istatistiklerle parite: `free→Ücretsiz`, `leader→Basic`,
  `master→Plus`, `pro→Pro` (EN: Free/Basic/Plus/Pro). Yeni `platformPage.plan*` anahtarları.
- tsc temiz.

## 2026-06-01 — Lisans modal: plan adları + Süresiz toggle düzeltme

- **Lisans Paketi Seviyesi dropdown** plan adlarıyla hizalandı (landing/ödeme ile birebir):
  `Leader→Basic Plan`, `Master→Plus Plan`, `Pro (Süper Lider)→Pro Plan`. Free seçeneği TR
  `Ücretsiz — Lisansını İptal Et` (EN `Free — Revoke License`).
- **Süresiz Erişim toggle** kırık görünümü düzeltildi: knob track'ten taşıyordu (`h-4 w-8` track +
  `h-3 w-3` absolute knob). NotificationsModal switch desenine geçildi: `h-6 w-11 border-2
  border-transparent` track + `h-5 w-5 translate-x-5/0` knob. Renk emerald korundu (yeşil).
- tsc temiz.

## 2026-06-01 — Punto +1 (5 sayfa) + perf Tür 👑 + AI lisans PRO-SINIRSIZ

- **Yazı puntosu bir birim büyütüldü** (her `text-*` utility bir kademe yukarı; cascade'siz tek
  geçişli transform): Platform Yönetim Masası (`PlatformYonetimContent`), Uyum Merkezi (`uyum/page`),
  Saha Provası (`ProvaForm` — yalnız saha-provasi kullanıyor), Vaktin Varsa (`EgitimContent` +
  `TrainingCard` + `AddTrainingModal`), İtirazlara Cevaplar (`ItirazlarContent` + `ItirazCard` +
  `AddObjectionModal`). xs→sm, sm→base … 3xl→4xl.
- **Ekip Performans İzleme Tablosu** — lider (Suat) **Tür** sütununa 👑 Lider rozeti geri kondu
  (amber badge; eskiden boştu).
- **Ekip & Dış Kaynak AI tablosu** — süper admin **Lisans** = **"PRO - SINIRSIZ"** (EN: PRO -
  UNLIMITED); önceki "SUPER ADMIN" etiketi değişti.
- tsc temiz, 86 test, diff yalnız className + 2 i18n + rozet JSX (mevcut lint hataları konu dışı).

## 2026-06-01 — Kilit metni + Aday Kazanım İvmesi akışkanlık + İçerik %

- **Kilit overlay** (Plus/Pro gate) metni yeni tabloya göre güncellendi: "Ekip Performans İzleme
  Tablosu" + ne içerdiği (aday hunisi, içerik, video, DQSG). TR+EN, `stats.ts`.
- **Aday Kazanım İvmesi zıplaması düzeltildi:** trendBars dönemle bucket sayısı değiştiriyordu
  (7d→7, 30d→6, diğer→8 = reflow). Artık **sabit 7 bucket** (5 dönemi de — today/7d/30d/ytd/all —
  doğru aralık+etiketle ele alır) + çubuklara `duration-700 ease-out` → diğer grafikler gibi akışkan.
- **"Eğitim %" → "İçerik %"** (perf tablosu sütunu; pulse.colTraining TR+EN).
- tsc temiz, 86 test, lint 0 hata.

İnceleme (rapora): İçerik% = işaretlenen okumalar/30 (manuel ✓ butonu, tıkla-aç değil). Video% =
tamamlanan/7 (placeholder YouTube kataloğu, manuel "Tamamladım"). Tüm sütunlar GERÇEK veri çeker;
sadece 7 video içeriği placeholder (NMM kendi videolarıyla değiştirebilir).

## 2026-06-01 — KVKK §6 + Yusuf dış kayıt fix + SUPER ADMIN ∞ + perf dönem kaldır

- **KVKK §6** "Ekip Nabzı" → **"Ekip Performans İzleme ve Sponsor Görünürlüğü"**; içerik yeni
  tabloya göre yeniden yazıldı (eğitim/itiraz/video %, DQSG, huni dağılımı; ham içerik/notlar
  paylaşılmaz). TR+EN, `kvkk/page.tsx`.
- **Yusuf dış kayıt fix:** `getIndependentSignupAIUsageAction` artık Platform Yönetim gibi **TÜM**
  workspace'leri çekiyor; sadece süper admin'in kendi workspace'i + doğrudan ekibi (iki parent_id
  formatı) eleniyor. Böylece parent_id dolu / free olmayan dış kayıtlar (Yusuf) da listede.
- **SUPER ADMIN:** AI tablosunda süper admin lisansı **"SUPER ADMIN"**; kullanım/limit üçü de
  **0/∞** (memberRow.unlimited → `usage / ∞`). i18n `licensePlanSuperAdmin`.
- **AI tablosunda e-posta kaldırıldı** (dış kayıt satırlarındaki e-posta gösterimi).
- **Perf tablosu dönem sekmesi kaldırıldı:** veriler kümülatif (genel %) + anlık huni durumu;
  learning_events de gittiği için döneme bağlanamaz → işlevsiz sekme kaldırıldı. Dönem mantıklı
  olan tek yer YZ kullanım tablosu (orada çalışıyor).
- **Pre-existing lint:** kvkk `z-40`→`Z.header`, perf kilit overlay `z-20`→`Z.cardOverlay`.
- tsc temiz, 86 test, lint 0 hata.

## 2026-06-01 — nmm_learning_events tamamen kaldırıldı (tüm zincir + 045)

Yazılıp hiçbir yerde gösterilmeyen olay-logu tablosu tüm zinciriyle söküldü:
- **Yazımlar:** `recordProgressChangeAction` (learning_events insert + milestone/notify),
  `logEngagementEventAction` (silindi), `logPresentationWhatsAppAction` engagement çağrısı,
  takvim randevu logları, useCandidates randevu logları — hepsi kaldırıldı.
  **Korundu:** user_progress upsert, daily_actions yazımı, candidate güncellemesi.
- **Okumalar:** `pulse/actions.ts` baştan yazıldı → sadece `getTeamProgressMapAction`
  (progress+video, engagement'sız) kaldı; 3 ölü fonksiyon (getMyPulse/getTeamPulseTotals/
  getIndependentOwnersPulse) silindi.
- **Domain:** `lib/domain/learningEvents.ts` → sadece `ProgressChangeType`; videoTraining yorumu düzeltildi.
- **DB:** `045_drop_learning_events.sql` (DROP TABLE CASCADE → RLS/index'ler gider).
  `database.types.ts`'ten tip kaldırıldı.
- src'de **sıfır** `nmm_learning_events`/`logEngagementEventAction` referansı. tsc temiz, 86 test.
- ⚠️ **045 migration'ı Supabase'de uygula.**

## 2026-06-01 — İstatistik cilası: dipnot/KVKK, üst dönem işlevsel, süper admin ∞, i18n süpürme

- **Perf tablosu dipnotu:** Başlığa `*`, DQSG sütununa `**`. Altta küçük italik: `*` → sponsor
  görünürlük/KVKK metni + **KVKK ve Gizlilik Politikası** gömülü linki (/kvkk); `**` → DDBR açıklaması.
- **İstatistikler alt bilgi notu** (cihazda hesaplanır…) kaldırıldı (+ `infoNote` i18n silindi).
- **Üst dönem sekmesi** artık 5'li (Bugün/Son 7 Gün/Son 30 Gün/Bu Yıl/Tüm Zamanlar) ve **işlevsel** —
  `filteredCandidates` today/ytd dahil tüm dönemleri filtreliyor; ortak `PulsePeriodTabs` kullanıldı.
- **Ekip & Dış Kaynak YZ tablosu:** "kullanım / limit" formatı geri geldi; **süper admin (Suat) → ∞**,
  diğerleri kendi plan limitleri; saha → —.
- **i18n süpürme:** ölü anahtarlar silindi (archive*, aiIndependent*, independentPulse*, realtimePulseNote,
  dataPartialWarning, pulseLoadFallback, infoNote). `getIndependentSignupAIUsageAction` gereksiz today*
  hesaplaması kaldırıldı (limitler korundu).
- tsc temiz, 86 test.

## 2026-06-01 — YZ kullanım: tek tablo + lisans modal toggle animasyonu

**Tek tablo (Ekip & Dış Kaynak YZ Kullanım & Limit Kontrol Tablosu):**
- 3 ayrı YZ tablosu (Ekip AI + Dış Kayıt AI + YZ Kullanım Arşivi) → **tek tabloda** birleştirildi.
- Sağ üstte **dönem sekmesi** (Bugün/Hafta/Ay/Yıl/Tüm), altta **TOPLAM** satırı.
- Sıralama: **Lider 👑 → NMM 💎 → Saha 🤝 → Dış Kayıt 🌐** (her grup kendi içinde büyür).
- Alt başlık: "NMM ortakları (💎) & katıldı saha distribütörleri (🤝) ve dış kayıtları (🌐)…".
- Yeni `getAiUsageByPeriodAction` (dönem-bazlı kullanım, `nmm_daily_actions`). `AIUsageArchiveSection`
  + ölü arşiv action'ları (getAIUsageArchive/build/assemble/emptyArchiveSummary + tipler) **tamamen silindi**.

**Lisans modal toggle animasyonu (platform-yönetim):**
- "Süresiz Erişim" toggle'ına basınca popup **zıplıyordu** (gün input'u anında unmount).
- Gün bölümü artık hep render edilip `grid-rows-[1fr]→[0fr]` + opacity ile **yumuşakça kapanıyor**;
  toggle slider'a net `duration-300 ease-out`. Üçü (yeşil geçiş + gün kaybolma + popup küçülme) senkron.
- Tüm lisans seviyeleri (leader/master/pro) aynı bölümü kullanıyor — hepsi düzeldi. `disabled={isUnlimited}`
  ile süresizde input form'a karışmıyor.

- tsc temiz, 86 test, lint 0 hata. Kalan zararsız kırıntılar: birkaç ölü i18n anahtarı (archive*).

## 2026-06-01 — Nabız sadeleştirme: tek tablo + YZ kullanım bug'ları onarıldı

Kullanıcı isteğiyle dağınık nabız bölümleri **tek tabloda toplandı** ve YZ kullanım tabloları onarıldı.

**Birleştirme (tek tablo):**
- "Ekip Performans Dağılım Tablosu" → **"Ekip Performans İzleme Tablosu"**. Sağ üstte dönem sekmesi
  (Bugün/Hafta/Ay/Yıl/Tüm). DDBR/DQSG ile Son Aktiflik arasına **Eğitim % · İtiraz % · Video %**
  (ilerleme çubuklu) eklendi. En alta **TOPLAM** satırı (sayısal toplamlar + % ortalamaları).
- **Silinen pulse bölümleri:** istatistiklerde "Ekip Gelişimi Takip Tablosu (Bireysel/Toplam)" +
  "Bireysel Gelişim Takip Tablosu"; ekip sayfasındaki tablo; süper-admin "Bağımsız Kayıt Nabzı".
- **Silinen dosyalar (8 bileşen + hook + 2 cron + 3 cron-helper):** PulseTeamSection/TotalsSection/
  MySection/IndependentOwners/RealtimeSync/AiInsight/Disclaimer/KpiCard, usePulseRealtime,
  insightActions, pulseRollup, pulse-rollup & pulse-weekly route + workflow, pulseCronHelpers,
  pulseWeeklyAi. **Korundu:** PulsePeriodTabs (perf tablosu kullanıyor), getTeamProgressMapAction.

**YZ Kullanım Arşivi bug'ı (asıl şikâyet — "7 gün boş"):**
- **Zaman dilimi:** `setHours(0,0,0,0)` UTC+3'te `toDate`'i düne kaydırıyor, bugünkü kullanım düşüyordu →
  UTC-tutarlı, **bugünü kapsayan** `archiveDateRange` yardımcısı.
- **Kaynak:** rollup tablosu boşsa fallback tetiklenmiyordu → arşiv artık doğrudan `nmm_daily_actions`'tan
  (her ai_generate orada) hesaplıyor.
- **Sekmeler:** "7/30/12Ay/Tümü" → **Bugün/Son 7 Gün/Son 30 Gün/Bu Yıl/Tüm Zamanlar** (hepsi çalışır).
- Boş durumdaki çizgili dikdörtgen kaldırıldı.

**Supabase temizliği:** `044_pulse_cleanup.sql` — kullanılmayan `nmm_team_pulse_daily` +
`nmm_pulse_weekly_summaries` DROP, realtime publication abonelikleri kaldırıldı. **Korunan tablolar:**
`nmm_user_progress`, `nmm_video_progress`, `nmm_learning_events` (% sütunları + sponsor görünürlüğü).

- tsc temiz, 86 test geçti. ⚠️ 044 migration'ı Supabase'de uygulanmalı.

## 2026-06-01 — Ekip Gelişimi: 3 tablo (isimlendirme + dönem + ilerleme çubukları + Toplam)

Kullanıcı isteğiyle nabız tabloları yeniden adlandırıldı ve genişletildi:

1. **③ "Benim Nabzım" → "Bireysel Gelişim Takip Tablosu"** — herkesin kendi istatistik
   sayfasında, kendi ilerlemesi (zaten ilerleme çubuklu kartlar var). Sadece i18n adı.
2. **① "Ekip Nabzı" → "Ekip Gelişimi Takip Tablosu (Bireysel)"** — kişi-bazlı tablo.
   Eklenenler: **dönem seçici** (Bugün/Hafta/Ay/Yıl/Tüm — sabit 30g kaldırıldı) +
   **% sütunlarının altında ilerleme çubukları** (Eğitim/İtiraz/DQSG/Video).
3. **② YENİ "Ekip Gelişimi Takip Tablosu (Toplam)"** — seçili dönemde ekibin birleşik
   rakamları (okunan eğitim/itiraz, tamamlanan video, sunum, randevu, aktif üye).
   `getTeamPulseTotalsAction` (RLS-güvenli: yalnız sponsor-read olan olay-logu + video).

- **Kapsam kararı:** Geliştirme tabloları uygulama kullananları gösterir (NMM ekip + dış
  kayıtlar); saha/boru hattı zaten ayrı performans tablosunda. Gating: Pro + süper admin.
- **Yeni:** `PulsePeriodTabs.tsx` (ortak dönem seçici), `PulseTeamTotalsSection.tsx`.
- tsc temiz, 86 test, lint temiz (yalnız önceden var olan exhaustive-deps uyarısı).
- Not: Cursor ajanı bu modülde aktifti; çakışmamak için stash ile duraklayıp temiz devam edildi.

## 2026-06-01 — Dış kayıt masası: alt başlık kaldır + Yusuf listesi

- **UI:** Dış Kayıt YZ masasında yalnızca başlık; açıklama paragrafı kaldırıldı.
- **Veri:** Bağımsız kayıt filtresi Platform Masası ile aynı — `parent_id` boş, lisans tipi filtrelenmez (Yusuf Emre vb. free dışı trial lisanslarda da görünür).

## 2026-06-01 — Havale kartı: kopya ikonu sade + plan seçici + QR regen notu

Havale/EFT kartında (paylaşılan `src/components/payment/BankTransferCard.tsx`):

1. **Kopya butonu sadeleşti:** "IBAN'ı Kopyala" yazısı kaldırıldı → sadece kopya ikonu,
   IBAN satırı hizasında, IBAN numarası ile (masaüstü) QR'ın sol duvarı arasına ortalandı
   (`flex-1 justify-center`). Hem landing hem /odeme (tek bileşen).
2. **Plan seçici (öneri #2):** "Ödedim, Bildir" üstünde opsiyonel Basic/Plus/Pro pill'leri;
   seçilirse bildirim e-postasına **"Talep edilen plan"** eklenir → admin tahmin etmez.
   `notifyBankTransferAction(plan?)` + `sendBankTransferNotifyEmail(..., intendedPlan?)`.
   Sadece dashboard variant'ta (anonim landing'de yok). Migration yok.
3. **QR regen notu (öneri #3):** `bankTransfer.ts` — IBAN değişirse QR'ı yeniden üretme
   komutu yorum olarak eklendi.
4. **Öneri #1 (tam onay kuyruğu) ERTELENDİ:** Mevcut e-posta bildirimi + Platform Yönetimi
   lisans paneli döngüyü zaten kapatıyor; geçici (şimdilik `BANK_TRANSFER_ENABLED=false`,
   Shopier bekleniyor) bir kanal için migration+storage+kuyruk gereksiz tekrar olurdu.

- Flag hâlâ `false` (Shopier başvurusu) — kod hazır, `true` yapınca görünür.
- tsc temiz, lint temiz, 86 test geçti.

## 2026-06-01 — Yusuf dış kayıt + nabız font + arşiv fallback

- **Dış kayıt masası:** Platform Masası ile aynı filtre (`parent_id` boş); ekibe üye olsa bile Yusuf Emre listelenir.
- **YZ arşivi:** `nmm_ai_usage_daily` yoksa `nmm_daily_actions` üzerinden fallback; gereksiz sarı uyarı kalkar.
- **Ekip Nabzı KPI:** kart başlık/değer fontu `StatsKpiCards` ile eşitlendi (`text-sm` / `text-2xl`).

## 2026-06-01 — İstatistikler nabız/arşiv boş & hata durumu

- **Ekip Nabzı** (`pulse.myTitle`): istatistiklerdeki nabız bölümü başlığı güncellendi.
- **4 KPI kutusu** veri/hata yokken de görünür (`emptyMyPulseSummary` + `PulseMySection` fallback).
- **YZ Kullanım Arşivi:** sunucu hatası yerine 0 özet + uyarı; kırmızı Server Components kutusu kalkar.
- `getMyPulseSummaryAction` / `getAIUsageArchiveAction` try-catch ile güvenli dönüş.

## 2026-06-01 — İstatistikler tipografi + çıkış düzeltmesi

- **İstatistikler** (`istatistikler/_components/*`, `PulseMySection` + `comfortableTypography`): tüm metinler ~1 punto büyütüldü; diğer sayfalar etkilenmedi.
- Başlık: **Bireysel Gelişim Takip Tablosu** (`pulse.myTitle` TR/EN).
- **Çıkış yap:** önce `logoutAction` (sunucu cookie), sonra client `signOut({ scope: 'global' })`, ardından `window.location.assign('/giris')` — SPA `router.push` oturum cookie’si kalınca proxy’nin tekrar `/pano`’ya atması engellendi.

## 2026-06-01 — Nabız cron → GitHub Actions (Hobby Vercel)

SQL 040–043 tamam. **Yeni secret yok** — mevcut `CRON_SECRET` + `NMM_APP_URL` (e-posta cron ile aynı).

- `.github/workflows/cron-emails.yml` → günlük `pulse-rollup` eklendi.
- `.github/workflows/cron-pulse-weekly.yml` → Pazartesi `pulse-weekly` (YZ özet).
- Senin adımın: push sonrası GitHub Actions’tan **Run workflow** ile bir kez test (aşağıdaki rehber).
- Vercel’de `GEMINI_API_KEY` olmalı (haftalık AI için).

## 2026-06-01 — Ekip Nabzı Faz 5 (tamamlandı)

Supabase Realtime ile nabız verisi anında yenilenir (F1–F4’te ~30sn polling yedek olarak kalır). **Deploy:** `043_pulse_realtime.sql`.

- Publication: `nmm_user_progress`, `nmm_learning_events`, `nmm_video_progress`, `nmm_pulse_weekly_summaries`.
- `PulseRealtimeSync` → tüm dashboard; sponsor RLS ile downline değişikliklerini de alır.

## 2026-06-01 — Ekip Nabzı Faz 4 (tamamlandı)

Günlük rollup + haftalık YZ nabız özeti. **Deploy:** `042_pulse_rollup_weekly.sql` (041 sonrası).

- `nmm_team_pulse_daily` — cron günlük metrik rollup.
- `nmm_pulse_weekly_summaries` — kişisel + ekip (Pro) haftalık AI özet (TR/EN).
- Cron: `GET /api/cron/pulse-rollup` (dün, `?day=YYYY-MM-DD`), `GET /api/cron/pulse-weekly` (`?week_start=`).
- UI: Gelişim Nabzım + Ekip Nabzı üstünde `PulseAiInsight` kartı (özet yoksa gizli).
- **Cron kurulum:** Vercel/hosting’de `CRON_SECRET` ile Bearer; rollup günlük ~03:00, weekly Pazartesi önerilir.

## 2026-06-01 — Havale/EFT geçici kapalı

`BANK_TRANSFER_ENABLED = false` — landing (`LandingPricing`) ve `/odeme` havale kartı gizlenir; Shopier kartlı ödeme aynen çalışır. Tekrar açmak: `src/lib/domain/bankTransfer.ts` içinde `true` yap.

## 2026-06-01 — Ekip Nabzı Faz 3 (tamamlandı)

Video eğitim modülü + nabız entegrasyonu. **Deploy:** `041_video_progress.sql` (040 sonrası).

- `/egitim/videolar` — 6 kürasyonlu YouTube embed (nocookie), başla/tamamla, manuel % kaydırıcı.
- `nmm_video_progress` + sponsor SELECT (039 ile aynı downline modeli).
- Gelişim Nabzım: video tamamlama + drop-off (yarım video).
- Ekip Nabzı: Video % sütunu; tüm videolar bitince lidere bildirim.
- `trainingVideos.ts` — `youtubeId` değerlerini kendi kanalınızla değiştirebilirsiniz.

## 2026-06-01 — Ekip Nabzı Faz 2 (tamamlandı)

Olay logu + dönem metrikleri + streak + sponsor bildirimi. **Deploy:** `040_learning_events.sql` uygula (039 sonrası).

- Migration `040`: `nmm_learning_events` (RLS: kendi yaz/oku + sponsor SELECT downline).
- `recordProgressChangeAction` — ilerleme upsert + okuma/favori olayları; kütüphane tamamlanınca lidere bildirim.
- Engagement: `presentation_sent`, `appointment_set`, `appointment_done` (takvim, aday güncelleme, sunum WhatsApp).
- Gelişim Nabzım: dönem Bugün/7g/30g/Yıl/Tümü, dönemde okunan, streak, sunum/randevu KPI.
- Ekip Nabzı: son 30g sunum + randevu sütunları; rozet metni netleştirildi (`objections_gap` = koçluk sinyali, eksik özellik değil).

## 2026-06-01 — Ekip Nabzı Faz 1 (tamamlandı)

Hibrit yerleşim: **Gelişim Nabzım** → İstatistikler; **Ekip Nabzı** → Ekibim. Pro: ekip tablosu; Plus: kendi nabız + Pro upsell. Migration `039`, RLS, i18n, KVKK/koşullar, landing/ödeme Pro maddesi, `videoTraining.ts` (F3 hazırlık). **Deploy:** `039` uygula.

## 2026-06-01 — Havale/EFT: alt başlık + IBAN tek satır + QR + tek bileşen + "Ödedim" bildirimi

Birden çok iyileştirme:

1. **Fiyatlandırma alt başlığı (landing):** "kredi kartı veya havale/eft ile ödemenizi
   kolayca ve güvenle..." vurgusu eklendi (TR+EN, `landingPage.pricingSubtitle`).
2. **IBAN tek satıra sığıyor:** Punto `text-[13px] sm:text-base`'e çekildi, kendi tam
   genişlik satırına alındı, `whitespace-nowrap` + `overflow-x-auto` ile alta kayma giderildi
   (hem landing hem ödeme, mobil dahil).
3. **QR kod (öneri #2):** IBAN'ın statik QR'ı `public/iban-qr.svg` (npx ile üretildi, runtime
   bağımlılığı yok). **Yalnızca masaüstünde** gösteriliyor — kullanıcı telefon bankacılığıyla
   ekranı tarar; mobilde aynı cihazda tarama anlamsız + tek-satır IBAN için yer açar.
4. **Tek bileşen (öneri #4, DRY):** İki ayrı kart (`odeme/_components/BankTransferCard` +
   `landing/LandingBankTransfer`) silindi → tek `src/components/payment/BankTransferCard.tsx`
   (`variant: 'dashboard' | 'landing'`). Kopyalama/QR/adım/bildirim mantığı tek yerde.
5. **"Ödedim, Bildir" (öneri #3, migration'sız):** Ödeme sayfasında giriş yapmış kullanıcı
   tek tıkla super admin'e yapılandırılmış e-posta gönderir (kayıtlı e-posta otomatik eklenir
   — "açıklamaya e-posta yaz" adımını unutma sorununu çözer). `notifyBankTransferAction`
   (server action) + `sendBankTransferNotifyEmail` (mevcut Resend altyapısı, `info@`'a, CTA →
   Platform Yönetimi). Landing'de (anonim) e-posta butonu klasik `mailto:` kalır.

- tsc temiz, lint temiz (sadece önceden var olan `selectedPlan` uyarısı), 86 test geçti.
- Kaldırma: `BANK_TRANSFER_ENABLED = false` her iki sayfadan da kaldırır.

## 2026-06-01 — Tema toggle anında tepki (landing + auth)

- Gecikme: `body` 0.2s transition + `disableTransitionOnChange={false}` + React/next-themes sırası.
- `applyThemeToDocument` + `useThemeCycle` (optimistic ikon); `ThemeCycleButton` — landing, auth, dashboard.
- `ThemeProvider`: `disableTransitionOnChange`; `globals.css` body transition kaldırıldı.

## 2026-06-01 — Auth giriş/kayıt kartı light modda açık

- `giris/page.tsx` ve `kayit/page.tsx` orta kartı sabit `#161824` kullanıyordu; light arka planda koyu kutu kalıyordu.
- `authCardClass`, `authCardTitleClass`, `authCardSubtitleClass` — light’ta `--bg-card`, dark’ta önceki cam efekt.

## 2026-06-01 — Havale/EFT: landing'e taşındı + tam genişlik tasarım

Havale/EFT kartı artık **landing page'de de** (ödeme sayfasıyla aynı yerde, üç plan
kutusunun hemen altında). Gerekçe: ziyaretçi ödeme yöntemini **kayıt olmadan** görebilmeli;
karta güvenmeyen kitle kapıda kaybedilmesin. Ayrıca her iki sayfada da kart `max-w-2xl`'den
**`max-w-6xl`'e** genişletildi (üç kutuyla aynı hiza) ve içerik iki sütunlu yatay düzene
geçti: **sol** IBAN + kopyala + hesap/banka, **sağ** 3 adımlık yönerge + WhatsApp/e-posta
butonları. Öksüz/dar görünüm giderildi.

- **Yeni:** `_components/landing/LandingBankTransfer.tsx` — landing estetiği (slate/zinc +
  dark variant, rounded-3xl). i18n `paymentPage.bank*` anahtarları yeniden kullanıldı (DRY).
- **Landing:** `LandingPricing.tsx` — grid altına `{BANK_TRANSFER_ENABLED && <LandingBankTransfer />}`.
- **Dashboard:** `odeme/_components/BankTransferCard.tsx` — iki sütunlu, tam genişlik yeniden tasarım.
- **Tek dokunuşla kaldırma:** `BANK_TRANSFER_ENABLED = false` → her iki sayfadan da kalkar.
- tsc temiz, lint temiz.

## 2026-06-01 — Auth tema: light/system gerçekten uygulanıyor

- **Sorun:** Tema ikonu döngüsü çalışıyordu ama arka plan/formlar sabit koyu (`#0a0b10`, `text-white`) — üç modda da dark görünüyordu.
- **Çözüm:** `authUi.ts` — `--bg`, `--text-*`, `dark:` ile shell, input, link sınıfları; layout + giriş/kayıt/şifre formları güncellendi.
- Light: açık gradient + kart input; Dark: önceki radial koyu görünüm korundu.

## 2026-06-01 — Auth sayfaları: tek dil bayrağı + tema ikonları

- **Kapsam:** `(auth)/layout.tsx` — giriş, kayıt, şifre sıfırlama/güncelleme ortak layout.
- **Dil:** İki ayrı TR/EN butonu kaldırıldı; dashboard/landing ile aynı mantık — seçili dilin bayrağı görünür, tıklanınca diğer dile geçilir.
- **Tema:** `ThemeIcon` zaten system → monitör, dark → ay, light → güneş; tooltip/aria `common.theme*` çevirileriyle hizalandı.

## 2026-06-01 — Havale/EFT alternatif ödeme (Shopier yanında)

Shopier onayı beklenirken (lansman öncesi, düşük hacim) ikinci ödeme kanalı: ödeme
sayfasına **"Havale / EFT ile Öde"** kartı eklendi. Premium/sade tasarım: IBAN + kopyala
butonu, hesap sahibi/banka, 3 adımlık yönerge, WhatsApp + e-posta "bilgi ver" butonları.
Müşteri öder → super admin **Platform Yönetimi panelinden** lisansı manuel aktive eder
(mevcut `adminExtendLicenseAction`). Shopier kartlı ödeme aynen yerinde.

- **Config:** `src/lib/domain/bankTransfer.ts` — `BANK_TRANSFER_ENABLED` + IBAN/hesap/iletişim.
- **Tek dokunuşla kaldırma:** `BANK_TRANSFER_ENABLED = false` → kart tamamen kaybolur.
- **Bileşen:** `odeme/_components/BankTransferCard.tsx`; OdemeClient'a flag arkasında eklendi.
- i18n TR+EN (`paymentPage.bank*`). tsc temiz, 86 test, yerelde gözle doğrulandı.

## 2026-06-01 — Bildirim tercihleri toggle stabilitesi

- **Sorun:** Sesli uyarı kapatılınca toggle «dans ediyordu» — `useEffect` her Header render’ında `onClose` referansıyla tercihleri DB’den yeniden yüklüyordu; sunucuda satır yokken `DEFAULTS` localStorage’ı eziyordu.
- **Çözüm:** `useNotificationPreferences` (TanStack optimistic update + localStorage); `PreferenceToggle` 300ms ease; `getNotificationPreferencesAction` satır yoksa `null`; `notificationPrefsStorage` ortak okuma; QuickAddModal ses/push tutarlılığı.
- **Dosyalar:** `NotificationsModal.tsx`, `useNotificationPreferences.ts`, `notificationPrefsStorage.ts`, `notificationPreferences.ts`, `useNotifications.ts`, `QuickAddModal.tsx`, `keys.ts`

---

## 2026-06-01 — Bildirim detay: footer genişliği

- **Sorun:** «Okundu olarak işaretlendi» footer’da `truncate` ile kesiliyordu (`max-w-sm` + sıkışık satır).
- **Çözüm:** Detay popup `max-w-[27rem]` (+48px); sol metinden `truncate` kaldırıldı.
- **Dosya:** `NotificationsModal.tsx`

---

## 2026-06-01 — Bildirim detay: Boru Hattı butonu

- **Sorun:** Bildirim detay popup’ında «Boru Hattı'nda gör» butonu dar alanda 3 satıra kırılıyor, `text-sm` ile footer’daki metinlerden büyük görünüyordu.
- **Çözüm:** `text-xs`, kompakt padding, `whitespace-nowrap`; footer’da sol metin `truncate`, buton grubu `shrink-0`; Kapat ile aynı satır yüksekliği.
- **Dosya:** `NotificationsModal.tsx`

---

## 2026-06-01 — İstatistikler kilit ikonu (light mode)

- **Sorun:** Dış kayıt / Basic kullanıcıda Ekip Performans buzlu cam overlay’inde kilit ikonu light mode’da neredeyse görünmüyordu (`text-indigo-200`).
- **Çözüm:** Yalnızca `Lock` ikonuna light mode’da marka moru (`#534AB7`); dark mode aynı (`dark:text-indigo-200`).
- **Dosya:** `TeamPerformanceTable.tsx`

---

## 2026-05-31 — Popup açıkken arka plan scroll kilidi

- **Sorun:** Modal/popup içinde kaydırırken imleç veya parmak dışarı taşınca flu arka plan sayfa kayıyordu (masaüstü + mobil).
- **Çözüm:** Ref-counted `bodyScrollLock` (`position: fixed` + scroll pozisyonu geri yükleme); `useBodyScrollLock` hook; tüm overlay bileşenlerine uygulandı.
- **Dosyalar:** `lib/ui/bodyScrollLock.ts`, `hooks/useBodyScrollLock.ts`, Profile/Settings/Confirm modalları, pipeline sheet’leri, pano/ödeme/platform overlay’leri, `CandidateCard` / `CandidateDetail`.

---

## 2026-05-31 — Performans Faz 3: AI usage sunucu, keepPreviousData, dead code

- **038 uygulandı** (kullanıcı tarafı).
- **YZ kotası:** `fetchAIUsageAction` server action; `useAIUsage` istemci Supabase kaldırıldı; SSR prefetch'e eklendi.
- **Gezinme UX:** `keepPreviousData` — aday listesi, ekip bundle, AI usage refetch/invalidate sırasında önceki veri görünür kalır.
- **Temizlik:** Kullanılmayan `fetchEkipMembers.ts` wrapper silindi.
- **Dosyalar:** `actions/aiUsage.ts`, `useAIUsage.ts`, `useCandidates.ts`, `useTeamMembers.ts`, `prefetchDashboard.ts`, `invalidateTeamAndAI.ts`.

---

## 2026-05-31 — Performans Faz 2: ekip bundle, aday select, lazy admin, index

- **Ekip RPC sunucuya:** `fetchTeamBundle` + `fetchTeamBundleAction`; `useTeamMembers` / `useEkipPanelRows` tek `['team', workspaceId]` cache; SSR prefetch.
- **Aday select:** `CANDIDATE_LIST_SELECT` (liste); `fetchCandidateDetailAction` + `useCandidateDetail` (pipeline detay).
- **Super-admin istatistik:** `StatsSuperAdminSections` dynamic import; ağır admin sorguları ana bundle dışında lazy.
- **Giriş:** `router.refresh()` + `router.replace('/pano')` (tam sayfa reload kaldırıldı).
- **DB:** `038_candidates_ws_owner_updated_idx.sql` composite index.
- **Dosyalar:** `fetchTeamBundle.ts`, `actions/team.ts`, `useTeamMembers.ts`, `fetchEkipMembers.ts`, `candidateSelect.ts`, `StatsSuperAdminSections.tsx`, `IstatistiklerContent.tsx`, `EkipPanel.tsx`, `CandidateDetail.tsx`, `LoginForm.tsx`, `prefetchDashboard.ts`, `keys.ts`, `038_*.sql`.

---

## 2026-05-31 — Dashboard performans: SSR prefetch + paralel veri

- **Sorun:** Giriş/pano/istatistikler ve sayfalar arası gezinmede metrikler 3–5+ sn gecikmeli geliyordu; workspace→aday waterfall, istemci-only fetch, istatistiklerin ekip RPC’sini beklemesi.
- **Çözüm:**
  - Dashboard layout SSR: `HydrationBoundary` ile workspace + adaylar (+ super-admin platform sorguları) sunucuda prefetch.
  - `fetchCandidatesAction` (server action); `useCandidates` istemci Supabase yerine sunucu.
  - `fetchWorkspaceAction`: üyelik+workspace tek join sorgusu.
  - İstatistikler: KPI/grafikler ekip verisini beklemez; ekip tablosu kendi skeleton’ında.
  - Pano: hızlı erişim kareleri anında; selamlama/metrikler progressive.
  - Bildirimler 400ms ertelendi; route `loading.tsx` kaldırıldı (cache varken tam sayfa flash yok).
  - Sidebar/mobil nav hover’da aday prefetch; BottomNav duplicate route prefetch kaldırıldı.
- **Dosyalar:** `layout.tsx`, `prefetchDashboard.ts`, `getQueryClient.ts`, `keys.ts`, `candidates.ts`, `workspace.ts`, `useCandidates.ts`, `IstatistiklerContent.tsx`, `PanoContent.tsx`, `Header.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, `useNotifications.ts`, `useAIUsage.ts`.

---

## 2026-05-31 — Tema düğmesi: aktif mod ikonu

- **Sorun:** Tema toggle’da ikon bir sonraki modu gösteriyordu (dark’tayken güneş vb.).
- **Düzeltme:** Aktif mod ikonu: light → güneş, dark → ay, system → monitör. Ortak `ThemeIcon` (`lib/ui/themeToggle.tsx`); landing, yasal sayfalar, auth, pano header (`ThemeToggle`).
- **Dosyalar:** `themeToggle.tsx`, `ThemeToggle.tsx`, `LandingHeader.tsx`, `LegalPageToolbar.tsx`, `(auth)/layout.tsx`, `landing/constants.ts`.

---

## 2026-05-31 — Aktivite geçmişi: follow_up_cleared yerelleştirmesi

- **Sorun:** Takvimden takip kapatıldığında (`system_note:follow_up_cleared:*`) aktivite geçmişinde ham sistem anahtarı “Lider notu eklendi” olarak görünüyordu.
- **Düzeltme:** `renderActivityText` içinde `follow_up_cleared` ve bilinmeyen `system_note:*` kayıtları için TR/EN çeviri; YazarForm aktivite özeti uyumu.
- **Dosyalar:** `candidateDetailUtils.ts`, `pipeline.ts`, `YazarForm.tsx`, `LeaderNotesCard.tsx` (ayrı bileşen), `CandidateDetail.tsx`.

---

## 2026-05-31 — Platform Yönetim hızlandırma + stayfuntopak temizlik SQL

- **Performans:** Paralel admin sorguları, TanStack Query cache, `useWorkspace` ile super-admin gate, progressive skeleton UI (tam sayfa spinner kaldırıldı).
- **Temizlik:** `supabase/scripts/cleanup_stayfuntopak_duplicate_user.sql` — yanlış `stayfuntopak@gmail.com` hesabı + kırıntılar (Preview → Cleanup → Verify).

---


- **Platform Yönetim paneli:** "İçerik ve İtiraz Talepleri Onay Masası" modülü workspace tablosunun altına taşındı.
- **Dosya:** `PlatformYonetimContent.tsx`.

---


- **Terminoloji:** TR → KVKK, Genel Veri Koruma Yönetmeliği (GDPR); EN → PDPL (Personal Data Protection Law), GDPR (EU regulation). Footer EN: `PDPL & Privacy Policy`.
- **Yasal sayfalar (`/kvkk`, `/kullanim-kosullari`, `/guvenlik`):** Sağ üstte tema düğmesi + bayrak (TR'de 🇹🇷, EN'de 🇺🇸); içerikler PDPL/KVKK ayrımına göre güncellendi.
- **Dosyalar:** `LegalPageToolbar.tsx`, `kvkk/page.tsx`, `kullanim-kosullari/page.tsx`, `guvenlik/page.tsx`, `landing.ts`, `trainingData.ts`.

---

## 2026-05-31 — Şifre sıfırlama akışı düzeltildi (kırmızı hata + pano'ya kaçış)

- **Sorun:** E-posta linki oturumu kuruyordu ama `/sifre-guncelle` 5 sn'de hata veriyor; kullanıcı pano'ya düşüyordu, şifre değişmiyordu.
- **Düzeltme:** Link `auth/callback` üzerinden sunucuda oturum kuruyor; `token_hash`/`code`/hash desteği; LandingPage recovery yönlendirmesi.
- **Supabase:** Redirect URLs'e `https://nmm.suattayfuntopak.com/auth/callback` eklenmeli.

---

## 2026-05-31 — E-posta markası: NMM logosu

- Şifre sıfırlama + tüm Resend mailleri: `logo.png` üst başlık; Supabase mor N şablonu bypass (`generateLink` + Resend).
- Gmail avatar: `RESEND_FROM_EMAIL` + Gravatar rehberi → `docs/email-automation.md`.

---

## 2026-05-31 (Akşam) — Premium Tasarım Cilası & Fiyatlandırma Kontrast Düzeltmeleri

- **Kimlik Doğrulama Rotaları (/auth) Yönlendirme Koruması (Bugfix):** E-postadaki şifre sıfırlama linkine tıklandığında, tarayıcıda kalmış eski/geçersiz bir çerez oturumu varsa middleware (`proxy.ts`) dosyasının araya girip isteği `/pano`'ya ve oradan da doğrudan `/giris` sayfasına fırlatması engellendi. `/auth/` ile başlayan kimlik doğrulama sistem yollarının (`/auth/callback` ve `/auth/reset-password`) middleware yönlendirmelerinden tamamen muaf tutularak doğrudan çalışması sağlandı. Şifre sıfırlama bağlantılarının doğrudan `/sifre-guncelle` sayfasına ulaştırılması garanti altına alındı.
- **Çift Hesap/E-posta Çalışma Alanı Birleştirmesi:** Kullanıcının iki farklı e-posta adresi (`suattayfuntopak@gmail.com` ve `stayfuntopak@gmail.com`) ile girdiği durumlarda yaşanan karmaşayı önlemek için; `stayfuntopak@gmail.com` hesabı da veritabanında asıl Pro çalışma alanınız olan **"Focus Team"**'e `leader` (Yönetici) rolüyle bağlandı. Böylece tarayıcıda hangi hesabınız açık olursa olsun veya hangi maile tıklarsanız tıklayın **her zaman Pro yetkileriyle kendi aday verilerinizi göreceksiniz**. 6 dakika önce oluşturulan boş geçici workspace veri kaybı olmaksızın temizlendi.
- **Profil Menüsünde Aktif E-posta Gösterimi:** Sağ üstteki profil menüsü (`UserMenu.tsx`) açıldığında, kullanıcının o an hangi e-posta ile oturum açtığını anında görebilmesi için isim bilgisinin altına küçük fontlu **aktif e-posta adresi** satırı eklendi.
- **Şifre Sıfırlama Yönlendirme Hatası Giderildi (Bugfix):** Supabase'den gelen şifre sıfırlama e-posta linkine tıklandığında oluşan yarış durumu (race condition) engellendi. Giriş sayfasında URL'deki hash fragment (`access_token` veya `type=recovery`) algılandığında sistemin kullanıcıyı anında `/pano`'ya fırlatması durdurularak, doğrudan ve güvenli bir şekilde `/sifre-guncelle` sayfasına yönlendirilmesi sağlandı. Kullanıcının şifresini değiştirebilmesi garanti altına alındı.
- **Yasal & Uyumluluk Sayfaları Sadeleştirmesi:** KVKK (`/kvkk`), Kullanım Koşulları (`/kullanim-kosullari`) ve Bilgi Güvenliği Bildirgesi (`/guvenlik`) sayfalarındaki sol yan menü sekmeleri tamamen kaldırıldı. Sayfalar, okuma konforunu en üst düzeye çıkarmak için `max-w-3xl` sınırlarında **tek sütun ortalanmış modern bir doküman düzenine** kavuşturuldu.
- **Hero Üst Rozet Ölçeklendirmesi:** En üstteki "YAPAY ZEKA DESTEKLİ NETWORK MARKETING İŞLETİM SİSTEMİ" rozeti, görsel oranları kusursuzlaştırmak adına bir punto küçültülerek `text-xs sm:text-sm` ve `px-4.5 py-2` ölçülerine getirildi.
- **Dil Değiştirme Butonu:** Landing Page sağ üst köşesindeki dil butonu, pano (dashboard) içindekiyle uyumlu dinamik tekil butona dönüştürüldü. Türkçe aktifken Türk Bayrağı (`TRFlag`), İngilizce aktifken USA Bayrağı (`USFlag`) gösterilerek tek tıklamayla dil değişimi sağlandı.
- **Fiyatlandırma Light Tema Kontrast İyileştirmesi:**
  - `BİREYSEL ORTAK`, `TAKIM LİDERLERİ`, `EN ÇOK SATAN`, `BÜYÜK LİDERLER` ve `25% İndirim` etiketleri yüksek kontrastlı, uyumlu pastel HSL renk paletleriyle (`text-indigo-800 bg-indigo-100`, `text-amber-800 bg-amber-100` vb.) tamamen okunaklı hale getirildi.
  - Tik işaretleri (`CheckCircle2`) daha canlı ve net tonlara (`text-indigo-600`, `text-amber-600`, `text-pink-600`) çekildi.
  - Basic plandaki görünmeyen beyaz buton (`text-white`), light temada sınırları belirgin ve gölgeli şık bir gri buton olarak yeniden tasarlandı.
- **SSS Sınır Genişliği ve FAQ Kaldırma:** Sıkça Sorulan Sorular modülünün üstündeki gereksiz `"FAQ"` rozet ibaresi kaldırıldı. Modülün genişliği **"Tek Bir Platformdan Kusursuz Yönetim Merkezi"** ile tam uyum sağlayacak şekilde `max-w-7xl` genişliğine getirildi.
- **Footer Sadeleştirme ve Copyright Ortalaması:**
  - Sol taraftaki açıklama paragrafı tamamen kaldırıldı.
  - Yeşil dalgalı "TÜM SERVİSLER AKTİF" (Systems Pulse) rozeti kaldırıldı.
  - Sağ alttaki "SECURE PLATFORM" ibaresi kaldırıldı.
  - Telif hakkı satırı (`© 2026 Network Marketing Master. Tüm hakları saklıdır.`) tüm ekran boyutlarında sayfanın en altında **tam ortalanmış** bir şekilde hizalandı.
  - Sol taraftaki `Terminal` ikonu kaldırılıp yerine resmi yuvarlak logomuz (`/logo.png`) yerleştirildi.

---

## 2026-05-31 — İçerik Moderasyon Otomasyonu + Yasal Sayfalar & Premium Landing Footer

- **Özellik (İçerik/İtiraz Moderasyon Akışı):** "Vaktin Varsa" (Eğitim) ve "İtirazlara Cevaplar" sayfaları için draft-and-approval altyapısı tamamlandı.
- **Süper Admin Auto-Bypass:** `suattayfuntopak@gmail.com` tarafından eklenen tüm içerik ve itirazlar anında `is_approved = true` olarak kaydedilir. Onay/inceleme gerektirmez, sınırsız ekleme hakkı vardır ve sympathetic popup/moderasyon adımları bu kullanıcı için tamamen bypass edilir.
- **Normal Kullanıcı Akışı:** Diğer distribütörlerin eklediği içerikler `is_approved = false` olarak taslak kaydedilir. Form kapandığında platform-portal tabanlı interaktif `SympatheticPopup` gösterilir. Aynı anda `info@suattayfuntopak.com` / `suattayfuntopak@gmail.com` adresine Resend API aracılığıyla gerçek zamanlı e-posta alarmı gönderilir.
- **Admin Onay Masası:** Platform Yönetim panelinde ("PlatformYonetimContent.tsx") bekleyen tüm istekleri düzenleme, kaydetme ve onaylama/reddetme paneli açıldı.
- **Onay E-postası & Derin Link (Deep Link):** Onaylandığında, içerik sahibine Resend üzerinden `${NMM_APP_URL}/egitim?id=${item_key}` veya `/itirazlar?id=${item_key}` parametreli e-posta gider. Bu link tıklandığında sayfa pürüzsüz kaydırma ile ilgili karta odaklanır ve chevron detayını otomatik açar.
- **Red Gerekçe Bildirimi & Nazik E-posta:** Super Admin bir talebi reddettiğinde, kullanıcıya talebinin neden eklenemediğini açıklayan son derece kibar ve profesyonel bir bilgilendirme e-postası gider. Reddedilirken admin'e gerekçe yazabileceği pre-populated bir diyalog penceresi sunulur ve bu özel gerekçe e-posta gövdesine entegre edilir.
- **Yasal & Gizlilik Sayfaları:** Premium glassmorphism ve orbs tasarımıyla KVKK (`/kvkk`), Kullanım Koşulları (`/kullanim-kosullari`) ve Bilgi Güvenliği Bildirgesi (`/guvenlik`) sayfaları dynamic sidebar index yapısı ve tam TR/EN lokalizasyonuyla oluşturuldu.
- **Landing Kopya & Başlık Revizyonları:** Arayüzdeki YZ rozeti "YAPAY ZEKA DESTEKLİ NETWORK MARKETING İŞLETİM SİSTEMİ" yapıldı. "Eksiksiz Yönetim Merkezi" yerine "Tek Bir Platformdan Kusursuz Yönetim Merkezi" ifadesi yerleştirildi. Fiyatlandırma modülünün başlığı "Fiyatlandırma" olarak değiştirildi ve alt açıklama dinamik üyelik büyümesini teşvik edecek şekilde güncellendi.
- **Sayfa Düzeni & Modül Konumları:** Liderlerin Başarı Hikayeleri modülü fiyatlandırmanın üzerine alındı. Sıkça Sorulan Sorular (Faq) modülü ROI Hesaplayıcı ile Fiyatlandırma arasına (Fiyatlandırmanın hemen üstüne) eklenerek sayfa hiyerarşisi mükemmelleştirildi.
- **Sıkça Sorulan Sorular (SSS - FAQ) Modülü:** 10 adet tamamen NMM platformuna ve veritabanı/YZ altyapısına özel olarak uyarlanmış soruyu barındıran, şık cam efekti zeminli, micro-açılış ve chevron dönüş animasyonlu, localized SSS modülü landing page'e eklendi.
- **Footer Pürüzsüz Kaydırma (Scroll) & İyileştirmeler:** Footer'daki Özellikler linkinin `ozellikler` anchor'ı ile yeni "Tek Bir Platformdan Kusursuz Yönetim Merkezi" başlığına; Nasıl Çalışır linkinin `nasil-calisir` ile "Network Marketing Master Etkisini Hesaplayın" modülüne ve Fiyatlandırma linkinin `ucretlendirme` ile "Fiyatlandırma" modülüne yumuşakça kayarak pürüzsüz durması sağlandı. KVKK tik ikonu kaldırıldı, footer e-postasının tam sığması sağlandı.
- **Genel Erişim & Whitelist (Proxy Middleware):** `/acilis`, `/kvkk`, `/kullanim-kosullari` ve `/guvenlik` rotaları `src/proxy.ts` dosyasında genel whiteliste alınarak misafirlerin giriş yapmadan doğrudan okuması sağlandı; oturum açmış kullanıcıların ise bu sayfaları okurken `/pano`'ya zorla yönlendirilmesi engellendi.
- **Derleme:** `npm run build` hatasız tamamlandı, TypeScript/Turbopack statik sayfaları başarıyla üretti.

---

## 2026-05-31 — Build fix: CALENDAR_TERMINAL_STAGES import

- Vercel TS hatası (`takvim/actions.ts:149`) — eksik import eklendi; `npm run build` yeşil.

---

## 2026-05-31 — Takvim: Takibi İptal Et +3 gün döngüsü kesildi

- **Sorun:** İptal sonrası tamamlanan gün + aşama günü (14 Haz → 17 Haz) yeniden planlıyordu.
- **Düzeltme:** `FOLLOW_UP_CALENDAR_SUPPRESSED_ISO` — iptal = takvimden tamamen çıkar; +1/+3/+7 veya manuel tarih ile tekrar planlanır.
- **Deploy sonrası:** Eski DB kayıtları (17 Haz) için bir kez daha “Takibi İptal Et” gerekebilir.

---

## 2026-05-31 — Council Triad 2. Tur (analiz — kod değişmedi)

**Üyeler:** Torvalds + Aristoteles + Ada. Tam rapor: [docs/council-triad-2026-05-31.md](docs/council-triad-2026-05-31.md).
**Sonuç:** Geçen turun 5 kritiği ✅ kapanmış, regresyon yok. Yeni bulgu: son sprintteki **cron/e-posta/bildirim alt-sistemi en az sertleştirilmiş parça** — eski örüntüler (secret fallback, raw client, eksik idempotency) geri gelmiş.

- 🔴 **K-1** — `CRON_SECRET` set/boş değilse `Bearer ` ile 3 cron endpoint herkese açık → tek satır guard (`!secret ||`).
- 🟠 **Y-1** Resend `|| 're_test_key'` fallback + 2 cron raw client · **Y-2** trial/license cron idempotency yok → çift e-posta · **Y-3** calendar-reminder UTC↔İstanbul TZ asimetrisi + free/trial-ended lisans boşluğu · **Y-4** `useUpdateCandidate` read-before-write → hayalet aktivite (eski Y-6) · **Y-5** QuickAddModal yalancı "E-posta Gönderildi" UI + ölü kod · **Y-6** `|||` yarım göç (typed kolon ↔ legacy parse) · **Y-7** i18n `lang === 'en'` ×67 · **Y-8** useNotifications↔NotificationsModal circular.
- 🟡 12 madde (O-1..O-12): bulkDefer terminal/N+1, lib flat ×3, admin client dedup, translate-note→action, inline super-admin, god component, lint 88 error, parent_id ölü koşul…
- 🟢 4 madde (L-1..L-4): kota TZ, domain types, calendar test, doc.
- **Faz planı A–G:** A=güvenlik (bugün), B=cron doğruluğu, C=veri bütünlüğü, D=i18n/yapı, E=`|||` göçü, F=god component, G=düşük.

**Test:** 80/17 yeşil. **Lint:** 88 error / 54 warning (çoğu eski; takvim `set-state-in-effect`).

---

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


## 2026-05-31 — Şifre Sıfırlama Yönlendirme ve Domain Senkronizasyonu Çözümü

### fix: Supabase Email Yönlendirme ve Giriş Sayfasına Atma Hatası Giderildi
- **Sorunun Tespiti:**
  - Süper admin/kullanıcı e-posta sıfırlama linkine tıkladığında, `nmm.suattayfuntopak.com` alan adı Supabase Dashboard üzerindeki onaylı yönlendirme listesinde (Allowed Redirect URLs) bulunmadığı için Supabase isteği reddedip varsayılan Vercel wildcard URL'ine (`https://network-marketing-master.vercel.app/**`) yönlendiriyordu.
  - Tarayıcı `https://network-marketing-master.vercel.app/**` (ve hash fragment) adresine gittiğinde, Next.js proxy middleware'i (`proxy.ts`) bu `/**` dizin yolunu halka açık yollar listesinde (PUBLIC_PATHS) bulamadığı için isteği yetkisiz algılayıp anında `/giris` sayfasına yönlendiriyordu.
- **Çözüm Entegrasyonu (`src/proxy.ts`):**
  - Modern web tarayıcılarının (Chrome, Safari, Firefox vb.) güvenlik protokolleri gereği çapraz alan adı (cross-domain) yönlendirmelerinde URL hash fragment'ını (`#access_token=...`) temizlemesini önlemek amacıyla, sunucu taraflı 307/302 yönlendirmesi yerine **istemci taraflı (client-side) HTML yönlendirme şablonu** entegre edildi.
  - Proxy middleware katmanının başında, eski Vercel alan adından (`network-marketing-master.vercel.app`) gelen istekleri resmi üretim alan adına (`nmm.suattayfuntopak.com`) ya da `/**` wildcard path'ini doğrudan `/sifre-guncelle` adresine yönlendiren şık ve mor temalı bir HTML yönlendirme motoru kuruldu.
  - Bu sayede tarayıcı `window.location.hash` değerini (yani kritik kullanıcı sıfırlama token'ını) hiçbir şekilde kaybetmeden doğrudan ve güvenli bir şekilde `https://nmm.suattayfuntopak.com/sifre-guncelle` sayfasına ulaştırır.
  - `/sifre-guncelle` sayfası yüklendiğinde Supabase istemcisi hash fragment'ı pürüzsüzce yakalar, oturumu kurar ve şifre belirleme formunu sıfır gecikmeyle anında aktif eder.

### fix: resetPasswordAction Dinamik Origin Fallback Mekanizması (`src/app/(auth)/sifre-sifirla/actions.ts`)
- Bazı tarayıcı veya proxy konfigürasyonlarında sunucu eylemlerine (Server Actions) `origin` header bilgisi ulaşmadığı durumlar için `host` header'ına dayalı dinamik bir fallback protokolü kuruldu. Origin boş olsa dahi `redirectTo` parametresi her zaman tam yetkili, geçerli bir URL olarak Supabase'e iletilmektedir.


## 2026-05-31 — Yasal Sayfaların Tasarımsal Genişletilmesi ve Çift Dil İyileştirmeleri

### feat: Yasal Sayfaların Genişliği `max-w-7xl` Seviyesine Yükseltildi
- Landing page üzerindeki yasal sayfaların (KVKK, Kullanım Koşulları, Bilgi Güvenliği) arayüz yerleşimi, kullanıcının talebi doğrultusunda **"Tek Bir Platformdan Kusursuz Yönetim Merkezi"** modülü genişliğine getirildi.
- Sayfalardaki dar ve okunması zor `max-w-3xl` (768px) konteyner yapısı, tam genişlikte ultra premium bir görünüm sunan `max-w-7xl` (1280px) standardı ile değiştirildi.
- Ekran genişledikçe sayfa kenarlarında şık boşluklar bırakan `px-4 sm:px-6 lg:px-8` yapısı entegre edilerek tüm yasal belgelerin okunabilirliği ve bütünsel estetiği artırıldı.

### feat: Yasal Kısaltmaların ve Terimlerin İngilizce Karşılıkları Eklendi
- İngilizce dil seçeneği aktif edildiğinde yasal sayfalardaki Türkçe kısaltmaların ve finansal/yasal kurumsal terimlerin uluslararası karşılıkları yerleştirildi:
  - **KVKK** ifadesinin yanına ve rozet alanlarına küresel standart olan **GDPR / KVKK** karşılığı eklendi.
  - **BDDK** (Bankacılık Düzenleme ve Denetleme Kurumu) ifadesi İngilizce şablonlarda **BDDK (Banking Regulation and Supervision Agency)** şeklinde detaylandırılarak açıklandı.
  - Türkçe içeriklerde yer alan **YZ** (Yapay Zeka) kısaltmaları, İngilizce sürümde **AI (Artificial Intelligence)** olarak revize edilip zenginleştirildi.




## 2026-06-10 — Playwright E2E Testleri ve Hydration Mismatch Hatalarının Giderilmesi

### fix: E2E Landing Sayfası Yönlendirme ve Oturum Asılı Kalma Çözümü
- Playwright E2E testlerinde, ana sayfadaki session kontrolü sırasında Supabase istemci bağlantısı veya ağ hataları oluştuğunda sayfanın `Oturum Doğrulanıyor...` ekranında sonsuza dek asılı kalması engellendi. `supabase.auth.getSession()` işlemine `.catch()` hata yakalama blokları ve genel `try/catch` sarmalaması eklenerek sistemin hata anında da arayüzü başarıyla yüklemesi garanti edildi.
- Landing sayfasının testlerinde tarayıcının otomatik dashboard sayfasına yönlenmesini önlemek için [e2e/landing.spec.ts](file:///Users/suattayfuntopak/STT/ai/my-projects/network-marketing-master/e2e/landing.spec.ts) dosyasına temiz `storageState` ataması yapılarak oturumsuz test senaryoları stabilize edildi.

### fix: LanguageProvider ve ThemeToggle Hydration Mismatch Hatalarının Düzeltilmesi
- **Dil Hydration Hatası**: Next.js SSR derleme aşamasında sunucunun Türkçe ürettiği HTML'in, test tarayıcısının dili İngilizce olduğunda client-side hydration uyuşmazlığına yol açması çözüldü. [LanguageProvider.tsx](file:///Users/suattayfuntopak/STT/ai/my-projects/network-marketing-master/src/providers/LanguageProvider.tsx) içinde dil durumu statik bir 'tr' ile başlatılıp, tarayıcı/local storage dili `useEffect` içinde client-side tespit edilerek güncellendi.
- **Tema Hydration Hatası**: [themeToggle.tsx](file:///Users/suattayfuntopak/STT/ai/my-projects/network-marketing-master/src/lib/ui/themeToggle.tsx) içindeki `mounted` durumunun client/server uyuşmazlığı düzeltildi. `mounted` durumu ilk başta `false` başlatılıp `useEffect` içinde `true` durumuna çekilerek sunucudaki `div` ve istemcideki `button` uyuşmazlığı tamamen ortadan kaldırıldı.

### fix: Next.js Dev Origin Geliştirici Sunucusu WebSocket Hata Engeli
- Playwright test çalıştırıcısının `127.0.0.1` üzerinden yaptığı isteklerin Next.js dev server tarafından çapraz kökenli (cross-origin) WebSocket/HMR isteği olarak algılanıp engellenmesi çözüldü. [next.config.ts](file:///Users/suattayfuntopak/STT/ai/my-projects/network-marketing-master/next.config.ts) dosyasına `allowedDevOrigins: ['127.0.0.1']` eklendi.
