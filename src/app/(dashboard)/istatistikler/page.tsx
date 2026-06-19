import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { downlineActivityMemberIds } from '@/lib/query/prefetchRouteMetrics'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { getStatsFunnelBundleAction } from './actions'
import { IstatistiklerContent } from './_components/IstatistiklerContent'

export default async function IstatistiklerPage() {
  const queryClient = getQueryClient()

  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  if (ws?.workspaceId) {
    // Huni paketi ARTIK bloke etmiyor: StatsFieldFunnelSection kendi `isLoading`
    // ızgarasını gösterir. Eskiden bu await, KPI kartları + aday istatistikleri
    // (cache'te hazır) dahil TÜM sayfayı huni round-trip'i (~320ms) arkasında
    // bekletiyordu. Artık sayfa anında çizilir, huni akarak gelir (saha-ozetim/
    // ekip modeliyle aynı). statsFunnelBundle localStorage'da kalıcı → tekrar
    // ziyarette zaten anında dolu.
    void queryClient.prefetchQuery({
      queryKey: queryKeys.statsFunnelBundle('30d'),
      queryFn: () => getStatsFunnelBundleAction('30d'),
      staleTime: QUERY_STALE.funnelBundle,
    })

    void Promise.all([
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
    ])

    if (hasTeamPulseAccess(ws.licenseType, ws.isSuperAdmin)) {
      const team = queryClient.getQueryData<{ ekipRows: Parameters<typeof downlineActivityMemberIds>[0] }>(
        queryKeys.team(ws.workspaceId),
      )
      const memberIds = downlineActivityMemberIds(team?.ekipRows ?? [])
      if (memberIds.length > 0) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.teamProgressMap(ws.workspaceId, memberIds),
          queryFn: () => getTeamProgressMapAction(ws.workspaceId, memberIds),
          staleTime: QUERY_STALE.metrics,
        })
      }
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IstatistiklerContent />
    </HydrationBoundary>
  )
}
