import type { QueryClient } from '@tanstack/react-query'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { fetchAIUsageAction } from '@/app/(dashboard)/actions/aiUsage'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getPlatformWorkspacesAction } from '@/app/(dashboard)/platform-yonetim/actions'
import { getPendingRequestsAction } from '@/app/(dashboard)/actions/moderation'
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

  await Promise.all(parallel)
}
