'use client'

import { useQuery } from '@tanstack/react-query'
import { getActivityStreakAction } from '@/app/(dashboard)/_shared-actions/streak'
import { queryKeys } from '@/lib/query/keys'

/**
 * Ardışık aktif-gün serisi (streak). Pano'da prefetch'lenir → çip anında hazırdır.
 */
export function useActivityStreak() {
  return useQuery({
    queryKey: queryKeys.activityStreak(),
    queryFn: getActivityStreakAction,
    staleTime: 5 * 60_000,
  })
}
