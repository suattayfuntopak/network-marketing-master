import type { QueryClient } from '@tanstack/react-query'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import {
  getCrownSahaRadarAction,
  getCrownVideoPageAction,
  getCrownTeamMonthlyPulseAction,
  getCrownTeamWeeklyPulseAction,
  getCrownEntriesPageAction,
  getHubYearlySelfAction,
  getHubDailySelfAction,
  getHubMonthlyInsightsAction,
  getHubMonthlySelfAction,
  getHubWeeklySelfAction,
} from '@/app/(dashboard)/crown/actions'
import { getGoalDashboardAction } from '@/app/(dashboard)/hedef/actions'
import {
  getTeamFieldActivityAction,
  getTeamRankingMetricsBatchAction,
} from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import { hasTeamPageAccess, hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { MemberRow } from '@/lib/team/types'
import { queryKeys } from './keys'
import { QUERY_STALE } from './staleTimes'

type WsSlice = {
  licenseType?: string | null
  isSuperAdmin?: boolean
}

export type RoutePrefetchWs = WsSlice

export function downlineActivityMemberIds(rows: MemberRow[]): string[] {
  return rows
    .filter(m => m.role !== 'leader' && m.isAppUser !== false)
    .map(m => m.user_id)
    .filter(Boolean)
}

async function prefetchTeamFieldPeriods(
  queryClient: QueryClient,
  workspaceId: string,
  memberIds: string[],
) {
  if (memberIds.length === 0) return
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.teamFieldActivity(workspaceId, '7d', memberIds),
      queryFn: () => getTeamFieldActivityAction(workspaceId, '7d', memberIds),
      staleTime: QUERY_STALE.metrics,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.teamFieldActivity(workspaceId, '30d', memberIds),
      queryFn: () => getTeamFieldActivityAction(workspaceId, '30d', memberIds),
      staleTime: QUERY_STALE.metrics,
    }),
  ])
}

/** Saha özeti hub metrikleri — yalnızca /saha-ozetim ve ilgili route'larda. */
export async function prefetchHubMetrics(
  queryClient: QueryClient,
  workspaceId: string,
  ws: WsSlice,
) {
  const tasks: Promise<void>[] = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubDailySelf(0),
      queryFn: () => getHubDailySelfAction(0),
      staleTime: QUERY_STALE.metrics,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubWeeklySelf(0),
      queryFn: () => getHubWeeklySelfAction(0),
      staleTime: QUERY_STALE.metrics,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlySelf(0),
      queryFn: () => getHubMonthlySelfAction(0),
      staleTime: QUERY_STALE.metrics,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlyInsights(0),
      queryFn: getHubMonthlyInsightsAction,
      staleTime: QUERY_STALE.metrics,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubYearlySelf(0),
      queryFn: () => getHubYearlySelfAction(0),
      staleTime: QUERY_STALE.metrics,
    }),
  ]

  if (hasTeamPulseAccess(ws.licenseType, ws.isSuperAdmin)) {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: ['crown', 'team-weekly-pulse', workspaceId],
        queryFn: () => getCrownTeamWeeklyPulseAction(workspaceId),
        staleTime: QUERY_STALE.metrics,
      }),
      queryClient.prefetchQuery({
        queryKey: ['crown', 'team-monthly-pulse', workspaceId],
        queryFn: () => getCrownTeamMonthlyPulseAction(workspaceId),
        staleTime: QUERY_STALE.metrics,
      }),
      queryClient.prefetchQuery({
        queryKey: ['crown', 'entries', workspaceId],
        queryFn: () => getCrownEntriesPageAction(workspaceId),
        staleTime: QUERY_STALE.metrics,
      }),
    )
  }

  await Promise.all(tasks)

  const team = queryClient.getQueryData<{ ekipRows: MemberRow[] }>(queryKeys.team(workspaceId))
  if (team && hasTeamPulseAccess(ws.licenseType, ws.isSuperAdmin)) {
    await prefetchTeamFieldPeriods(
      queryClient,
      workspaceId,
      downlineActivityMemberIds(team.ekipRows),
    )
  }
}

/** Pano — aday listesi + saha nabız özeti. */
export async function prefetchPanoMetrics(queryClient: QueryClient, workspaceId: string) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.candidates(workspaceId),
      queryFn: () => fetchCandidatesAction(workspaceId),
      staleTime: QUERY_STALE.data,
    }),
    queryClient.prefetchQuery({
      queryKey: ['pano-field-insights', workspaceId],
      queryFn: () => getMyPanoInsightsAction(workspaceId),
      staleTime: QUERY_STALE.metrics,
    }),
  ])
}

/** Ekibim eğitim sekmesi — onboarding + video ilerleme haritası. */
export async function prefetchEkipTrainingMetrics(
  queryClient: QueryClient,
  workspaceId: string,
  ws: WsSlice,
) {
  if (!hasTeamPulseAccess(ws.licenseType, ws.isSuperAdmin)) return

  let team = queryClient.getQueryData<{ ekipRows: MemberRow[] }>(queryKeys.team(workspaceId))
  if (!team) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.team(workspaceId),
      queryFn: () => fetchTeamBundleAction(workspaceId),
      staleTime: QUERY_STALE.data,
    })
    team = queryClient.getQueryData(queryKeys.team(workspaceId))
  }

  const memberIds = (team?.ekipRows ?? [])
    .filter(m => m.role !== 'leader')
    .map(m => m.user_id)
    .filter(Boolean)
  if (memberIds.length === 0) return

  await queryClient.prefetchQuery({
    queryKey: queryKeys.teamProgressMap(workspaceId, memberIds),
    queryFn: () => getTeamProgressMapAction(workspaceId, memberIds),
    staleTime: QUERY_STALE.metrics,
  })
}

/** Ekibim saha özeti — tek batch ranking sorgusu. */
export async function prefetchEkipRankingMetrics(
  queryClient: QueryClient,
  workspaceId: string,
  ws: WsSlice,
) {
  if (!hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) return

  let team = queryClient.getQueryData<{ ekipRows: MemberRow[] }>(queryKeys.team(workspaceId))
  if (!team) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.team(workspaceId),
      queryFn: () => fetchTeamBundleAction(workspaceId),
      staleTime: QUERY_STALE.data,
    })
    team = queryClient.getQueryData(queryKeys.team(workspaceId))
  }

  const memberIds = downlineActivityMemberIds(team?.ekipRows ?? [])
  if (memberIds.length === 0) return

  await queryClient.prefetchQuery({
    queryKey: queryKeys.teamRankingMetricsBatch(workspaceId, memberIds),
    queryFn: () => getTeamRankingMetricsBatchAction(workspaceId, memberIds),
    staleTime: QUERY_STALE.metrics,
  })
}

/** Nav / pano kutusu hover — hedef route verisini önceden yükle. */
export function prefetchRouteMetrics(
  queryClient: QueryClient,
  href: string,
  workspaceId: string | undefined,
  ws?: WsSlice | null,
) {
  if (!workspaceId) return

  const wsSlice = ws ?? { licenseType: null, isSuperAdmin: false }

  if (
    href === '/pano' ||
    href === '/pipeline' ||
    href.startsWith('/pipeline') ||
    href === '/istatistikler'
  ) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.candidates(workspaceId),
      queryFn: () => fetchCandidatesAction(workspaceId),
      staleTime: QUERY_STALE.data,
    })
  }

  if (href === '/pano') {
    void queryClient.prefetchQuery({
      queryKey: ['pano-field-insights', workspaceId],
      queryFn: () => getMyPanoInsightsAction(workspaceId),
      staleTime: QUERY_STALE.metrics,
    })
  }

  const teamRoutes = new Set([
    '/ekip',
    '/istatistikler',
    '/saha-ozetim',
    '/saha-radar',
    '/canli-egitim',
  ])
  if (teamRoutes.has(href)) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.team(workspaceId),
      queryFn: () => fetchTeamBundleAction(workspaceId),
      staleTime: QUERY_STALE.data,
    })
  }

  if (href === '/hedefim') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.goalDashboard(),
      queryFn: getGoalDashboardAction,
      staleTime: QUERY_STALE.metrics,
    })
  }

  if (href === '/saha-ozetim') {
    void prefetchHubMetrics(queryClient, workspaceId, wsSlice)
  }

  if (href === '/ekip' || href === '/ekibim') {
    void prefetchEkipRankingMetrics(queryClient, workspaceId, wsSlice)
    void prefetchEkipTrainingMetrics(queryClient, workspaceId, wsSlice)
  }

  if (href === '/canli-egitim') {
    void queryClient.prefetchQuery({
      queryKey: ['crown', 'video', workspaceId],
      queryFn: () => getCrownVideoPageAction(workspaceId),
      staleTime: QUERY_STALE.metrics,
    })
  }

  if (href === '/saha-radar') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.crownSahaRadar(workspaceId),
      queryFn: () => getCrownSahaRadarAction(workspaceId),
      staleTime: QUERY_STALE.metrics,
    })
  }
}
