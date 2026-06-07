'use client'

import { Check } from 'lucide-react'
import { clsx } from 'clsx'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import type { MemberRow } from '@/lib/team/types'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

type Props = {
  t: (key: string, vars?: Record<string, string | number>) => string
  lang: string
  members: MemberRow[]
  teamPageUnlocked: boolean
}

export function EkipTrainingTab({ t, lang, members, teamPageUnlocked }: Props) {
  const downline = members.filter(m => m.role !== 'leader')

  return (
    <div className="space-y-5">
      {!teamPageUnlocked && <TeamFreeUpgradeBanner />}
      <div>
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('team.trainingTitle')}</h2>
        <p className="mt-1 text-sm text-[var(--text-2)]">{t('team.trainingSubtitle')}</p>
      </div>

      {downline.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-3)]">
          {t('team.trainingEmpty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {downline.map(m => {
            const done = m.onboarding_steps?.length ?? 0
            const total = ONBOARDING_STEPS.length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <li key={m.user_id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[var(--text-1)]">{m.full_name ?? '—'}</p>
                  <span className="shrink-0 text-xs font-semibold text-[var(--text-3)]">{done}/{total}</span>
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
                          <span className={clsx(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                            isDone ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--border)]',
                          )}>
                            {isDone && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </span>
                          {lang === 'en' ? step.label_en : step.label_tr}
                        </li>
                      )
                    })}
                    {ONBOARDING_STEPS.length > 3 && (
                      <li className="text-[10px] text-[var(--text-3)]">+{ONBOARDING_STEPS.length - 3} …</li>
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
