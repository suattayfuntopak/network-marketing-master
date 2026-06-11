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
import type { WorkspaceContext } from '@/hooks/useWorkspace'

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
  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  const ws = queryClient.getQueryData<WorkspaceContext | null>(queryKeys.workspace())
  if (ws?.workspaceId) {
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
    await queryClient.prefetchQuery({ queryKey: active.key, queryFn: active.fn, staleTime: 60_000 })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="px-4 py-8 text-sm text-[var(--text-3)]">…</div>
        }
      >
        <FieldSummaryPage />
      </Suspense>
    </HydrationBoundary>
  )
}
