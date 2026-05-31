import type { QueryClient } from '@tanstack/react-query'

/** After AI usage or team-impacting mutations — keep stats and quota in sync. */
export function invalidateTeamAndAIUsage(
  qc: QueryClient,
  workspaceId?: string | null
) {
  qc.invalidateQueries({ queryKey: ['daily-ai-usage'] })
  if (workspaceId) {
    qc.invalidateQueries({ queryKey: ['team', workspaceId] })
  } else {
    qc.invalidateQueries({ queryKey: ['team'] })
  }
}
