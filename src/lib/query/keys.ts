/** Persist / prefix invalidation kökleri — parametresiz eşleşme (tüm dönemler/workspace'ler). */
export const queryKeyRoots = {
  hub: 'hub',
  panoFieldInsights: 'pano-field-insights',
  statsFunnelBundle: 'stats-funnel-bundle',
  team: 'team',
  memberGoals: 'member-goals',
} as const

export const queryKeys = {
  workspace: () => ['workspace'] as const,
  candidates: (workspaceId: string) => ['candidates', workspaceId] as const,
  candidateDetail: (workspaceId: string, candidateId: string) =>
    ['candidate', workspaceId, candidateId] as const,
  /** Ekip paneli + istatistik ekip tablosu — tek bundle cache */
  team: (workspaceId: string) => ['team', workspaceId] as const,
  /** @deprecated use team() — invalidation uyumu için alias */
  members: (workspaceId: string) => ['team', workspaceId] as const,
  teamDisabled: () => [queryKeyRoots.team, 'none'] as const,
  dailyAiUsage: () => ['daily-ai-usage'] as const,
  /** Hedef → Yol Haritası — tek konsolide sorgu (prefetch'lenir) */
  goalDashboard: () => ['goal-dashboard'] as const,
  /** Ardışık aktif-gün serisi (Sabah Brief'i streak çipi) */
  activityStreak: () => ['activity-streak'] as const,
  /** Günlük Özet hub — haftalık/aylık ile aynı veri modeli */
  hubDailySelf: (offset = 0) => ['hub', 'daily-self', offset] as const,
  videoCatalog: (workspaceId: string) => ['video-catalog', workspaceId] as const,
  selfUserProgress: () => ['self-user-progress'] as const,
  akademiCustomCounts: (workspaceId: string) => ['akademi-custom-counts', workspaceId] as const,
  hubWeeklySelf: (offset = 0) => ['hub', 'weekly-self', offset] as const,
  hubMonthlySelf: (offset = 0) => ['hub', 'monthly-self', offset] as const,
  hubYearlySelf: (offset = 0) => ['hub', 'yearly-self', offset] as const,
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
  /** Tüm dönemler tek round-trip — Ekibim saha özeti sekmesi */
  teamRankingMetricsBatch: (workspaceId: string, memberIds: string[]) =>
    ['team-ranking-metrics-batch', workspaceId, [...memberIds].sort().join(',')] as const,
  teamProgressMap: (workspaceId: string, memberIds: string[]) =>
    ['team-progress-map', workspaceId, [...memberIds].sort().join(',')] as const,
  /** İstatistikler saha huni bundle — dönem bazlı */
  statsFunnelBundle: (period: string) => [queryKeyRoots.statsFunnelBundle, period] as const,
  /** Ekip aktivite sheet detay sorgusu */
  memberActivity: (workspaceId: string, userId: string, period: string) =>
    ['member-activity', workspaceId, userId, period] as const,
  /** Lider tarafından üye hedefi (sheet düzenleme) */
  memberGoal: (workspaceId: string, userId: string) =>
    ['member-goal', workspaceId, userId] as const,
  /** Üyenin kendi hedef kartı (gömülü sheet) */
  memberUserGoal: (userId: string) => ['member-user-goal', userId] as const,
  /** Ekip paneli hedef haritası */
  memberGoalsMap: (workspaceId: string) => [queryKeyRoots.memberGoals, workspaceId] as const,
  memberGoalsMapDisabled: () => [queryKeyRoots.memberGoals, 'none'] as const,
  notifications: () => ['notifications'] as const,
  notificationPreferences: () => ['notification-preferences'] as const,
  userSettings: (userId: string) => ['user-settings', userId] as const,
  platformWorkspaces: () => ['platform-workspaces'] as const,
  platformModeration: () => ['platform-moderation'] as const,
}
