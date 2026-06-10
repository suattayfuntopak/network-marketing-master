# Hub metrics (Saha Özetim)

Saha Özetim (`/saha-ozetim`) dönem metrikleri — prefetch, cache ve flicker stratejisi.

## Modüller

| Dosya | Rol |
|-------|-----|
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

## Ekip detay linki

Ekip üyesi detayı = liderin pipeline adayı (`pipeline_id` / `findLeaderCandidateForMember`). Saha Radarı aktivite kartları `/pipeline/[pipelineId]` kullanır; eşleşme yoksa `/ekip/[userId]` yedek.
