import type { QueryClient } from '@tanstack/react-query'
import { queryInvalidator } from './invalidator'

/** After AI usage or team-impacting mutations — keep stats and quota in sync. */
export function invalidateTeamAndAIUsage(
  qc: QueryClient,
  workspaceId?: string | null
) {
  queryInvalidator.invalidateAIUsage(qc)
  queryInvalidator.invalidateTeam(qc, workspaceId)
}
