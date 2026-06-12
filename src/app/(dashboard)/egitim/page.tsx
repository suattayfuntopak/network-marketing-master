import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { AkademiContent } from './_components/AkademiContent'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { prefetchAkademiProgressBundle } from '@/lib/query/prefetchRouteMetrics'
import { queryKeys } from '@/lib/query/keys'
import { Skeleton } from '@/components/ui/Skeleton'

function EgitimSkeleton() {
  return (
    <div className="w-full space-y-6 px-4 pb-28 pt-6 md:pb-8 animate-pulse">
      {/* Header section skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Info card banner skeleton */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* Category selector row skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
    </div>
  )
}

export default async function EgitimPage() {
  const queryClient = getQueryClient()
  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  if (ws?.workspaceId) {
    void prefetchAkademiProgressBundle(queryClient, ws.workspaceId)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<EgitimSkeleton />}>
        <AkademiContent />
      </Suspense>
    </HydrationBoundary>
  )
}
