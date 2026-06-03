'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGoalDashboardAction, saveUserGoalAction } from '@/app/(dashboard)/hedef/actions'
import { queryKeys } from '@/lib/query/keys'

/**
 * Hedef + bugünün ilerlemesi + yol haritası — TEK konsolide sorgu. Dashboard
 * layout'ta prefetch edildiği için pano'da anında hazırdır ("sonra dolma" yok).
 */
export function useUserGoal() {
  const qc = useQueryClient()

  const dash = useQuery({
    queryKey: queryKeys.goalDashboard(),
    queryFn: getGoalDashboardAction,
    staleTime: 60_000,
  })

  const save = useMutation({
    mutationFn: saveUserGoalAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    },
  })

  return {
    goal: dash.data?.goal ?? null,
    progress: dash.data?.progress ?? null,
    roadmap: dash.data?.roadmap ?? [],
    isLoading: dash.isLoading,
    saveGoal: save.mutateAsync,
    isSaving: save.isPending,
  }
}
