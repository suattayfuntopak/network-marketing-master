import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { AkademiContent } from './_components/AkademiContent'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { prefetchAkademiProgressBundle } from '@/lib/query/prefetchRouteMetrics'
import { queryKeys } from '@/lib/query/keys'

export default async function EgitimPage() {
  const queryClient = getQueryClient()
  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  if (ws?.workspaceId) {
    await prefetchAkademiProgressBundle(queryClient, ws.workspaceId)
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
