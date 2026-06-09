import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { prefetchPanoMetrics } from '@/lib/query/prefetchRouteMetrics'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import { PanoContent } from './_components/PanoContent'

export default async function PanoPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  const ws = queryClient.getQueryData<WorkspaceContext | null>(queryKeys.workspace())
  if (ws?.workspaceId) {
    await prefetchPanoMetrics(queryClient, ws.workspaceId)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main
        data-main-scroll
        className="flex flex-1 flex-col bg-[var(--bg)] px-4 pb-28 pt-4 md:h-[calc(100dvh-4rem)] md:overflow-hidden md:pb-6 md:pt-5"
      >
        <PanoContent />
      </main>
    </HydrationBoundary>
  )
}
