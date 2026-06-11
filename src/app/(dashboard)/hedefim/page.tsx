import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { getGoalDashboardAction } from '@/app/(dashboard)/hedef/actions'
import { HedefPage } from './_components/HedefPage'

export default async function HedefimRoutePage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.goalDashboard(),
    queryFn: getGoalDashboardAction,
    staleTime: 60_000,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HedefPage />
    </HydrationBoundary>
  )
}

