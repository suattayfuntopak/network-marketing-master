'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Activity, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  computeAttentionFlags,
  ONBOARDING_STEP_COUNT,
} from '@/lib/domain/pulse'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import type { MemberRow } from '@/lib/team/types'
import { PulseDisclaimer } from './PulseDisclaimer'
import { Skeleton } from '@/components/ui/Skeleton'

type Props = {
  members: MemberRow[]
  getMemberHref: (row: {
    user_id: string
    full_name: string | null
    isAppUser?: boolean
  }) => string | null
}

export function PulseTeamSection({ members, getMemberHref }: Props) {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const { data: ws } = useWorkspace()

  const downlineMembers = useMemo(
    () => members.filter(m => m.role !== 'leader'),
    [members]
  )

  const pulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)

  const memberIds = useMemo(
    () => downlineMembers.map(m => m.user_id),
    [downlineMembers]
  )

  const teamPeriod = '30d' as const

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['pulse-team', ws?.workspaceId, memberIds.join(','), teamPeriod],
    queryFn: () => getTeamProgressMapAction(ws!.workspaceId, memberIds, teamPeriod),
    enabled: !!ws?.workspaceId && memberIds.length > 0 && pulseUnlocked,
    staleTime: 30_000,
  })

  if (!ws?.workspaceId) return null

  const showGate = !pulseUnlocked

  return (
    <section className="relative space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 overflow-hidden">
      <header>
        <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand" />
          {t('pulse.teamTitle')}
        </h2>
        <p className="mt-1 text-xs text-[var(--text-3)]">{t('pulse.teamSubtitle')}</p>
      </header>

      {showGate ? (
        <div className="rounded-xl border border-dashed border-brand/30 bg-brand/5 p-6 text-center space-y-3">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-1)]">{t('pulse.proGateTitle')}</h3>
          <p className="text-xs leading-relaxed text-[var(--text-2)] max-w-md mx-auto">
            {t('pulse.proGateDesc')}
          </p>
          <Link
            href="/odeme"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            {t('pulse.proGateCta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : downlineMembers.length === 0 ? (
        <p className="py-6 text-center text-xs italic text-[var(--text-3)]">
          {t('pulse.teamEmpty')}{' '}
          <Link href="/ekip" className="font-semibold not-italic text-brand hover:underline">
            {t('pulse.teamEmptyCta')}
          </Link>
        </p>
      ) : isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          <p className="text-[10px] text-[var(--text-3)]">{t('pulse.teamPeriodNote')}</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]">
                <th className="p-3 font-semibold">{t('pulse.colPartner')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colTraining')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colObjections')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colDqsg')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colVideos')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colPresentations')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colAppointments')}</th>
                <th className="p-3 font-semibold text-right">{t('pulse.colLastActive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {downlineMembers.map(m => {
                const learning = progressData?.progressByUserId[m.user_id]
                const trainingPct = learning?.trainingPct ?? 0
                const objectionPct = learning?.objectionPct ?? 0
                const done = m.onboarding_steps?.length ?? 0
                const dqsgPct = Math.min(
                  100,
                  Math.round((done / ONBOARDING_STEP_COUNT) * 100)
                )
                const flags = computeAttentionFlags({
                  trainingPct,
                  objectionPct,
                  onboardingSteps: m.onboarding_steps ?? [],
                  lastActivityAt: m.last_activity_at,
                  joinedAt: m.joined_at,
                })
                const videoSummary = progressData?.videoByUserId[m.user_id]
                const videoPct = videoSummary?.pct ?? 0
                const engagement = progressData?.engagementByUserId[m.user_id]
                const apptTotal =
                  (engagement?.appointmentsSet ?? 0) + (engagement?.appointmentsDone ?? 0)
                const lastActive = m.last_activity_at
                  ? new Date(m.last_activity_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')
                  : '—'
                const href = getMemberHref({ ...m, isAppUser: true })

                return (
                  <tr
                    key={m.user_id}
                    onClick={href ? () => router.push(href) : undefined}
                    className={href ? 'cursor-pointer hover:bg-[var(--bg-subtle)]/80' : ''}
                  >
                    <td className="p-3">
                      <p className="font-semibold text-[var(--text-1)]">{m.full_name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {flags.includes('inactive') && (
                          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                            {t('pulse.flagInactive')}
                          </span>
                        )}
                        {flags.includes('low_training') && (
                          <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300">
                            {t('pulse.flagLowTraining')}
                          </span>
                        )}
                        {flags.includes('objections_gap') && (
                          <span
                            title={t('pulse.flagObjectionsGapHint')}
                            className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300"
                          >
                            {t('pulse.flagObjectionsGap')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold">{trainingPct}%</td>
                    <td className="p-3 text-center font-bold">{objectionPct}%</td>
                    <td className="p-3 text-center font-bold">{dqsgPct}%</td>
                    <td className="p-3 text-center font-bold">{videoPct}%</td>
                    <td className="p-3 text-center font-bold text-[var(--text-2)]">
                      {engagement?.presentationsSent ?? 0}
                    </td>
                    <td className="p-3 text-center font-bold text-[var(--text-2)]">
                      {apptTotal > 0 ? apptTotal : '—'}
                    </td>
                    <td className="p-3 text-right text-[var(--text-2)]">{lastActive}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <PulseDisclaimer />
    </section>
  )
}
