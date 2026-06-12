import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { FieldSummaryPage } from './_components/FieldSummaryPage'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { parseSummaryTab } from '@/lib/domain/hubPeriodPrefetch'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import {
  getHubDailySelfAction,
  getHubMonthlySelfAction,
  getHubWeeklySelfAction,
  getHubYearlySelfAction,
  getHubAllTimeSelfAction,
} from '@/app/(dashboard)/crown/hubSelfActions'
import { Skeleton } from '@/components/ui/Skeleton'

function SahaOzetimSkeleton() {
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
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Main KPI grids skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-[14px]" />
        ))}
      </div>

      {/* Secondary section (charts/metrics) skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}

type Props = { searchParams: Promise<{ tab?: string; offset?: string }> }

/**
 * Giriş hızı: ESKİDEN `await prefetchHubMetrics` 4 dönem × birçok offset + ekip
 * nabzı = ~15 uzak sorgu BLOKLUYORDU (uzak Supabase ~230ms/sorgu → saniyeler).
 * Artık yalnızca AÇIK sekmenin GÖRÜNEN dönemi (tek sorgu) await edilir; komşu
 * dönemler ve diğer sekmeler istemcide ısıtılır (FieldSummaryInner prefetch).
 */
export default async function SahaOzetimPage({ searchParams }: Props) {
  const { tab: tabRaw, offset: offsetRaw } = await searchParams
  const activeTab = parseSummaryTab(tabRaw ?? null)
  const offset = Number.parseInt(offsetRaw ?? '0', 10) || 0

  const queryClient = getQueryClient()
  const active: { key: readonly unknown[]; fn: () => Promise<unknown> } =
    activeTab === 'daily'
      ? { key: queryKeys.hubDailySelf(offset), fn: () => getHubDailySelfAction(offset) }
      : activeTab === 'weekly'
        ? { key: queryKeys.hubWeeklySelf(offset), fn: () => getHubWeeklySelfAction(offset) }
        : activeTab === 'monthly'
          ? { key: queryKeys.hubMonthlySelf(offset), fn: () => getHubMonthlySelfAction(offset) }
          : activeTab === 'all'
            ? { key: queryKeys.hubAllTimeSelf(), fn: () => getHubAllTimeSelfAction() }
            : { key: queryKeys.hubYearlySelf(offset), fn: () => getHubYearlySelfAction(offset) }

  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })
  void queryClient.prefetchQuery({
    queryKey: active.key,
    queryFn: active.fn,
    staleTime: 60_000,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SahaOzetimSkeleton />}>
        <FieldSummaryPage />
      </Suspense>
    </HydrationBoundary>
  )
}
