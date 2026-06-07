import type { QueryClient } from '@tanstack/react-query'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { fetchAIUsageAction } from '@/app/(dashboard)/actions/aiUsage'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getPlatformWorkspacesAction } from '@/app/(dashboard)/platform-yonetim/actions'
import { getPendingRequestsAction } from '@/app/(dashboard)/actions/moderation'
import { getGoalDashboardAction } from '@/app/(dashboard)/hedef/actions'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import {
  getHubWeeklySelfAction,
  getHubMonthlyInsightsAction,
  getCrownFirst30PageAction,
} from '@/app/(dashboard)/crown/actions'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import { queryKeys } from './keys'

const WORKSPACE_STALE = 5 * 60 * 1000
const CANDIDATES_STALE = 2 * 60 * 1000

const TEAM_STALE = 2 * 60 * 1000

/** Dashboard layout SSR: workspace + paralel aday/ekip/platform verisi önbelleğe alınır. */
export async function prefetchDashboardQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
    staleTime: WORKSPACE_STALE,
  })

  const ws = queryClient.getQueryData<WorkspaceContext | null>(queryKeys.workspace())
  if (!ws?.workspaceId) return

  const parallel: Promise<void>[] = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.candidates(ws.workspaceId),
      queryFn: () => fetchCandidatesAction(ws.workspaceId),
      staleTime: CANDIDATES_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.team(ws.workspaceId),
      queryFn: () => fetchTeamBundleAction(ws.workspaceId),
      staleTime: TEAM_STALE,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dailyAiUsage(),
      queryFn: fetchAIUsageAction,
      staleTime: 60_000,
    }),
    // Hedef kartı + saha özeti kutuları: prefetch → pano/bugün'de "sonra dolma" yok.
    queryClient.prefetchQuery({
      queryKey: queryKeys.goalDashboard(),
      queryFn: getGoalDashboardAction,
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['pano-field-insights', ws.workspaceId],
      queryFn: () => getMyPanoInsightsAction(ws.workspaceId),
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.videoCatalog(ws.workspaceId),
      queryFn: () => getVideoCatalogAction(ws.workspaceId),
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubWeeklySelf(),
      queryFn: getHubWeeklySelfAction,
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.hubMonthlyInsights(),
      queryFn: getHubMonthlyInsightsAction,
      staleTime: 60_000,
    }),
  ]

  if (ws.isSuperAdmin) {
    parallel.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.platformWorkspaces(),
        queryFn: getPlatformWorkspacesAction,
        staleTime: 60_000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.platformModeration(),
        queryFn: getPendingRequestsAction,
        staleTime: 30_000,
      })
    )
  }

  if (hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) {
    parallel.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.crownFirst30(ws.workspaceId),
        queryFn: () => getCrownFirst30PageAction(ws.workspaceId),
        staleTime: 60_000,
      }),
    )
  }

  await Promise.all(parallel)

  // Ekip Aktivite Özeti (Ekibim sayfası) — team erişimi olanlarda "pat diye" gelsin.
  if (hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) {
    const team = queryClient.getQueryData<{ members: { user_id: string; role: string }[] }>(
      queryKeys.team(ws.workspaceId)
    )
    const ids = (team?.members ?? [])
      .filter((m) => m.role === 'member')
      .map((m) => m.user_id)
    if (ids.length > 0) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.teamFieldActivity(ws.workspaceId, '30d', ids),
        queryFn: () => getTeamFieldActivityAction(ws.workspaceId, '30d', ids),
        staleTime: 30_000,
      })
    }
  }
}
