import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { queryKeys } from '@/lib/query/keys'
import { getCustomersAction } from './actions'
import { MusterilerContent } from './_components/MusterilerContent'

export default async function MusterilerPage() {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery({
    queryKey: queryKeys.customers(),
    queryFn: getCustomersAction,
    staleTime: 60_000,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MusterilerContent />
    </HydrationBoundary>
  )
}
