'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bell, CalendarCheck2, CalendarClock, Target, UserMinus, ChevronRight, ChevronDown, Flame } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useActivityStreak } from '@/hooks/useActivityStreak'
import { buildDailyPriorities } from '@/lib/domain/dailyPriorities'
import { calendarFollowUpKey } from '@/lib/domain/calendarFollowUp'
import { todayCalendarKey, keysForDaysAfter } from '@/lib/utils/calendarDates'
import { queryKeys } from '@/lib/query/keys'
import { getCrownSahaRadarAction } from '@/app/(dashboard)/saha-radar/actions'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { Skeleton } from '@/components/ui/Skeleton'

type BriefRow = 'followups' | 'team' | 'tempo'

/** Akşam (18:00+) → "Günün Kapanışı": yarının takipleri + bugünün yaptıkları. */
const EVENING_HOUR = 18

/**
 * Sabah Brief'i — Pano'nun günlük çapası. "Ne yapacağım?" sürtünmesini sıfırlar:
 * bugünün takipleri + sessizleşen ekip üyesi + günün temposu, tek kart. Akşam
 * "Günün Kapanışı"na döner (yarını hazırlar). Üstte ardışık-gün serisi (streak) çipi.
 *
 * Veri tamamen önbellekten gelir (candidates + goal + streak Pano'da prefetch'lidir);
 * ekip-sessizliği yalnız ekip erişimi olan kullanıcıda, bloklamadan yüklenir.
 */
export function MorningBrief({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: ws } = useWorkspace()
  const workspaceId = ws?.workspaceId
  const { candidates, isLoading: cLoading } = useCandidates(workspaceId)
  const { progress } = useUserGoal()
  const { hasTeamFullAccess } = useFeatureAccess()
  const { data: streak } = useActivityStreak()

  const isEvening = new Date().getHours() >= EVENING_HOUR

  // Perf (#6): ekip-sessizliği yalnız kart açıkken çekilir — varsayılan kapalı
  // Brief'te gereksiz round-trip olmaz; açınca yüklenir ve saha-radar cache'ini ısıtır.
  const radar = useQuery({
    queryKey: workspaceId ? queryKeys.crownSahaRadar(workspaceId) : ['crown', 'saha-radar', 'none'],
    queryFn: () => getCrownSahaRadarAction(workspaceId as string),
    enabled: !!workspaceId && hasTeamFullAccess && open,
    staleTime: 5 * 60_000,
  })

  const due = useMemo(() => buildDailyPriorities(candidates).all, [candidates])
  const dueNames = due.slice(0, 3).map(c => c.full_name).filter(Boolean).join(', ')

  const tomorrowKey = useMemo(() => keysForDaysAfter(todayCalendarKey(), 1)[0], [])
  const tomorrowCount = useMemo(
    () => candidates.filter(c => calendarFollowUpKey(c) === tomorrowKey).length,
    [candidates, tomorrowKey],
  )

  const silent = useMemo(
    () =>
      (radar.data?.members ?? [])
        .filter(m => m.activityLevel === 'silent')
        .sort((a, b) => (b.daysSinceActivity ?? 0) - (a.daysSinceActivity ?? 0)),
    [radar.data],
  )
  const firstSilent = silent[0]

  const hasGoal = progress?.hasGoal ?? false
  const aramaLeft = Math.max(0, (progress?.targets.arama ?? 0) - (progress?.actuals.arama ?? 0))
  const sunumLeft = Math.max(0, (progress?.targets.sunum ?? 0) - (progress?.actuals.sunum ?? 0))
  const aramaDone = progress?.actuals.arama ?? 0
  const sunumDone = progress?.actuals.sunum ?? 0
  const tempoDone = hasGoal && aramaLeft === 0 && sunumLeft === 0

  const streakCount = streak?.current ?? 0

  const viewLogged = useRef(false)
  useEffect(() => {
    if (viewLogged.current || !workspaceId) return
    viewLogged.current = true
    void logProductEventAction(PRODUCT_EVENTS.morningBriefView, {
      phase: isEvening ? 'evening' : 'morning',
    })
  }, [workspaceId, isEvening])

  if (!workspaceId) return null

  function go(row: BriefRow, href: string) {
    void logProductEventAction(PRODUCT_EVENTS.morningBriefActionClick, { row })
    router.push(href)
  }

  const rowClass =
    'flex w-full items-center gap-3 py-2.5 text-left transition hover:opacity-80 active:scale-[0.99]'
  const iconWrap = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'

  return (
    <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 pb-0.5 pt-0.5"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base">{isEvening ? '🌙' : '☀️'}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
            {isEvening ? t('dashboard.briefEveningTitle') : t('dashboard.briefTitle')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {streakCount >= 1 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-500">
              <Flame className="h-3.5 w-3.5" />
              {t('dashboard.briefStreak', { count: streakCount })}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
      <div className="divide-y divide-[var(--border)]">
        {/* Takipler — sabah: bugün; akşam: yarın */}
        <button
          type="button"
          className={rowClass}
          onClick={() => go('followups', isEvening ? '/takvim' : '/saha-radar')}
        >
          <span className={`${iconWrap} bg-amber-500/10 text-amber-500`}>
            {isEvening ? <CalendarClock className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            {cLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : isEvening ? (
              <span className="block text-sm font-medium text-[var(--text-2)]">
                {tomorrowCount > 0
                  ? t('dashboard.briefTomorrowFollowups', { count: tomorrowCount })
                  : t('dashboard.briefTomorrowNone')}
              </span>
            ) : due.length > 0 ? (
              <>
                <span className="block text-sm font-semibold text-[var(--text-1)]">
                  {t('dashboard.briefFollowupsDue', { count: due.length })}
                </span>
                {dueNames && (
                  <span className="block truncate text-xs text-[var(--text-3)]">{dueNames}</span>
                )}
              </>
            ) : (
              <span className="block text-sm font-medium text-[var(--text-2)]">
                {t('dashboard.briefFollowupsNone')}
              </span>
            )}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
        </button>

        {/* Sessizleşen ekip üyesi (yalnız ekip erişimi + gerçekten sessiz varsa) */}
        {firstSilent && (
          <button type="button" className={rowClass} onClick={() => go('team', '/saha-radar')}>
            <span className={`${iconWrap} bg-rose-500/10 text-rose-500`}>
              <UserMinus className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--text-1)]">
                {t('dashboard.briefTeamSilent', {
                  name: firstSilent.fullName,
                  days: firstSilent.daysSinceActivity ?? 0,
                })}
              </span>
              {silent.length > 1 && (
                <span className="block text-xs text-[var(--text-3)]">
                  {t('dashboard.briefTeamSilentMore', { count: silent.length - 1 })}
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
          </button>
        )}

        {/* Günün temposu — sabah: kalan hedef; akşam: bugün yapılanlar */}
        <button type="button" className={rowClass} onClick={() => go('tempo', '/hedefim')}>
          <span className={`${iconWrap} bg-indigo-500/10 text-indigo-500`}>
            {hasGoal && tempoDone ? (
              <CalendarCheck2 className="h-4 w-4" />
            ) : (
              <Target className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            {!hasGoal ? (
              <span className="block text-sm font-medium text-[var(--text-2)]">
                {t('dashboard.briefSetGoal')}
              </span>
            ) : tempoDone ? (
              <span className="block text-sm font-semibold text-[var(--text-1)]">
                {t('dashboard.briefTempoDone')}
              </span>
            ) : isEvening ? (
              <span className="block text-sm font-semibold text-[var(--text-1)]">
                {t('dashboard.briefTempoEvening', { arama: aramaDone, sunum: sunumDone })}
              </span>
            ) : (
              <span className="block text-sm font-semibold text-[var(--text-1)]">
                {t('dashboard.briefTempo', { arama: aramaLeft, sunum: sunumLeft })}
              </span>
            )}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
        </button>
      </div>
      )}
    </div>
  )
}
