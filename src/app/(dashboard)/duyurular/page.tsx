import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { getTeamAnnouncementsAction } from './actions'
import { DuyurularContent } from './_components/DuyurularContent'

export default async function DuyurularPage() {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery({
    queryKey: queryKeys.teamAnnouncements(),
    queryFn: getTeamAnnouncementsAction,
    staleTime: 60_000,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DuyurularContent />
    </HydrationBoundary>
  )
}
