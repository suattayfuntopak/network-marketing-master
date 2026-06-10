import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { AkademiContent } from './_components/AkademiContent'
import {
  getAkademiCustomCountsAction,
  getFullSelfUserProgressAction,
} from '@/app/(dashboard)/egitim/akademiProgressActions'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

export default async function EgitimPage() {
  const queryClient = getQueryClient()
  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  if (ws?.workspaceId) {
    await Promise.all([
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
      <Suspense
        fallback={
          <div className="flex min-h-[300px] items-center justify-center p-8 text-center text-sm text-[var(--text-3)]">
            Loading…
          </div>
        }
      >
        <AkademiContent />
      </Suspense>
    </HydrationBoundary>
  )
}
