'use client'

import { useMemo } from 'react'
import { Check, GraduationCap, Trophy } from 'lucide-react'
import { clsx } from 'clsx'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import type { MemberRow } from '@/lib/team/types'
import { HubKpiRow } from '@/lib/ui/hub/HubKpiRow'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

type Props = {
  t: (key: string, vars?: Record<string, string | number>) => string
  lang: string
  members: MemberRow[]
  teamPageUnlocked: boolean
}

function medalForRank(rank: number): string | null {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

function stepLabel(step: (typeof ONBOARDING_STEPS)[number], lang: string): string {
  return lang === 'en' ? step.label_en : step.label_tr
}

export function EkipTrainingTab({ t, lang, members, teamPageUnlocked }: Props) {
  const downline = members.filter(m => m.role !== 'leader')
  const stepTotal = ONBOARDING_STEPS.length

  const ranked = useMemo(() => {
    return downline
      .map(m => {
        const done = m.onboarding_steps?.length ?? 0
        const pct = stepTotal > 0 ? Math.round((done / stepTotal) * 100) : 0
        return { member: m, done, pct }
      })
      .sort((a, b) => b.pct - a.pct || b.done - a.done)
  }, [downline, stepTotal])

  const avgPct = useMemo(() => {
    if (ranked.length === 0) return 0
    return Math.round(ranked.reduce((sum, r) => sum + r.pct, 0) / ranked.length)
  }, [ranked])

  const fullyDone = ranked.filter(r => r.done >= stepTotal).length

  return (
    <div className="space-y-5">
      {!teamPageUnlocked && <TeamFreeUpgradeBanner />}
      <div>
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('team.trainingTitle')}</h2>
        <p className="mt-1 text-sm text-[var(--text-2)]">{t('team.trainingSubtitle')}</p>
      </div>

      {downline.length > 0 && teamPageUnlocked && (
        <HubKpiRow
          items={[
            {
              label: t('team.trainingKpiMembers'),
              value: downline.length,
              valueClass: 'text-brand',
              borderClass: 'border-t-4 border-brand/30',
            },
            {
              label: t('team.trainingKpiAvg'),
              value: `${avgPct}%`,
              valueClass: 'text-[#854F0B]',
              borderClass: 'border-t-4 border-[#854F0B]/30',
            },
            {
              label: t('team.trainingKpiDone'),
              value: fullyDone,
              valueClass: 'text-emerald-600 dark:text-emerald-400',
              borderClass: 'border-t-4 border-emerald-500/30',
            },
          ]}
          columns={3}
        />
      )}

      {downline.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-3)]">
          {t('team.trainingEmpty')}
        </p>
      ) : (
        <>
          {teamPageUnlocked && ranked.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
                <Trophy className="h-4 w-4 text-amber-500" />
                {t('crown.ranking')}
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {ranked.slice(0, 6).map((row, idx) => (
                  <li
                    key={row.member.user_id}
                    className={clsx(
                      'flex items-center gap-2 py-2.5 text-sm',
                      idx === 0 && 'rounded-lg bg-amber-50/80 px-1 dark:bg-amber-950/20',
                      idx === 2 && 'rounded-lg bg-sky-50/80 px-1 dark:bg-sky-950/20',
                    )}
                  >
                    <span className="w-6 shrink-0">{medalForRank(idx) ?? idx + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-1)]">
                      {row.member.full_name ?? '—'}
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--text-3)]">
                      {row.done}/{stepTotal}
                    </span>
                    <span className="w-10 shrink-0 text-right font-bold tabular-nums text-[#854F0B]">
                      {row.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-3">
            {ranked.map(({ member: m, done, pct }) => (
              <li key={m.user_id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[var(--text-1)]">{m.full_name ?? '—'}</p>
                  <span className="shrink-0 text-xs font-semibold text-[var(--text-3)]">{done}/{stepTotal}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                  <div className="h-full rounded-full bg-[#854F0B] transition-all" style={{ width: `${pct}%` }} />
                </div>
                {teamPageUnlocked && (
                  <ul className="mt-3 space-y-1.5">
                    {ONBOARDING_STEPS.slice(0, 3).map(step => {
                      const isDone = m.onboarding_steps?.includes(step.id)
                      return (
                        <li key={step.id} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                          <span
                            className={clsx(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                              isDone ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--border)]',
                            )}
                          >
                            {isDone && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </span>
                          {stepLabel(step, lang)}
                        </li>
                      )
                    })}
                    {ONBOARDING_STEPS.length > 3 && (
                      <li className="flex items-center gap-2 text-[10px] text-[var(--text-3)]">
                        <GraduationCap className="h-3 w-3" />
                        +{ONBOARDING_STEPS.length - 3} …
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
