import type { QueryClient } from '@tanstack/react-query'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import {
  getCrownEntriesPageAction,
  getCrownFirst30PageAction,
  getCrownSahaRadarAction,
  getCrownTeamMonthlyPulseAction,
  getCrownVideoPageAction,
  getCrownTeamWeeklyPulseAction,
  getHubAllTimeSelfAction,
  getHubDailySelfAction,
  getHubYearlySelfAction,
  getHubMonthlyInsightsAction,
  getHubMonthlySelfAction,
  getHubWeeklySelfAction,
} from '@/app/(dashboard)/crown/actions'
import { getGoalDashboardAction } from '@/app/(dashboard)/hedef/actions'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'
import { hasTeamPageAccess, hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { MemberRow } from '@/lib/team/types'
import { queryKeys } from './keys'

const DATA_STALE = 2 * 60 * 1000
const METRICS_STALE = 60 * 1000

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
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.teamFieldActivity(workspaceId, '30d', memberIds),
      queryFn: () => getTeamFieldActivityAction(workspaceId, '30d', memberIds),
      staleTime: METRICS_STALE,
    }),
  ])
}

/** Haftalık/aylık hub + ilgili crown metrikleri — layout SSR ve nav hover. */
export async function prefetchHubMetrics(
  queryClient: QueryClient,
  workspaceId: string,
  ws: WsSlice,
) {
  const tasks: Promise<void>[] = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubDailySelf(0),
      queryFn: () => getHubDailySelfAction(0),
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubWeeklySelf(0),
      queryFn: () => getHubWeeklySelfAction(0),
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlySelf(0),
      queryFn: () => getHubMonthlySelfAction(0),
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlyInsights(0),
      queryFn: getHubMonthlyInsightsAction,
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubYearlySelf(0),
      queryFn: () => getHubYearlySelfAction(0),
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubAllTimeSelf(),
      queryFn: () => getHubAllTimeSelfAction(),
      staleTime: METRICS_STALE,
    }),
  ]

  if (hasTeamPulseAccess(ws.licenseType, ws.isSuperAdmin)) {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: ['crown', 'team-weekly-pulse', workspaceId],
        queryFn: () => getCrownTeamWeeklyPulseAction(workspaceId),
        staleTime: METRICS_STALE,
      }),
      queryClient.prefetchQuery({
        queryKey: ['crown', 'team-monthly-pulse', workspaceId],
        queryFn: () => getCrownTeamMonthlyPulseAction(workspaceId),
        staleTime: METRICS_STALE,
      }),
      queryClient.prefetchQuery({
        queryKey: ['crown', 'entries', workspaceId],
        queryFn: () => getCrownEntriesPageAction(workspaceId),
        staleTime: METRICS_STALE,
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

/** Dashboard layout — sık kullanılan metrikleri paralel ısıt. */
export async function prefetchDashboardMetrics(
  queryClient: QueryClient,
  workspaceId: string,
  ws: WsSlice,
) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.goalDashboard(),
      queryFn: getGoalDashboardAction,
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: ['pano-field-insights', workspaceId],
      queryFn: () => getMyPanoInsightsAction(workspaceId),
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: ['crown', 'video', workspaceId],
      queryFn: () => getCrownVideoPageAction(workspaceId),
      staleTime: METRICS_STALE,
    }),
    prefetchHubMetrics(queryClient, workspaceId, ws),
  ])

  if (hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.crownFirst30(workspaceId),
      queryFn: () => getCrownFirst30PageAction(workspaceId),
      staleTime: METRICS_STALE,
    })
  }
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
      staleTime: DATA_STALE,
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
      staleTime: DATA_STALE,
    })
  }

  if (href === '/hedefim') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.goalDashboard(),
      queryFn: getGoalDashboardAction,
      staleTime: METRICS_STALE,
    })
  }

  if (href === '/saha-ozetim') {
    void prefetchHubMetrics(queryClient, workspaceId, wsSlice)
  }

  if (href === '/canli-egitim') {
    void queryClient.prefetchQuery({
      queryKey: ['crown', 'video', workspaceId],
      queryFn: () => getCrownVideoPageAction(workspaceId),
      staleTime: METRICS_STALE,
    })
  }

  if (href === '/saha-radar') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.crownSahaRadar(workspaceId),
      queryFn: () => getCrownSahaRadarAction(workspaceId),
      staleTime: METRICS_STALE,
    })
  }

}
