/** TanStack Query keys for Ekip Nabzı / pulse modules. */
export const pulseQueryKeys = {
  my: (workspaceId: string, period: string) =>
    ['pulse-my', workspaceId, period] as const,
  team: (workspaceId: string, memberKey: string, period: string) =>
    ['pulse-team', workspaceId, memberKey, period] as const,
  insight: (workspaceId: string, scope: string, lang: string) =>
    ['pulse-insight', workspaceId, scope, lang] as const,
}
