import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { FieldSummaryPage } from './_components/FieldSummaryPage'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { parseSummaryTab } from '@/lib/domain/hubPeriodPrefetch'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { prefetchHubMetrics } from '@/lib/query/prefetchRouteMetrics'
import { queryKeys } from '@/lib/query/keys'
import type { WorkspaceContext } from '@/hooks/useWorkspace'

type Props = { searchParams: Promise<{ tab?: string }> }

export default async function SahaOzetimPage({ searchParams }: Props) {
  const { tab: tabRaw } = await searchParams
  const activeTab = parseSummaryTab(tabRaw ?? null)

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  const ws = queryClient.getQueryData<WorkspaceContext | null>(queryKeys.workspace())
  if (ws?.workspaceId) {
    await prefetchHubMetrics(
      queryClient,
      ws.workspaceId,
      { licenseType: ws.licenseType, isSuperAdmin: ws.isSuperAdmin },
      { activeTab },
    )
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
