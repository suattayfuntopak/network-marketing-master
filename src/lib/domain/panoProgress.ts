import type { DailyProgress } from '@/app/(dashboard)/hedef/actions'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'

const FUNNEL_KEYS: (keyof FunnelCounts)[] = ['arama', 'tanisma', 'sunum', 'yeniUye']

/** Bugün huni adımlarından kaçı hedefe ulaştı (0–4). */
export function countFunnelStepsDone(progress: DailyProgress): number {
  if (!progress.hasGoal) return 0
  return FUNNEL_KEYS.filter(key => {
    const target = progress.targets[key] ?? 0
    const actual = progress.actuals[key] ?? 0
    return target > 0 && actual >= target
  }).length
}

/** Pano kutu rozeti — yalnız yol haritası ve günlük takip için. */
export function getPanoLauncherBadge(
  href: string,
  progress: DailyProgress | null | undefined,
  videoSummary: VideoProgressSummary | null | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | undefined {
  if (href.includes('tab=live') && videoSummary && videoSummary.total > 0) {
    return t('dashboard.panoBadgeVideo', {
      done: videoSummary.completed,
      total: videoSummary.total,
    })
  }
  if (!progress?.hasGoal) return undefined
  if (href.includes('tab=roadmap')) {
    return t('dashboard.panoBadgeRoadmap', {
      current: progress.monthIndex,
      total: progress.totalMonths,
    })
  }
  if (href.includes('tab=daily')) {
    return t('dashboard.panoBadgeFunnel', {
      done: countFunnelStepsDone(progress),
      total: FUNNEL_KEYS.length,
    })
  }
  return undefined
}
