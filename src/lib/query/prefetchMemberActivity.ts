import type { QueryClient } from '@tanstack/react-query'
import { getMemberActivityDetailAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { PULSE_PERIOD_OPTIONS } from '@/lib/domain/pulsePeriodLabels'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

/** Ekip kartı hover veya sheet mount — 5 dönemin tamamını önbelleğe al. */
export function prefetchMemberActivity(
  queryClient: QueryClient,
  workspaceId: string,
  userId: string,
): void {
  for (const p of PULSE_PERIOD_OPTIONS) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.memberActivity(workspaceId, userId, p),
      queryFn: () => getMemberActivityDetailAction(workspaceId, userId, p),
      staleTime: QUERY_STALE.memberActivity,
    })
  }
}
