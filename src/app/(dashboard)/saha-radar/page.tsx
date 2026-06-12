import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { CrownSahaRadarPage } from './_components/CrownSahaRadarPage'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { getCrownSahaRadarAction } from './actions'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'

export default async function SahaRadarPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
    staleTime: QUERY_STALE.workspace,
  })

  const ws = queryClient.getQueryData<Awaited<ReturnType<typeof fetchWorkspaceAction>>>(
    queryKeys.workspace(),
  )

  if (ws?.workspaceId && hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.crownSahaRadar(ws.workspaceId),
      queryFn: () => getCrownSahaRadarAction(ws.workspaceId),
      staleTime: QUERY_STALE.metrics,
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CrownSahaRadarPage />
    </HydrationBoundary>
  )
}
