/** TanStack Query staleTime — ekip/istatistik metrikleri için tek kaynak. */
export const QUERY_STALE = {
  /** Aday, ekip bundle, workspace */
  data: 2 * 60_000,
  /** Hub, ranking, pano metrikleri */
  metrics: 90_000,
  /** Workspace / oturum */
  workspace: 5 * 60_000,
  /** AI kotası, video katalog */
  usage: 90_000,
  /** Akademi okundu/favori — çoklu cihazda pencere odağında tazelenir */
  progress: 60_000,
  /** Ekip aktivite sheet sorguları */
  memberActivity: 15_000,
  /** İstatistikler saha huni bundle */
  funnelBundle: 30_000,
  /** Üye hedefi sorguları (MemberActivitySheet) */
  memberGoal: 30_000,
} as const
