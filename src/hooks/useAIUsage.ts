'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchAIUsageAction, type AIUsageData } from '@/app/(dashboard)/actions/aiUsage'
import { queryKeys } from '@/lib/query/keys'

export type { AIUsageData }

export function useAIUsage() {
  return useQuery<AIUsageData>({
    queryKey: queryKeys.dailyAiUsage(),
    queryFn: fetchAIUsageAction,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })
}
