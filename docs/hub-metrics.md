# Hub metrics (Saha Özetim)

Saha Özetim (`/saha-ozetim`) dönem metrikleri — prefetch, cache ve flicker stratejisi.

## Huni hedefleri (Hedefim ↔ Saha Özetim)

Tek kaynak: `src/lib/domain/hubFunnelTargets.ts` + `getGoalFunnelContextAction()` (`hedef/actions.ts`).

| Dönem | Hedef formülü | Hedefim ile uyum |
|-------|---------------|------------------|
| Günlük | `ceil(stage.monthly / 26)` — seçilen günün yol haritası kademesi | Bugünkü Odağım ile aynı (bugün) |
| Haftalık | `ceil(stage.monthly × günSayısı / 26)` — hafta ay sınırını geçerse kademe bölünür | 26 iş günü modeli |
| Aylık | `stage.monthly` — takvim ayının yol haritası kademesi | Ay ay döküm satırı ile birebir |
| Yıllık | O takvim yılına düşen tüm kademelerin `monthly` toplamı | Yol haritası toplamı |

Geçmiş dönemlerde hedef, **o dönemin** yol haritası ayına göre hesaplanır (bugünkü kademe değil).

**Diğer yüzeyler:** `funnelTargetsForPulsePeriod` — İstatistikler (`getStatsFunnelBundleAction`) ve ekip aktivite sheet (`getMemberActivityDetailAction` → `funnelTargets` / `hasMemberGoal`). Üye hedefi: önce `nmm_user_goals`, yoksa lider ataması `nmm_member_goals` (`created_at` = başlangıç).

## Modüller

| Dosya | Rol |
|-------|-----|
| `src/lib/domain/hubFunnelTargets.ts` | Dönem huni hedef türetme (günlük/haftalık/aylık/yıllık) |
| `src/lib/domain/hubPeriodPrefetch.ts` | Sekme tipleri, `parseSummaryTab`, komşu offset seçici, `sessionStorage` son sekme |
| `src/lib/query/prefetchRouteMetrics.ts` | `prefetchHubMetrics` — SSR, hover ve maliyet kontrolü |
| `src/app/(dashboard)/saha-ozetim/page.tsx` | Sunucu tarafı workspace + hub prefetch + `HydrationBoundary` |
| `FieldSummaryPage.tsx` | İstemci sorguları; `placeholderData` önbellekten |

## Prefetch maliyeti

`prefetchHubMetrics(..., { activeTab })`:

- **activeTab yok** (ilk hover): her dönem için yalnızca `offset: 0` → 4 hub-self sorgusu.
- **activeTab = `daily`**: daily için `[-1,0,1]`, diğerleri `0` → 6 hub-self sorgusu.
- Nav hover, `readStoredHubActiveTab()` ile son ziyaret edilen sekmeyi kullanır (`nmm_hub_active_tab`).

Komşu offset'ler dönem şeridi swipe/ok ile anında geçiş içindir — yeni sekme eklerken `HUB_PERIOD_NEIGHBOR_OFFSETS` ve `hubPeriodOffsetsForPrefetch` güncellenmeli.

## İstemci placeholder

`keepPreviousData` yerine aynı `queryKey` için `queryClient.getQueryData` — SSR/hover prefetch verisi sekme/offset değişiminde flicker'ı azaltır.

## Debug

`shouldLogHubPrefetch()` → development ve Vercel preview'da `console.debug('[prefetchHubMetrics]', …)`.

İstemci prefetch özeti `sessionStorage` (`nmm_hub_prefetch_last`) + sunucu telemetrisi `nmm_hub_prefetch_events` (migration `077`) + günlük rollup `nmm_hub_prefetch_daily` (migration `078`, cron `/api/cron/hub-prefetch-rollup`) — **Platform Yönetimi** debug kartında (super admin). Kayıt: `recordHubPrefetchEventAction` (`ssr` / `hover`).

## Ekip detay linki

Ekip üyesi detayı = liderin pipeline adayı (`pipeline_id` / `findLeaderCandidateForMember`). Saha Radarı aktivite kartları `/pipeline/[pipelineId]` kullanır; eşleşme yoksa `/ekip/[userId]` yedek.

## Görsel: metrik kutuları (`panoVariant`)

Saha Özetim taç hunisi ve saha aktivitesi kartları pano launcher ile aynı renk ailesini kullanır; tam opak `crownSolidMap` yerine **`crownSoftMap`** (`SquareButton.tsx` — gradient uçları `/25`, ~%25 opaklık) uygulanır.

| Bileşen | Dosya | Not |
|---------|-------|-----|
| Taç hunisi (4 KPI) | `HubCrownFunnelGrid.tsx` | `panoVariant` → `crownSoftMap` + normal metin rengi; progress bar %55 opak |
| Saha aktivitesi | `HubSelfActivityGrid.tsx` | Aynı `panoVariant` / `crownSoftMap` |
| Pano launcher | `SquareButton` `variant="crown"` | Canlı `crownSolidMap` — değişmedi |

Yeni metrik satırı eklerken: pano ile uyum için `panoVariant` + `crownSoftMap`; tam renkli CTA kutusu için `crownSolidMap`. İstatistikler sekmeleri `PulsePeriodTabs` — ayrı bileşen, hub sekme boyutlarıyla hizalı ∞ (`all`) tipografisi.
