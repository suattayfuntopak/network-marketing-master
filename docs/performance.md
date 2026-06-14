# Performans Oyun Kitabı (kalıcı)

Amaç: giriş, sayfa/sekme geçişleri ve metrik yüklenmeleri her iki temada (masaüstü
+ mobil) **"pat pat"** (anlık algılanan) olsun. Bu belge **yöntemi** kalıcılaştırır:
önce ölç, sonra en yüksek kaldıraçlı yeri değiştir, sonra tekrar ölç.

## 1. Bu uygulamanın darboğaz modeli
Kök yavaşlık **render değil, round-trip**: Supabase origin coğrafi olarak uzak
(~**320 ms/sorgu**). Her dinamik sayfada middleware `getUser()` + RSC veri çekme bu
gecikmeye biner. Dolayısıyla en büyük kazanç **round-trip sayısını ve mesafesini**
azaltmaktan gelir; mikro-render optimizasyonları ikincildir. (Bkz. hafıza:
`project_perf_round_trips`.)

## 2. Zaten yapılanlar (tekrarlama)
- `next.config`: `optimizePackageImports:['lucide-react']`, `staleTimes{dynamic:30,
  static:180}`, `viewTransition:true`.
- SSR'de gereksiz "warm await" kaldırıldı; TanStack `staleTime`'ları (`QUERY_STALE`).
- Hub metrikleri dönem prefetch + offset stratejisi (`docs/hub-metrics.md`).

## 3. Ölçüm (önce bunu yap — tahminle değiştirme)
1. **Alan (gerçek kullanıcı):** Vercel Analytics / Speed Insights — p75 TTFB,
   route bazında. Mobil + masaüstü ayrı bak.
2. **Lab:** Chrome DevTools Performance + Lighthouse (mobil throttling) ana rotalarda:
   `/pano`, `/pipeline`, `/ekibim`, `/istatistikler`, `/saha-ozetim`.
3. **Geçiş hissi:** sekme/route geçişinde ilk boya + veri gelene kadar geçen süre.
   gstack `/benchmark` (browse daemon) ile tekrarlanabilir ölçüm — regresyon yakalar.
4. **Round-trip sayımı:** Network panelinde her rota için Supabase isteği adedi.
   Hedef: rota başına **tek seferde paralel** + tekrar ziyarette **0** (cache).
5. **TTFB baseline (tekrarlanabilir, kalıcı):** `npm run perf:baseline`
   (`scripts/perf-baseline.mjs`). Public rotalar doğrudan; auth'lu rotalar için
   `NMM_COOKIE` ver (DevTools → Application → Cookies → `sb-*`). Prod'a karşı
   `BASE_URL=https://<app> NMM_COOKIE="..." npm run perf:baseline`. Çıktıdaki p75
   TTFB'yi aşağıdaki tabloya işle → bir sonraki tur regresyonu yakalar.

### Baseline kayıt tablosu (her perf turunda güncelle)
| Tarih | Rota | Ortam | p50 TTFB | p75 TTFB | Not |
|-------|------|-------|----------|----------|-----|
| _doldur_ | /pano | prod+cookie | | | bölge taşıma öncesi referans |
| _doldur_ | /istatistikler | prod+cookie | | | |
| _doldur_ | /saha-ozetim | prod+cookie | | | |
| _doldur_ | /ekip | prod+cookie | | | |
| _doldur_ | /pipeline | prod+cookie | | | |

> Bu tabloyu prod'a karşı bir kez doldurmak, "tahminle değiştirme" kuralını
> uygulanabilir kılar: her tur öncesi/sonrası aynı satırı ölç, kazancı §8'e yaz.

## 4. Kaldıraçlar (etki sırasına göre)
1. **[En büyük] Supabase bölge taşıma.** Origin'i kullanıcıların bölgesine taşı
   (veya read-replica). ~320ms → ~20-40ms her sorguda. Kod değil, altyapı kararı.
2. **Round-trip birleştirme.** Rota başına N+1'leri RPC/`Promise.all` ile tek tura
   indir. (Örn. team bundle, hub metrikleri zaten bu yönde — yenilerine dikkat.)
3. **Prefetch on intent.** Nav linklerinde hover/touchstart'ta `router.prefetch` +
   TanStack `prefetchQuery` (zaten `prefetchRouteMetrics` var — kapsamı genişlet).
4. **Optimistic / placeholder geçiş.** Sekme ve liste geçişlerinde `keepPreviousData`
   + skeleton; "boş→dolu" yerine "eski→yeni" hissi. (`Skeleton`, `DashboardLoading`.)
5. **Bundle/code-split.** Ağır client bileşenleri `next/dynamic` ile böl
   (örn. grafikler, modallar). İlk JS'i küçült → parse/exec hızlanır.
6. **Görsel/medya.** `next/image`, avatar boyutları, YouTube lazy (zaten lazy).

## 5. "Hızlı" tanımı (definition of fast)
- Sıcak (cache'li) sekme/route geçişi: **<100 ms** ilk boya, veri anında.
- Soğuk rota: tek paralel round-trip; skeleton 1 kare sonra.
- Mobilde 4x CPU throttle altında ana rotalarda Lighthouse Performance **≥ 85**.

## 6. Çalışma döngüsü (her perf turunda)
1. Rota seç → ölç (baseline kaydet).
2. Tek kaldıraç uygula (yukarıdaki sıradan).
3. Tekrar ölç → kazanç yoksa geri al.
4. Sonucu bu belgeye "ölçülen kazanç" olarak not et.

## 7. Sıradaki tur backlog (öncelikli)
- [x] Baseline ölçüm ALTYAPISI (2026-06-14): `npm run perf:baseline` + §3 kayıt
      tablosu hazır. KALAN: tabloyu prod'a karşı bir kez doldur (kullanıcı cookie'si gerekir).
- [~] Bölge taşıma fizibilitesi: **karar verildi — ERTELENDİ.** Kullanıcı Supabase
      Free planında, 2 proje slotu da dolu; Pro'ya geçemiyor → yeni Frankfurt projesi
      açılamıyor. En büyük kaldıraç bu kısıt kalkana dek kilitli; kod turları devam.
- [x] `prefetchRouteMetrics` kapsam denetimi (2026-06-14): nav linkleri `onMouseEnter`/
      `onPointerEnter` ile data prefetch + `DashboardShell` mount'ta tüm rotalar için
      `router.prefetch`. Kapsam tam; yeni rota eklerken aynı kalıbı uygula.
- [x] Sekme geçişlerinde `keepPreviousData` denetimi (2026-06-14): ana metrik sayfaları
      (`FieldSummaryPage`, `EkipSummaryTab`, `StatsFieldFunnelSection`, `MemberActivitySheet`,
      `useCandidates`/`useTeamMembers`/`useAIUsage`) `placeholderData: keepPreviousData`
      kullanıyor → dönem/sekme geçişi "boş→dolu" değil "eski→yeni". Yeni metrik sorgusunda zorunlu.
- [ ] En ağır 3 client bileşeni için `next/dynamic` bölme (kısmen var: İstatistikler/Platform/
      İtirazlar/Ekip/Eğitim içerikleri zaten `next/dynamic`).

## 8. Ölçülen kazanç defteri
- **2026-06-14 — Hot-path auth round-trip kırpma.** Ham `supabase.auth.getUser()`
  (~230ms ağ turu) → cached `getAuthUser()` (getClaims yerel doğrulama ~0ms + `cache()`
  dedup). 13 çağrı / 7 dosya: `istatistikler/actions.ts` (×6, `loadStatsFunnelActuals`
  hot + 5 admin okuma), `pipeline/[id]/actions.ts` (×3 çeviri), `pipeline/sunum-
  materyalleri` (×1), `actions/notificationPreferences` (×2), `pulse/learningEvents`,
  `egitim/videoActions` (assertAdmin), `takvim/actions` (assertWorkspaceOwner). Regresyonsuz
  (simetrik anahtara düşerse davranış aynı). **KALIP (kalıcı):** her yeni server action
  kimlik için `getAuthUser()` çağırır; ham `supabase.auth.getUser()` server tarafında
  yasak sayılır (kritik/hot yollarda mutlak). Kalan ham getUser'lar: client hook'lar
  (`useCandidates`, `useNotifications` — tarayıcı tarafı, ayrı konu) + düşük-trafik admin
  mutasyonları (`moderation`, `ekip/actions`, `admin-actions`, `profile`, `userLang`,
  `odeme`) — istenirse aynı kalıpla dönüştürülebilir.
- **2026-06-14 (2. parti) — getUser kapsamı TAMAMLANDI + ESLint ile kalıcılaştırıldı.**
  Kalan tüm ham `supabase.auth.getUser()` çağrıları dönüştürüldü (toplam bu turda 25 site):
  server tarafı (`checkQuota` [HER AI üretiminde — hot], `userLang`, `admin-actions` ×4,
  `moderation` ×3, `profile`, `ekip/actions` ×5, `memberGoalsActions` ×2, `odeme`,
  `workspace` ensure, `productEvents`, `shopierPaymentSession` ×2) → `getAuthUser()`;
  **client** (`useCandidates` ×4, `useNotifications` ×3, `customContent` ×4) → yeni
  `getClientUserId()` (`lib/supabase/authUserClient.ts`, getClaims yerel doğrulama,
  tarayıcı→auth turu eler). **ESLint kuralı eklendi** (`eslint.config.mjs`
  `no-restricted-syntax`): ham `supabase.auth.getUser()` artık derlemede hata →
  kalıp regresyonu imkânsız. `server-only` testte no-op alias'landı
  (`src/test/serverOnlyStub.ts` + vitest.config). tsc/eslint/254 test/build ✓.

> Not: Config seviyesindeki kolay kazançlar tükendi. Bundan sonraki her değişiklik
> **ölçümle** yapılmalı; tahminle perf değiştirmek regresyon riskidir.
