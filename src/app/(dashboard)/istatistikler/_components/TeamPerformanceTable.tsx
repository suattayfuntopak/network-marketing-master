'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Crown, Lock, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'
import { Z } from '@/lib/ui/zIndex'
import { ONBOARDING_STEP_COUNT } from '@/lib/domain/pulse'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'
import type { TeamMember } from '@/hooks/useTeamMembers'

type PerformanceRow = TeamMember & { isAppUser: boolean }

export type PerfLearningMap = Record<string, { trainingPct: number; objectionPct: number }>
export type PerfVideoMap = Record<string, VideoProgressSummary>

interface Props {
  performanceRows: PerformanceRow[]
  getMemberHref: (row: { user_id: string; full_name: string | null; isAppUser?: boolean }) => string | null
  teamStatsLocked: boolean
  teamPulseLocked?: boolean
  loading: boolean
  progressByUserId?: PerfLearningMap
  videoByUserId?: PerfVideoMap
}

function VideoPctCell({
  summary,
  show,
  pulseLocked,
}: {
  summary: VideoProgressSummary | undefined
  show: boolean
  pulseLocked: boolean
}) {
  const { t } = useTranslation()
  if (!show) return <span className="text-[var(--text-3)]">—</span>
  if (pulseLocked) {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--text-3)]" title={t('pulse.proGateTitle')}>
        <Lock className="h-3 w-3" />
        —
      </span>
    )
  }
  const pct = summary?.pct ?? 0
  return <span className="font-bold tabular-nums">%{pct}</span>
}

function PctCell({ value, show }: { value: number; show: boolean }) {
  if (!show) return <span className="text-[var(--text-3)]">—</span>
  return <span className="font-bold tabular-nums">%{value}</span>
}

/** Dark-theme readable accent text for colored table cells */
const COL = {
  blue: 'text-blue-600 dark:text-blue-300',
  indigo: 'text-indigo-600 dark:text-indigo-300',
  sky: 'text-sky-600 dark:text-sky-300',
  red: 'text-red-600 dark:text-red-300',
  cyan: 'text-cyan-600 dark:text-cyan-300',
  amber: 'text-amber-600 dark:text-amber-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  purple: 'text-purple-700 dark:text-purple-300',
  teal: 'text-teal-700 dark:text-teal-300',
} as const

export function TeamPerformanceTable({
  performanceRows,
  getMemberHref,
  teamStatsLocked,
  teamPulseLocked = false,
  loading,
  progressByUserId = {},
  videoByUserId = {},
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  const displayRows = performanceRows.filter(r => r.role !== 'leader')
  const appRows = displayRows.filter(r => r.isAppUser !== false)

  const totals = useMemo(() => {
    const sum = (sel: (r: PerformanceRow) => number) =>
      appRows.reduce((a, r) => a + (sel(r) || 0), 0)
    const avg = (sel: (r: PerformanceRow) => number) =>
      appRows.length ? Math.round(sum(sel) / appRows.length) : 0

    return {
      candidate: sum(r => r.candidate_count ?? 0),
      yeni: sum(r => r.yeni_count ?? 0),
      iletisim: sum(r => r.iletisim_count ?? 0),
      davetli: sum(r => r.davetli_count ?? 0),
      sunum: sum(r => r.sunum_count ?? 0),
      takip: sum(r => r.takip_count ?? 0),
      katildi: sum(r => r.katildi_count ?? 0),
      trainingAvg: avg(r => progressByUserId[r.user_id]?.trainingPct ?? 0),
      objectionAvg: avg(r => progressByUserId[r.user_id]?.objectionPct ?? 0),
      videoAvg: avg(r => videoByUserId[r.user_id]?.pct ?? 0),
    }
  }, [appRows, progressByUserId, videoByUserId])

  return (
    <section
      id="team-performance"
      className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200 overflow-hidden scroll-mt-6"
    >
      <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
        <Users className="h-4 w-4 text-brand" />
        {t('statsPage.teamTitle')}
      </h2>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
      ) : displayRows.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-3)] italic">
          {t('statsPage.teamEmpty')}
        </div>
      ) : (
        <HorizontalScrollLock className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <table className="w-full text-left border-collapse text-sm min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                <th className="p-3 font-semibold align-middle">{t('statsPage.colPartnerName')}</th>
                <th className="p-3 font-semibold align-middle">{t('statsPage.colRole')}</th>
                <th className="p-3 font-semibold text-center align-middle">{t('statsPage.colType')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-blue-50/20 dark:bg-blue-950/5 ${COL.blue}`}>{t('statsPage.colTotal')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-indigo-50/20 dark:bg-indigo-950/5 ${COL.indigo}`}>{t('statsPage.colNew')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-sky-50/20 dark:bg-sky-950/5 ${COL.sky}`}>{t('statsPage.colContact')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-red-50/20 dark:bg-red-950/5 ${COL.red}`}>{t('statsPage.colInvite')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-cyan-50/20 dark:bg-sky-950/5 ${COL.cyan}`}>{t('statsPage.colPresentation')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-amber-50/20 dark:bg-amber-950/5 ${COL.amber}`}>{t('statsPage.colFollowUp')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-emerald-50/20 dark:bg-emerald-950/5 ${COL.emerald}`}>{t('statsPage.colJoined')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-purple-50/20 dark:bg-purple-950/5 ${COL.purple} whitespace-nowrap`}>
                  {t('statsPage.colDqsg')}
                </th>
                <th className={`p-3 font-semibold text-center align-middle bg-teal-50/20 dark:bg-teal-950/5 ${COL.teal} whitespace-nowrap`}>{t('pulse.colTraining')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-teal-50/20 dark:bg-teal-950/5 ${COL.teal} whitespace-nowrap`}>{t('pulse.colVideos')}</th>
                <th className={`p-3 font-semibold text-center align-middle bg-teal-50/20 dark:bg-teal-950/5 ${COL.teal} whitespace-nowrap`}>{t('pulse.colObjections')}</th>
                <th className="p-3 font-semibold text-right align-middle">{t('statsPage.colLastActive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
              {displayRows.map(m => {
                const isLeader = m.role === 'leader'
                const isAppUser = m.isAppUser !== false
                const lastActive = m.last_activity_at ? new Date(m.last_activity_at) : null
                const doneCount = m.onboarding_steps?.length ?? 0
                const onboardingPct = isLeader ? 100 : Math.min(100, Math.round((doneCount / ONBOARDING_STEP_COUNT) * 100))
                const detailHref = getMemberHref(m)
                return (
                  <tr
                    key={m.user_id}
                    onClick={detailHref ? () => router.push(detailHref) : undefined}
                    className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${detailHref ? 'cursor-pointer' : ''} ${isLeader ? 'font-bold bg-amber-50/5 dark:bg-amber-950/5' : ''} ${!isAppUser ? 'opacity-70' : ''}`}
                  >
                    <td className="p-3 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-2">
                        {m.avatar_url ? (
                          <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
                            <Image src={m.avatar_url} alt={m.full_name ?? ''} width={24} height={24} unoptimized className="h-full w-full object-cover" />
                            {isLeader && <Crown className="absolute -top-1 -right-1 h-3 w-3 text-[#854F0B] bg-white rounded-full p-[1px]" strokeWidth={2.5} />}
                          </div>
                        ) : isLeader ? (
                          <Crown className="h-4 w-4 shrink-0 text-[#854F0B]" strokeWidth={2.5} />
                        ) : (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
                        )}
                        <span className="truncate">{m.full_name ?? t('statsPage.unnamedMember')}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-[var(--text-2)] font-semibold uppercase align-middle">
                      {isLeader ? t('statsPage.roleLeader') : t('statsPage.rolePartner')}
                    </td>
                    <td className="p-3 text-center align-middle">
                      {isLeader ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-sm font-black text-amber-700 dark:text-amber-300 whitespace-nowrap">
                          👑 {t('statsPage.roleLeader')}
                        </span>
                      ) : isAppUser ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 text-sm font-black text-purple-700 dark:text-purple-300 whitespace-nowrap">
                          💎 {t('statsPage.typeNmm')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 text-sm font-black text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                          🤝 {t('statsPage.typeField')}
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-center font-black tabular-nums align-middle bg-blue-50/10 dark:bg-blue-950/5 ${COL.blue}`}>{isAppUser ? m.candidate_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-indigo-50/10 dark:bg-indigo-950/5 ${COL.indigo} font-semibold`}>{isAppUser ? m.yeni_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-sky-50/10 dark:bg-sky-950/5 ${COL.sky} font-semibold`}>{isAppUser ? m.iletisim_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-red-50/10 dark:bg-red-950/5 ${COL.red} font-semibold`}>{isAppUser ? m.davetli_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-cyan-50/10 dark:bg-sky-950/5 ${COL.cyan} font-semibold`}>{isAppUser ? m.sunum_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-amber-50/10 dark:bg-amber-950/5 ${COL.amber} font-semibold`}>{isAppUser ? m.takip_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-emerald-50/10 dark:bg-emerald-950/5 ${COL.emerald} font-black`}>{isAppUser ? m.katildi_count : '—'}</td>
                    <td className={`p-3 text-center tabular-nums align-middle bg-purple-50/10 dark:bg-purple-950/5 ${COL.purple} font-black`}>{isAppUser ? `%${onboardingPct}` : '—'}</td>
                    <td className="p-3 text-center align-middle bg-teal-50/10 dark:bg-teal-950/5">
                      <PctCell value={progressByUserId[m.user_id]?.trainingPct ?? 0} show={isAppUser} />
                    </td>
                    <td className="p-3 text-center align-middle bg-teal-50/10 dark:bg-teal-950/5">
                      <VideoPctCell
                        summary={videoByUserId[m.user_id]}
                        show={isAppUser}
                        pulseLocked={teamPulseLocked}
                      />
                    </td>
                    <td className="p-3 text-center align-middle bg-teal-50/10 dark:bg-teal-950/5">
                      <PctCell value={progressByUserId[m.user_id]?.objectionPct ?? 0} show={isAppUser} />
                    </td>
                    <td className="p-3 text-right text-sm text-[var(--text-2)] font-medium truncate align-middle">
                      {lastActive ? lastActive.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                )
              })}
              {appRows.length > 0 && (
                <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-subtle)]/60 font-black text-[var(--text-1)]">
                  <td className="p-3 uppercase tracking-wide align-middle">{t('statsPage.colTotal')}</td>
                  <td className="p-3 align-middle" />
                  <td className="p-3 align-middle" />
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.blue}`}>{totals.candidate}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.indigo}`}>{totals.yeni}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.sky}`}>{totals.iletisim}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.red}`}>{totals.davetli}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.cyan}`}>{totals.sunum}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.amber}`}>{totals.takip}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.emerald}`}>{totals.katildi}</td>
                  <td className="p-3 text-center text-[var(--text-3)] align-middle">—</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.teal}`}>%{totals.trainingAvg}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.teal}`}>%{totals.videoAvg}</td>
                  <td className={`p-3 text-center tabular-nums align-middle ${COL.teal}`}>%{totals.objectionAvg}</td>
                  <td className="p-3 text-right text-[var(--text-3)] align-middle">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </HorizontalScrollLock>
      )}

      {teamStatsLocked && performanceRows.length > 0 && (
        <div
          className={`absolute inset-0 ${Z.cardOverlay} flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-brand/25 via-[#7c3aed]/15 to-emerald-500/10 backdrop-blur-xl backdrop-saturate-150 px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
          aria-hidden={false}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-indigo-200 shadow-lg">
            <Lock className="h-6 w-6 text-brand" strokeWidth={1.75} />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-bold text-[var(--text-1)]">{t('statsPage.teamLockedTitle')}</p>
            <p className="text-sm leading-relaxed text-[var(--text-2)]">{t('statsPage.teamLockedDesc')}</p>
          </div>
          <Link
            href="/odeme"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-accent px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            {t('statsPage.teamLockedCta')}
          </Link>
        </div>
      )}
    </section>
  )
}
