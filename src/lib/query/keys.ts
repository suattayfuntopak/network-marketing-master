export const queryKeys = {
  workspace: () => ['workspace'] as const,
  candidates: (workspaceId: string) => ['candidates', workspaceId] as const,
  members: (workspaceId: string) => ['members', workspaceId] as const,
  dailyAiUsage: () => ['daily-ai-usage'] as const,
  notifications: () => ['notifications'] as const,
  platformWorkspaces: () => ['platform-workspaces'] as const,
  platformModeration: () => ['platform-moderation'] as const,
}
