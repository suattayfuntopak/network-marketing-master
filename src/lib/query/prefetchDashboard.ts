import type { QueryClient } from '@tanstack/react-query'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { fetchAIUsageAction } from '@/app/(dashboard)/actions/aiUsage'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { prefetchPlatformAdminQueries } from '@/lib/query/prefetchPlatformAdmin'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import { queryKeys } from './keys'
import { QUERY_STALE } from './staleTimes'

/**
 * Dashboard layout SSR: yalnızca SHELL + ilk sayfa için gereken kritik veri.
 *
 * KİLİTLİ — burada ekip/hub/istatistik metriklerini ısıtma. Eskiden layout
 * `warmDashboardMetrics` ile süper admin için 15-20 DB round-trip'ini ilk
 * paint'ten ÖNCE bloke ediyordu (Türkiye→origin ~320ms/sorgu = 3-5 sn boş
 * ekran). O metrikleri her route zaten KENDİ server page'inde + sidebar/alt-nav
 * hover'ında (`prefetchRouteData`) ısıtıyor; layout'ta tekrar ısıtmak saf ölü
 * ağırlıktı. Buraya yeni `await` eklemek giriş→pano yavaşlamasını geri getirir.
 */
export async function prefetchDashboardQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
    staleTime: QUERY_STALE.workspace,
  })

  const ws = queryClient.getQueryData<WorkspaceContext | null>(queryKeys.workspace())
  if (!ws?.workspaceId) return

  // İlk paint'i HİÇBİR veri sorgusuna bloke etme. Shell (Header/Sidebar/BottomNav)
  // yalnızca workspace'i (yukarıda await edildi) kullanır. Aday listesi DAHİL geri
  // kalan her şey arka planda — PanoContent `useCandidates` ile client'ta yükler
  // (kendi loading durumu var; skeleton akar).
  //
  // - candidates: fetchAllCandidatesAction 50'şerli SAYFALAMA yapar; çok-adaylı
  //   workspace'te seri turlar SSR TTFB'sini saniyelerce bekletiyordu (Mumbai
  //   ~320ms/tur). Await'ten çıkarıldı → sayfa hemen gelir, adaylar client'ta dolar.
  // - team (fetchTeamBundle): en AĞIR aksiyon (zincirleme RPC); Pano kullanmaz,
  //   İstatistikler/Ekip kendi server prefetch'inde ısıtır.
  // - aiUsage: yalnız İstatistikler kotası + AI modal'ı kullanır.
  const background: Promise<unknown>[] = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.candidates(ws.workspaceId),
      queryFn: () => fetchCandidatesAction(ws.workspaceId),
      staleTime: QUERY_STALE.data,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.team(ws.workspaceId),
      queryFn: () => fetchTeamBundleAction(ws.workspaceId),
      staleTime: QUERY_STALE.data,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dailyAiUsage(),
      queryFn: fetchAIUsageAction,
      staleTime: QUERY_STALE.usage,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.videoCatalog(ws.workspaceId),
      queryFn: () => getVideoCatalogAction(ws.workspaceId),
      staleTime: QUERY_STALE.usage,
    }),
  ]

  if (ws.isSuperAdmin) {
    background.push(prefetchPlatformAdminQueries(queryClient))
  }

  void Promise.all(background)
}
