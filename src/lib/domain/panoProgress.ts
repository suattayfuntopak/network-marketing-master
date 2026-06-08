import type { DailyProgress } from '@/app/(dashboard)/hedef/actions'
import type { HubMonthlyInsights, HubWeeklySelfPayload } from '@/app/(dashboard)/crown/actions'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'

const FUNNEL_KEYS: (keyof FunnelCounts)[] = ['arama', 'tanisma', 'sunum', 'yeniUye']

export type PanoBadgeContext = {
  progress?: DailyProgress | null
  videoSummary?: VideoProgressSummary | null
  weekly?: HubWeeklySelfPayload | null
  monthly?: HubMonthlyInsights | null
  sahaRadarBadgeCount?: number | null
}

/** Huni adımlarından kaçı hedefe ulaştı (0–4). */
export function countFunnelStepsDone(progress: DailyProgress): number {
  if (!progress.hasGoal) return 0
  return countFunnelStepsMatching(progress.targets, progress.actuals)
}

export function countFunnelStepsMatching(
  targets: FunnelCounts,
  actuals: FunnelCounts,
): number {
  return FUNNEL_KEYS.filter(key => {
    const target = targets[key] ?? 0
    const actual = actuals[key] ?? 0
    return target > 0 && actual >= target
  }).length
}

/** Pano kutu rozeti — yol haritası, günlük, haftalık, aylık, ilk 30, canlı eğitim. */
export function getPanoLauncherBadge(
  href: string,
  ctx: PanoBadgeContext,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | undefined {
  const { progress, videoSummary, weekly, monthly, sahaRadarBadgeCount } = ctx

  if (href.includes('/canli-egitim') && videoSummary && videoSummary.total > 0) {
    return t('dashboard.panoBadgeVideo', {
      done: videoSummary.completed,
      total: videoSummary.total,
    })
  }

  if (href.includes('/haftalik-ozet') && weekly) {
    if (weekly.hasGoal) {
      const done = countFunnelStepsMatching(weekly.weeklyTargets, weekly.weeklyActuals)
      if (done > 0 || weekly.weeklyTargets.arama > 0) {
        return t('dashboard.panoBadgeFunnel', { done, total: FUNNEL_KEYS.length })
      }
    } else if (weekly.pctOverall > 0) {
      return t('dashboard.panoBadgeWeeklyPct', { pct: weekly.pctOverall })
    }
  }

  if (href.includes('/aylik-ozet') && monthly) {
    return t('dashboard.panoBadgeMonth', {
      day: monthly.dayOfMonth,
      total: monthly.daysInMonth,
    })
  }

  if (href.includes('/saha-radar') && sahaRadarBadgeCount != null && sahaRadarBadgeCount > 0) {
    return t('dashboard.panoBadgeSahaRadar', { count: sahaRadarBadgeCount })
  }

  if (!progress?.hasGoal) return undefined

  if (href.includes('/hedefim')) {
    return t('dashboard.panoBadgeRoadmap', {
      current: progress.monthIndex,
      total: progress.totalMonths,
    })
  }

  if (href.includes('/bugunku-takibim')) {
    return t('dashboard.panoBadgeFunnel', {
      done: countFunnelStepsDone(progress),
      total: FUNNEL_KEYS.length,
    })
  }

  return undefined
}
