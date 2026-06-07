import type { QueryClient } from '@tanstack/react-query'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getDailyTrackAction } from '@/app/(dashboard)/bugunku-takibim/actions'
import {
  getCrownEntriesPageAction,
  getCrownFirst30PageAction,
  getCrownMonthlyPageAction,
  getCrownVideoPageAction,
  getCrownWeeklyPageAction,
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
      queryKey: queryKeys.hubWeeklySelf(),
      queryFn: getHubWeeklySelfAction,
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlySelf(),
      queryFn: getHubMonthlySelfAction,
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlyInsights(),
      queryFn: getHubMonthlyInsightsAction,
      staleTime: METRICS_STALE,
    }),
  ]

  if (hasTeamPulseAccess(ws.licenseType, ws.isSuperAdmin)) {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: ['crown', 'weekly-page', workspaceId],
        queryFn: () => getCrownWeeklyPageAction(workspaceId),
        staleTime: METRICS_STALE,
      }),
      queryClient.prefetchQuery({
        queryKey: ['crown', 'monthly-page', workspaceId],
        queryFn: () => getCrownMonthlyPageAction(workspaceId),
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
    queryClient.prefetchQuery({
      queryKey: queryKeys.dailyTrack('tr'),
      queryFn: () => getDailyTrackAction('tr'),
      staleTime: METRICS_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dailyTrack('en'),
      queryFn: () => getDailyTrackAction('en'),
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
    '/haftalik-ozet',
    '/aylik-ozet',
    '/ilk-30-gun',
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

  if (href === '/bugunku-takibim') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.dailyTrack('tr'),
      queryFn: () => getDailyTrackAction('tr'),
      staleTime: METRICS_STALE,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.dailyTrack('en'),
      queryFn: () => getDailyTrackAction('en'),
      staleTime: METRICS_STALE,
    })
  }

  if (href === '/canli-egitim') {
    void queryClient.prefetchQuery({
      queryKey: ['crown', 'video', workspaceId],
      queryFn: () => getCrownVideoPageAction(workspaceId),
      staleTime: METRICS_STALE,
    })
  }

  if (href === '/ilk-30-gun' && hasTeamPageAccess(wsSlice.licenseType, wsSlice.isSuperAdmin)) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.crownFirst30(workspaceId),
      queryFn: () => getCrownFirst30PageAction(workspaceId),
      staleTime: METRICS_STALE,
    })
  }

  if (href === '/haftalik-ozet' || href === '/aylik-ozet') {
    void prefetchHubMetrics(queryClient, workspaceId, wsSlice)
  }
}
