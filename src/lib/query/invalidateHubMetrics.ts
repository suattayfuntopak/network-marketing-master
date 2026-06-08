import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'

/** Huni / günlük özet / istatistik önbelleklerini tazele. */
export function invalidateHubMetrics(qc: QueryClient, workspaceId?: string) {
  qc.invalidateQueries({ queryKey: ['hub', 'daily-self'] })
  qc.invalidateQueries({ queryKey: ['hub', 'weekly-self'] })
  qc.invalidateQueries({ queryKey: ['hub', 'monthly-self'] })
  qc.invalidateQueries({ queryKey: ['stats-funnel-actuals'] })
  qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
  qc.invalidateQueries({ queryKey: ['pano-field-insights'] })
  if (workspaceId) {
    qc.invalidateQueries({ queryKey: queryKeys.candidates(workspaceId) })
    qc.invalidateQueries({ queryKey: queryKeys.team(workspaceId) })
  } else {
    qc.invalidateQueries({ queryKey: ['candidates'] })
    qc.invalidateQueries({ queryKey: ['team'] })
  }
}
