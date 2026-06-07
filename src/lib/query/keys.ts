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
  /** Hedef → Yol Haritası → Günlük Takip — tek konsolide sorgu (prefetch'lenir) */
  goalDashboard: () => ['goal-dashboard'] as const,
  dailyTrack: (lang: 'tr' | 'en' = 'tr') => ['daily-track', lang] as const,
  videoCatalog: (workspaceId: string) => ['video-catalog', workspaceId] as const,
  hubWeeklySelf: () => ['hub', 'weekly-self'] as const,
  hubMonthlyInsights: () => ['hub', 'monthly-insights'] as const,
  crownFirst30: (workspaceId: string) => ['crown', 'first30', workspaceId] as const,
  /**
   * Ekip Aktivite Özeti (saha çabası). memberIds İÇERİDE sıralanır → çağıran tarafın
   * sıralama derdi yok, prefetch ↔ client cache anahtarı birebir eşleşir.
   */
  teamFieldActivity: (workspaceId: string, period: string, memberIds: string[]) =>
    ['team-field-activity', workspaceId, period, [...memberIds].sort().join(',')] as const,
  notifications: () => ['notifications'] as const,
  notificationPreferences: () => ['notification-preferences'] as const,
  userSettings: (userId: string) => ['user-settings', userId] as const,
  platformWorkspaces: () => ['platform-workspaces'] as const,
  platformModeration: () => ['platform-moderation'] as const,
}
