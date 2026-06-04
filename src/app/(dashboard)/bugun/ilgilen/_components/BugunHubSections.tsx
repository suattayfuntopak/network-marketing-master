'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { useTranslation } from '@/providers/LanguageProvider'
import { ACTIVE_STAGES, STAGE_COLOR } from '@/lib/domain/stages'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { HedefKart } from '@/app/(dashboard)/pano/_components/HedefKart'
import { PanoWeeklyLite } from '@/app/(dashboard)/pano/_components/PanoWeeklyLite'
import { PanoInviteChip } from '@/app/(dashboard)/pano/_components/PanoInviteChip'
import { PanoTeamCoachingAlert } from '@/app/(dashboard)/pano/_components/PanoTeamCoachingAlert'
import { PanoVideoStrip } from '@/app/(dashboard)/pano/_components/PanoVideoStrip'
import { FieldWeekSummary } from '@/app/(dashboard)/_components/pulse/FieldWeekSummary'
import { TodayRitualSection } from './TodayRitualSection'

const PRIORITY_PREVIEW = 3
const EARLY_PHASE_CANDIDATE_MAX = 10

/** Pano kokpitinden taşınan modüller (grid hariç). */
export function BugunHubSections({ showFieldWeek = false }: { showFieldWeek?: boolean }) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining } = useDailyActions(candidates)

  function daysAgoLabel(days: number): string {
    if (!isFinite(days)) return t('common.noContact')
    if (days < 1) return t('common.today')
    if (days < 2) return t('common.yesterday')
    return t('common.daysAgo', { days: Math.floor(days) })
  }

  const activeCount = candidates.filter(c => ACTIVE_STAGES.includes(c.stage)).length
  const joinedCount = candidates.filter(c => c.stage === 'katildi').length
  const isEarlyPhase = candidates.length < EARLY_PHASE_CANDIDATE_MAX

  const statsSkeleton = (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-subtle)] md:h-20" />
      ))}
    </div>
  )

  const prioritiesSkeleton = (
    <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  )

  return (
    <div className="space-y-5">
      {showFieldWeek && <FieldWeekSummary />}

      <HedefKart />
      <PanoWeeklyLite />

      {cLoading ? prioritiesSkeleton : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
              {t('dashboard.todayPriorities')}
            </p>
            {(daily.length > PRIORITY_PREVIEW || remaining > 0) && (
              <span className="text-xs text-[var(--text-3)]">
                {t('dashboard.remainingPeople', { count: daily.length + remaining })}
              </span>
            )}
          </div>

          {daily.length === 0 ? (
            <p className="py-5 text-center text-sm text-[var(--text-3)]">
              {t('dashboard.noPendingActions')}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {daily.slice(0, PRIORITY_PREVIEW).map(c => (
                <li key={c.id}>
                  <Link
                    href={`/pipeline/${c.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[var(--bg-subtle)]"
                  >
                    <PersonAvatar
                      name={c.full_name}
                      imageUrl={resolveCandidateFields(c).avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                      <p className="text-xs text-[var(--text-3)]">{daysAgoLabel(c.daysSinceContact)}</p>
                    </div>
                    <span
                      className={clsx(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        STAGE_COLOR[c.stage],
                      )}
                    >
                      {t(`stages.${c.stage}`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <TodayRitualSection />

      {ws && <PanoInviteChip inviteCode={ws.inviteCode} show={isEarlyPhase} />}

      {cLoading ? statsSkeleton : (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-2 py-4 text-center">
            <p className="text-xl font-bold text-[var(--text-1)] md:text-2xl">{candidates.length}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--text-3)] md:text-xs">{t('dashboard.totalPeople')}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-2 py-4 text-center">
            <p className="text-xl font-bold text-[#534AB7] dark:text-[var(--text-1)] md:text-2xl">{activeCount}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--text-3)] md:text-xs">{t('dashboard.activeCandidates')}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-2 py-4 text-center">
            <p className="text-xl font-bold text-[#0F6E56] md:text-2xl">{joinedCount}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--text-3)] md:text-xs">{t('dashboard.joined')}</p>
          </div>
        </div>
      )}

      <PanoTeamCoachingAlert />
      <PanoVideoStrip />
    </div>
  )
}
