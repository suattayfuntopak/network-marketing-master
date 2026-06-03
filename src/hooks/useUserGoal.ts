'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserGoalAction,
  saveUserGoalAction,
  getDailyProgressAction,
  getRoadmapAction,
} from '@/app/(dashboard)/hedef/actions'
import { queryKeys } from '@/lib/query/keys'

const STALE = 2 * 60 * 1000

/** Hedef + bugünün ilerlemesi + yol haritası (hepsi self-scoped). */
export function useUserGoal() {
  const qc = useQueryClient()

  const goal = useQuery({
    queryKey: queryKeys.userGoal(),
    queryFn: fetchUserGoalAction,
    staleTime: STALE,
  })

  const progress = useQuery({
    queryKey: queryKeys.dailyProgress(),
    queryFn: getDailyProgressAction,
    staleTime: 60_000,
  })

  const roadmap = useQuery({
    queryKey: queryKeys.roadmap(),
    queryFn: getRoadmapAction,
    staleTime: STALE,
    enabled: !!goal.data,
  })

  const save = useMutation({
    mutationFn: saveUserGoalAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userGoal() })
      qc.invalidateQueries({ queryKey: queryKeys.dailyProgress() })
      qc.invalidateQueries({ queryKey: queryKeys.roadmap() })
    },
  })

  return {
    goal: goal.data ?? null,
    progress: progress.data ?? null,
    roadmap: roadmap.data ?? [],
    isLoading: goal.isLoading,
    saveGoal: save.mutateAsync,
    isSaving: save.isPending,
  }
}
