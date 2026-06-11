import type { QueryClient } from '@tanstack/react-query'
import { getPlatformWorkspacesAction } from '@/app/(dashboard)/platform-yonetim/actions'
import { getPendingRequestsAction } from '@/app/(dashboard)/actions/moderation'
import { queryKeys } from './keys'
import { QUERY_STALE } from './staleTimes'

/** Admin sayfası — workspace + moderasyon listesi (SSR veya hover). */
export async function prefetchPlatformAdminQueries(queryClient: QueryClient) {
  await Promise.all([
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
  ])
}
