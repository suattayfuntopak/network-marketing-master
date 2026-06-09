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
  /** Hedef → Yol Haritası — tek konsolide sorgu (prefetch'lenir) */
  goalDashboard: () => ['goal-dashboard'] as const,
  /** Günlük Özet hub — haftalık/aylık ile aynı veri modeli */
  hubDailySelf: (offset = 0) => ['hub', 'daily-self', offset] as const,
  videoCatalog: (workspaceId: string) => ['video-catalog', workspaceId] as const,
  hubWeeklySelf: (offset = 0) => ['hub', 'weekly-self', offset] as const,
  hubMonthlySelf: (offset = 0) => ['hub', 'monthly-self', offset] as const,
  hubAllTimeSelf: () => ['hub', 'all-time-self'] as const,
  hubMonthlyInsights: (offset = 0) => ['hub', 'monthly-insights', offset] as const,
  crownFirst30: (workspaceId: string) => ['crown', 'first30', workspaceId] as const,
  crownSahaRadar: (workspaceId: string) => ['crown', 'saha-radar', workspaceId] as const,
  memberDetail: (workspaceId: string, userId: string) => ['member-detail', workspaceId, userId] as const,
  /**
   * Ekip Aktivite Özeti (saha çabası). memberIds İÇERİDE sıralanır → çağıran tarafın
   * sıralama derdi yok, prefetch ↔ client cache anahtarı birebir eşleşir.
   */
  teamFieldActivity: (workspaceId: string, period: string, memberIds: string[]) =>
    ['team-field-activity', workspaceId, period, [...memberIds].sort().join(',')] as const,
  teamPeriodPulse: (workspaceId: string, period: string) =>
    ['team-period-pulse', workspaceId, period] as const,
  teamRankingMetrics: (workspaceId: string, period: string, memberIds: string[]) =>
    ['team-ranking-metrics', workspaceId, period, [...memberIds].sort().join(',')] as const,
  teamProgressMap: (workspaceId: string, memberIds: string[]) =>
    ['team-progress-map', workspaceId, [...memberIds].sort().join(',')] as const,
  notifications: () => ['notifications'] as const,
  notificationPreferences: () => ['notification-preferences'] as const,
  userSettings: (userId: string) => ['user-settings', userId] as const,
  platformWorkspaces: () => ['platform-workspaces'] as const,
  platformModeration: () => ['platform-moderation'] as const,
}
