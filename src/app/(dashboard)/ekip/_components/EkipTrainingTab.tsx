'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import type { MemberRow } from '@/lib/team/types'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import { queryKeys } from '@/lib/query/keys'
import { TeamTrainingRankingTable } from './TeamTrainingRankingTable'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

type Props = {
  t: (key: string, vars?: Record<string, string | number>) => string
  members: MemberRow[]
  teamPageUnlocked: boolean
  teamPulseUnlocked: boolean
}

export function EkipTrainingTab({ t, members, teamPageUnlocked, teamPulseUnlocked }: Props) {
  const { data: ws } = useWorkspace()
  const downline = members.filter(m => m.role !== 'leader')
  const stepTotal = ONBOARDING_STEPS.length
  const memberIds = useMemo(() => downline.map(m => m.user_id), [downline])

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: queryKeys.teamProgressMap(ws?.workspaceId ?? '', memberIds),
    queryFn: () => getTeamProgressMapAction(ws!.workspaceId, memberIds),
    enabled: !!ws?.workspaceId && memberIds.length > 0 && teamPulseUnlocked,
    staleTime: 30_000,
  })

  const ranked = useMemo(() => {
    return downline
      .map(m => {
        const done = m.onboarding_steps?.length ?? 0
        const pct = stepTotal > 0 ? Math.round((done / stepTotal) * 100) : 0
        return { member: m, done, pct }
      })
      .sort((a, b) => b.pct - a.pct || b.done - a.done)
  }, [downline, stepTotal])

  return (
    <div className="space-y-5">
      {!teamPageUnlocked && <TeamFreeUpgradeBanner />}

      {downline.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-3)]">
          {t('team.trainingEmpty')}
        </p>
      ) : (
        <>
          {teamPageUnlocked && teamPulseUnlocked && (
            <TeamTrainingRankingTable
              members={downline}
              progressByUserId={progressData?.progressByUserId ?? {}}
              videoByUserId={progressData?.videoByUserId ?? {}}
              loading={progressLoading}
            />
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <h3 className="mb-4 text-sm font-bold text-[var(--text-1)]">
              {t('team.onboardingTrackerTitle')}
            </h3>
            <ul className="space-y-3">
              {ranked.map(({ member: m, done, pct }) => (
                <li key={m.user_id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[var(--text-1)]">
                      {m.full_name ?? '—'}
                    </p>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--text-3)]">
                      {done}/{stepTotal}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        pct >= 100 ? 'bg-emerald-500' : 'bg-[#854F0B]',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
