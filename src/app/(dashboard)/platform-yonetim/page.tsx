import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import { prefetchPlatformAdminQueries } from '@/lib/query/prefetchPlatformAdmin'
import { PlatformYonetimContent } from './_components/PlatformYonetimContent'

export default async function PlatformYonetimPage() {
  const queryClient = getQueryClient()

  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
    staleTime: QUERY_STALE.workspace,
  })

  if ((ws as WorkspaceContext | null)?.isSuperAdmin) {
    await prefetchPlatformAdminQueries(queryClient)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlatformYonetimContent />
    </HydrationBoundary>
  )
}
