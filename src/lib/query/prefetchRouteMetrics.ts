import type { QueryClient } from '@tanstack/react-query'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import {
  getCrownSahaRadarAction,
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
import { fetchAIUsageAction } from '@/app/(dashboard)/actions/aiUsage'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import {
  getAkademiCustomCountsAction,
  getFullSelfUserProgressAction,
} from '@/app/(dashboard)/egitim/akademiProgressActions'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import { recordHubPrefetchEventAction } from '@/app/(dashboard)/platform-yonetim/hubPrefetchActions'
import { prefetchPlatformAdminQueries } from '@/lib/query/prefetchPlatformAdmin'
import {
  hubPeriodOffsetsForPrefetch,
  readStoredHubActiveTab,
  recordHubPrefetchStats,
  shouldLogHubPrefetch,
  type HubPeriodTab,
} from '@/lib/domain/hubPeriodPrefetch'
import { hasTeamPageAccess, hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { MemberRow } from '@/lib/team/types'
import { queryKeys } from './keys'
import { QUERY_STALE } from './staleTimes'

type WsSlice = {
  licenseType?: string | null
  isSuperAdmin?: boolean
}

/** Eğitim / canlı eğitim — tam progress + özel içerik sayıları. */
export async function prefetchAkademiProgressBundle(
  queryClient: QueryClient,
  workspaceId: string,
) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.selfUserProgress(),
      queryFn: getFullSelfUserProgressAction,
      staleTime: QUERY_STALE.progress,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.akademiCustomCounts(workspaceId),
      queryFn: getAkademiCustomCountsAction,
      staleTime: QUERY_STALE.usage,
    }),
  ])
}

export type HubMetricsPrefetchOpts = {
  /** SSR veya URL'den gelen sekme — komşu offset yalnızca bu sekmede. */
  activeTab?: HubPeriodTab
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
  opts?: HubMetricsPrefetchOpts,
) {
  const activeTab = opts?.activeTab
  const tasks: Promise<void>[] = []
  let hubSelfPrefetchCount = 0

  for (const offset of hubPeriodOffsetsForPrefetch(activeTab, 'daily')) {
    hubSelfPrefetchCount += 1
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.hubDailySelf(offset),
        queryFn: () => getHubDailySelfAction(offset),
        staleTime: QUERY_STALE.metrics,
      }),
    )
  }
  for (const offset of hubPeriodOffsetsForPrefetch(activeTab, 'weekly')) {
    hubSelfPrefetchCount += 1
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.hubWeeklySelf(offset),
        queryFn: () => getHubWeeklySelfAction(offset),
        staleTime: QUERY_STALE.metrics,
      }),
    )
  }
  for (const offset of hubPeriodOffsetsForPrefetch(activeTab, 'monthly')) {
    hubSelfPrefetchCount += 1
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.hubMonthlySelf(offset),
        queryFn: () => getHubMonthlySelfAction(offset),
        staleTime: QUERY_STALE.metrics,
      }),
    )
  }
  for (const offset of hubPeriodOffsetsForPrefetch(activeTab, 'yearly')) {
    hubSelfPrefetchCount += 1
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.hubYearlySelf(offset),
        queryFn: () => getHubYearlySelfAction(offset),
        staleTime: QUERY_STALE.metrics,
      }),
    )
  }
  tasks.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlyInsights(0),
      queryFn: getHubMonthlyInsightsAction,
      staleTime: QUERY_STALE.metrics,
    }),
  )

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

  const prefetchSummary = {
    activeTab: activeTab ?? 'none',
    hubSelfQueries: hubSelfPrefetchCount,
    totalTasks: tasks.length,
  }
  if (shouldLogHubPrefetch()) {
    console.debug('[prefetchHubMetrics]', prefetchSummary)
  }
  if (typeof window !== 'undefined') {
    recordHubPrefetchStats(prefetchSummary)
  }
  void recordHubPrefetchEventAction({
    workspaceId,
    activeTab: prefetchSummary.activeTab,
    hubSelfQueries: prefetchSummary.hubSelfQueries,
    totalTasks: prefetchSummary.totalTasks,
    source: typeof window === 'undefined' ? 'ssr' : 'hover',
  })

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
    void prefetchPanoMetrics(queryClient, workspaceId)
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
    const storedTab = readStoredHubActiveTab()
    void prefetchHubMetrics(queryClient, workspaceId, wsSlice, {
      activeTab: storedTab,
    })
  }

  if (href === '/ekip' || href === '/ekibim') {
    void prefetchEkipRankingMetrics(queryClient, workspaceId, wsSlice)
    void prefetchEkipTrainingMetrics(queryClient, workspaceId, wsSlice)
  }

  if (href === '/canli-egitim') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.videoCatalog(workspaceId),
      queryFn: () => getVideoCatalogAction(workspaceId),
      staleTime: QUERY_STALE.usage,
    })
    void prefetchAkademiProgressBundle(queryClient, workspaceId)
  }

  if (href === '/egitim') {
    void prefetchAkademiProgressBundle(queryClient, workspaceId)
  }

  if (href === '/platform-yonetim' && wsSlice.isSuperAdmin) {
    void prefetchPlatformAdminQueries(queryClient)
  }

  if (href === '/istatistikler') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.dailyAiUsage(),
      queryFn: fetchAIUsageAction,
      staleTime: QUERY_STALE.usage,
    })
    if (hasTeamPageAccess(wsSlice.licenseType, wsSlice.isSuperAdmin)) {
      void prefetchEkipRankingMetrics(queryClient, workspaceId, wsSlice)
    }
  }

  if (href === '/saha-radar') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.crownSahaRadar(workspaceId),
      queryFn: () => getCrownSahaRadarAction(workspaceId),
      staleTime: QUERY_STALE.metrics,
    })
  }
}
