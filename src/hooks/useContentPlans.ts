'use client'

import { useQuery } from '@tanstack/react-query'
import { getContentPlansAction } from '@/app/(dashboard)/yazar/contentPlanActions'
import { queryKeys } from '@/lib/query/keys'

/** İçerik takvimi planları (Sosyal Stüdyo "Planlarım"). */
export function useContentPlans() {
  return useQuery({
    queryKey: queryKeys.contentPlans(),
    queryFn: getContentPlansAction,
    staleTime: 60_000,
  })
}
