export const queryKeys = {
  workspace: () => ['workspace'] as const,
  candidates: (workspaceId: string) => ['candidates', workspaceId] as const,
  candidateDetail: (workspaceId: string, candidateId: string) =>
    ['candidate', workspaceId, candidateId] as const,
  /** Ekip paneli + istatistik ekip tablosu — tek bundle cache */
  team: (workspaceId: string) => ['team', workspaceId] as const,
  /** @deprecated use team() — invalidation uyumu için alias */
  members: (workspaceId: string) => ['team', workspaceId] as const,
  dailyAiUsage: () => ['daily-ai-usage'] as const,
  notifications: () => ['notifications'] as const,
  notificationPreferences: () => ['notification-preferences'] as const,
  platformWorkspaces: () => ['platform-workspaces'] as const,
  platformModeration: () => ['platform-moderation'] as const,
}
