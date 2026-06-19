/**
 * AI Kullanım Analitiği — anonim, workspace-bazlı AI üretim yoğunluğunu lisans
 * kademesi ve segment (kendi ekip / dış-kayıt) kırılımıyla özetler. SAF fonksiyon
 * (DB'siz, test edilebilir); fiyatlama kararları için ort/medyan/p90 günlük AI üretimi.
 *
 * "Günlük" = pencere içi toplam AI üretimi ÷ pencere gün sayısı (kişi başı oran).
 * İsim/kimlik taşımaz — yalnızca sayısal yoğunluk.
 */

export type AiTier = 'free' | 'basic' | 'plus' | 'pro'
export type AiSegment = 'team' | 'independent'

/** Tek bir workspace'in pencere içi AI üretim özeti. */
export interface AiUsageWorkspaceInput {
  tier: AiTier
  /** Sponsoru yok → dış-kayıt (independent); var → kendi ekip (team). */
  isIndependent: boolean
  /** Pencere içindeki ai_generate aksiyon sayısı. */
  actionCount: number
}

export interface AiUsageGroupStat {
  /** Gruptaki toplam workspace (0 kullananlar dahil — gerçek maliyet ortalaması). */
  workspaceCount: number
  /** En az 1 AI üretimi olan workspace sayısı. */
  activeCount: number
  /** Pencere içi toplam AI üretimi. */
  totalActions: number
  /** Kişi başı günlük AI üretimi — ortalama. */
  avgDailyPerUser: number
  /** Kişi başı günlük AI üretimi — medyan. */
  medianDailyPerUser: number
  /** Kişi başı günlük AI üretimi — p90 (ağır kullanıcı / kuyruk riski). */
  p90DailyPerUser: number
  /** Kişi başı pencere-toplamı AI üretimi — ortalama (maliyet vekili). */
  avgTotalPerUser: number
}

export interface AiUsageAnalytics {
  windowDays: number
  totalWorkspaces: number
  overall: AiUsageGroupStat
  byTier: { tier: AiTier; stat: AiUsageGroupStat }[]
  bySegment: { segment: AiSegment; stat: AiUsageGroupStat }[]
}

const TIER_ORDER: AiTier[] = ['free', 'basic', 'plus', 'pro']

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Sıralı (artan) dizide nearest-rank yüzdelik. Boşsa 0. */
function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length
  if (n === 0) return 0
  if (n === 1) return sortedAsc[0]
  const rank = Math.ceil(p * n)
  const idx = Math.min(n, Math.max(1, rank)) - 1
  return sortedAsc[idx]
}

function median(sortedAsc: number[]): number {
  const n = sortedAsc.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sortedAsc[mid - 1] + sortedAsc[mid]) / 2 : sortedAsc[mid]
}

function computeGroup(actionCounts: number[], windowDays: number): AiUsageGroupStat {
  const safeWindow = windowDays > 0 ? windowDays : 1
  const workspaceCount = actionCounts.length
  const totalActions = actionCounts.reduce((a, b) => a + b, 0)
  const activeCount = actionCounts.filter(c => c > 0).length

  if (workspaceCount === 0) {
    return {
      workspaceCount: 0,
      activeCount: 0,
      totalActions: 0,
      avgDailyPerUser: 0,
      medianDailyPerUser: 0,
      p90DailyPerUser: 0,
      avgTotalPerUser: 0,
    }
  }

  const dailyRates = actionCounts.map(c => c / safeWindow).sort((a, b) => a - b)
  const avgDaily = dailyRates.reduce((a, b) => a + b, 0) / workspaceCount

  return {
    workspaceCount,
    activeCount,
    totalActions,
    avgDailyPerUser: round2(avgDaily),
    medianDailyPerUser: round2(median(dailyRates)),
    p90DailyPerUser: round2(percentile(dailyRates, 0.9)),
    avgTotalPerUser: round2(totalActions / workspaceCount),
  }
}

/**
 * Workspace girdilerinden anonim AI kullanım analitiğini türetir.
 * Gruplar: genel, lisans kademesi başına (yalnız mevcut olanlar), segment başına.
 */
export function aggregateAiUsage(
  rows: AiUsageWorkspaceInput[],
  windowDays: number,
): AiUsageAnalytics {
  const overall = computeGroup(rows.map(r => r.actionCount), windowDays)

  const byTier = TIER_ORDER.map(tier => {
    const counts = rows.filter(r => r.tier === tier).map(r => r.actionCount)
    return { tier, stat: computeGroup(counts, windowDays) }
  }).filter(g => g.stat.workspaceCount > 0)

  const bySegment: { segment: AiSegment; stat: AiUsageGroupStat }[] = (
    ['team', 'independent'] as AiSegment[]
  )
    .map(segment => {
      const counts = rows
        .filter(r => (segment === 'independent' ? r.isIndependent : !r.isIndependent))
        .map(r => r.actionCount)
      return { segment, stat: computeGroup(counts, windowDays) }
    })
    .filter(g => g.stat.workspaceCount > 0)

  return {
    windowDays,
    totalWorkspaces: rows.length,
    overall,
    byTier,
    bySegment,
  }
}
