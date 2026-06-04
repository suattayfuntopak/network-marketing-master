'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { OnboardingModal } from './OnboardingModal'
import { HedefKart } from './HedefKart'
import { WelcomeCard } from './WelcomeCard'
import { PanoTodayCta } from './PanoTodayCta'
import { PanoInviteChip } from './PanoInviteChip'
import { useTranslation } from '@/providers/LanguageProvider'
import { ACTIVE_STAGES, STAGE_COLOR } from '@/lib/domain/stages'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { AccountStatusAlert } from './AccountStatusAlert'
import { PanoVideoStrip } from './PanoVideoStrip'
import { PanoTeamCoachingAlert } from './PanoTeamCoachingAlert'
import { FieldWeekSummary } from '@/app/(dashboard)/_components/pulse/FieldWeekSummary'

const PRIORITY_PREVIEW = 3
const EARLY_PHASE_CANDIDATE_MAX = 10

export function PanoContent() {
  const { t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
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

  const hour = new Date().getHours()
  const greeting = hour < 5
    ? t('dashboard.greetingNight')
    : hour < 12
      ? t('dashboard.greetingMorning')
      : hour < 14
        ? t('dashboard.greetingAfternoon')
        : hour < 19
          ? t('dashboard.greetingDay')
          : t('dashboard.greetingEvening')

  const greetingIcon = hour < 5 ? '🌙' : hour < 12 ? '🌅' : hour < 14 ? '☀️' : hour < 19 ? '🌤️' : '🌙'
  const firstName = ws?.fullName?.split(' ')[0] ?? ''

  const statsSkeleton = (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      ))}
    </div>
  )

  const prioritiesSkeleton = (
    <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  )

  const mainColumn = (
    <div className="space-y-5 min-w-0">
      {!cLoading && <WelcomeCard candidateCount={candidates.length} />}

      <HedefKart />

      <PanoTodayCta />

      <FieldWeekSummary />

      {cLoading ? prioritiesSkeleton : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
              {t('dashboard.todayPriorities')}
            </p>
            {(daily.length > 0 || remaining > 0) && (
              <Link
                href="/bugun/ilgilen"
                className="text-xs font-medium text-[#534AB7] transition hover:underline"
              >
                {t('dashboard.seeAll')}
              </Link>
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
              {remaining > 0 && (
                <li className="pt-2 text-center text-xs text-[var(--text-3)]">
                  {t('dashboard.remainingPeople', { count: remaining })}
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {cLoading ? statsSkeleton : (
        <div className="grid grid-cols-3 gap-3">
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

      {ws && (
        <PanoInviteChip inviteCode={ws.inviteCode} show={isEarlyPhase} />
      )}

      <PanoTeamCoachingAlert />
    </div>
  )

  const sideColumn = (
    <div className="space-y-4 md:sticky md:top-6 md:self-start">
      <PanoVideoStrip />
    </div>
  )

  return (
    <div className="w-full space-y-5">
      {!cLoading && ws && (
        <OnboardingModal
          workspaceId={ws.workspaceId}
          inviteCode={ws.inviteCode}
          hasCandidatesInitially={candidates.length > 0}
        />
      )}
      <AccountStatusAlert />

      <header>
        {wsLoading ? (
          <div className="h-8 w-56 animate-pulse rounded bg-[var(--bg-subtle)]" />
        ) : (
          <h1 className="text-2xl font-bold text-[var(--text-1)]">
            {greetingIcon} {greeting} {firstName} 👋🏻
          </h1>
        )}
      </header>

      <div className="mx-auto w-full max-w-6xl md:grid md:grid-cols-1 md:gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
        {mainColumn}
        {sideColumn}
      </div>
    </div>
  )
}
