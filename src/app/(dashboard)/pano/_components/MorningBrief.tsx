'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bell, CalendarCheck2, Target, UserMinus, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { buildDailyPriorities } from '@/lib/domain/dailyPriorities'
import { queryKeys } from '@/lib/query/keys'
import { getCrownSahaRadarAction } from '@/app/(dashboard)/saha-radar/actions'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { Skeleton } from '@/components/ui/Skeleton'

type BriefRow = 'followups' | 'team' | 'tempo'

/**
 * Sabah Brief'i — Pano'nun günlük çapası. "Ne yapacağım?" sürtünmesini sıfırlar:
 * bugünün takipleri + sessizleşen ekip üyesi + günün temposu, tek kart.
 *
 * Veri tamamen önbellekten gelir (candidates + goal Pano'da prefetch'lidir);
 * ekip-sessizliği yalnız ekip erişimi olan kullanıcıda, bloklamadan yüklenir
 * (saha-radar cache'ini de ısıtır). Yeni server action / migration yok.
 */
export function MorningBrief() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: ws } = useWorkspace()
  const workspaceId = ws?.workspaceId
  const { candidates, isLoading: cLoading } = useCandidates(workspaceId)
  const { progress } = useUserGoal()
  const { hasTeamFullAccess } = useFeatureAccess()

  const radar = useQuery({
    queryKey: workspaceId ? queryKeys.crownSahaRadar(workspaceId) : ['crown', 'saha-radar', 'none'],
    queryFn: () => getCrownSahaRadarAction(workspaceId as string),
    enabled: !!workspaceId && hasTeamFullAccess,
    staleTime: 5 * 60_000,
  })

  const due = useMemo(() => buildDailyPriorities(candidates).all, [candidates])
  const dueNames = due.slice(0, 3).map(c => c.full_name).filter(Boolean).join(', ')

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
  const tempoDone = hasGoal && aramaLeft === 0 && sunumLeft === 0

  const viewLogged = useRef(false)
  useEffect(() => {
    if (viewLogged.current || !workspaceId) return
    viewLogged.current = true
    void logProductEventAction(PRODUCT_EVENTS.morningBriefView)
  }, [workspaceId])

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
      <div className="flex items-center gap-1.5 pb-0.5 pt-0.5">
        <span className="text-base">☀️</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
          {t('dashboard.briefTitle')}
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {/* Takipler */}
        <button type="button" className={rowClass} onClick={() => go('followups', '/saha-radar')}>
          <span className={`${iconWrap} bg-amber-500/10 text-amber-500`}>
            <Bell className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            {cLoading ? (
              <Skeleton className="h-4 w-40" />
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

        {/* Günün temposu */}
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
            ) : (
              <span className="block text-sm font-semibold text-[var(--text-1)]">
                {t('dashboard.briefTempo', { arama: aramaLeft, sunum: sunumLeft })}
              </span>
            )}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
        </button>
      </div>
    </div>
  )
}
