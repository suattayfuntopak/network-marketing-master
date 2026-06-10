import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { CrownVideoPage } from './_components/CrownVideoPage'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

export default async function CanliEgitimPage() {
  const queryClient = getQueryClient()
  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  if (ws?.workspaceId) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.videoCatalog(ws.workspaceId),
      queryFn: () => getVideoCatalogAction(ws.workspaceId),
      staleTime: QUERY_STALE.usage,
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CrownVideoPage />
    </HydrationBoundary>
  )
}
