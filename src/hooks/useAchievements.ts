'use client'

import { useQuery } from '@tanstack/react-query'
import { getAchievementsAction } from '@/app/(dashboard)/_shared-actions/achievements'
import { queryKeys } from '@/lib/query/keys'

/** Başarılar & rozetler — mevcut metriklerden türetilir, 5 dk taze. */
export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements(),
    queryFn: getAchievementsAction,
    staleTime: 5 * 60_000,
  })
}
