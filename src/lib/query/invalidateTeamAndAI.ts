import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './keys'

/** After AI usage or team-impacting mutations — keep stats and quota in sync. */
export function invalidateTeamAndAIUsage(
  qc: QueryClient,
  workspaceId?: string | null
) {
  qc.invalidateQueries({ queryKey: queryKeys.dailyAiUsage() })
  if (workspaceId) {
    qc.invalidateQueries({ queryKey: queryKeys.team(workspaceId) })
  } else {
    qc.invalidateQueries({ queryKey: ['team'] })
  }
}
