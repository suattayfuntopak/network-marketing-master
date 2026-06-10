import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { CrownVideoPage } from './_components/CrownVideoPage'
import {
  getAkademiCustomCountsAction,
  getFullSelfUserProgressAction,
} from '@/app/(dashboard)/egitim/akademiProgressActions'
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
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.videoCatalog(ws.workspaceId),
        queryFn: () => getVideoCatalogAction(ws.workspaceId),
        staleTime: QUERY_STALE.usage,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.selfUserProgress(),
        queryFn: getFullSelfUserProgressAction,
        staleTime: QUERY_STALE.progress,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.akademiCustomCounts(ws.workspaceId),
        queryFn: getAkademiCustomCountsAction,
        staleTime: QUERY_STALE.usage,
      }),
    ])
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CrownVideoPage />
    </HydrationBoundary>
  )
}
