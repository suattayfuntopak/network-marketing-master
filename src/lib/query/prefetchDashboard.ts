import type { QueryClient } from '@tanstack/react-query'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { fetchAIUsageAction } from '@/app/(dashboard)/actions/aiUsage'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getPlatformWorkspacesAction } from '@/app/(dashboard)/platform-yonetim/actions'
import { getPendingRequestsAction } from '@/app/(dashboard)/actions/moderation'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import { queryKeys } from './keys'
import { QUERY_STALE } from './staleTimes'

/** Dashboard layout SSR: yalnızca kritik veri; route metrikleri nav/hover ile ısınır. */
export async function prefetchDashboardQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
    staleTime: QUERY_STALE.workspace,
  })

  const ws = queryClient.getQueryData<WorkspaceContext | null>(queryKeys.workspace())
  if (!ws?.workspaceId) return

  await Promise.all([
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
  ])

  const background: Promise<unknown>[] = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.videoCatalog(ws.workspaceId),
      queryFn: () => getVideoCatalogAction(ws.workspaceId),
      staleTime: QUERY_STALE.usage,
    }),
  ]

  if (ws.isSuperAdmin) {
    background.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.platformWorkspaces(),
        queryFn: getPlatformWorkspacesAction,
        staleTime: QUERY_STALE.usage,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.platformModeration(),
        queryFn: getPendingRequestsAction,
        staleTime: QUERY_STALE.metrics,
      }),
    )
  }

  void Promise.all(background)
}
