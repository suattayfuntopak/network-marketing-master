'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Crown, Lock, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import type { TeamMember } from '@/hooks/useTeamMembers'

type PerformanceRow = TeamMember & { isAppUser: boolean }

export type PerfLearningMap = Record<string, { trainingPct: number; objectionPct: number }>
export type PerfVideoMap = Record<string, { pct: number }>

interface Props {
  performanceRows: PerformanceRow[]
  getMemberHref: (row: { user_id: string; full_name: string | null; isAppUser?: boolean }) => string | null
  teamStatsLocked: boolean
  loading: boolean
  /** Kişi-bazlı eğitim/itiraz ilerlemesi (genel) — yalnız uygulama kullananlar için. */
  progressByUserId?: PerfLearningMap
  videoByUserId?: PerfVideoMap
}

/** Rakam altında ince ilerleme çubuğu. */
function PctCell({ value, show }: { value: number; show: boolean }) {
  if (!show) return <span className="text-[var(--text-3)]">—</span>
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold tabular-nums">%{value}</span>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

export function TeamPerformanceTable({
  performanceRows,
  getMemberHref,
  teamStatsLocked,
  loading,
  progressByUserId = {},
  videoByUserId = {},
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  // TOPLAM satırı — uygulama kullananların sayısal sütun toplamları + % ortalamaları.
  const appRows = performanceRows.filter(r => r.isAppUser !== false)
  const sum = (sel: (r: PerformanceRow) => number) => appRows.reduce((a, r) => a + (sel(r) || 0), 0)
  const avg = (sel: (r: PerformanceRow) => number) =>
    appRows.length ? Math.round(sum(sel) / appRows.length) : 0
  const totals = {
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

  return (
    <section className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200 overflow-hidden">
      <div>
        <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
          <Users className="h-4 w-4 text-brand" />
          <span>{t('statsPage.teamTitle')}<sup>*</sup></span>
        </h2>
        <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
          {t('statsPage.teamSubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
      ) : performanceRows.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-3)] italic">
          {t('statsPage.teamEmpty')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] no-swipe" data-no-swipe="true" onTouchStart={(e) => e.stopPropagation()}>
          <table className="w-full text-left border-collapse text-sm min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
                <th className="p-3 font-semibold">{t('statsPage.colRole')}</th>
                <th className="p-3 font-semibold text-center">{t('statsPage.colType')}</th>
                <th className="p-3 font-semibold text-center bg-blue-50/20 dark:bg-blue-950/5 text-blue-600 dark:text-blue-400">{t('statsPage.colTotal')}</th>
                <th className="p-3 font-semibold text-center bg-indigo-50/20 dark:bg-indigo-950/5 text-indigo-600 dark:text-indigo-400">{t('statsPage.colNew')}</th>
                <th className="p-3 font-semibold text-center bg-sky-50/20 dark:bg-sky-950/5 text-sky-600 dark:text-sky-400">{t('statsPage.colContact')}</th>
                <th className="p-3 font-semibold text-center bg-red-50/20 dark:bg-red-950/5 text-red-600 dark:text-red-400">{t('statsPage.colInvite')}</th>
                <th className="p-3 font-semibold text-center bg-cyan-50/20 dark:bg-sky-950/5 text-cyan-600 dark:text-cyan-400">{t('statsPage.colPresentation')}</th>
                <th className="p-3 font-semibold text-center bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400">{t('statsPage.colFollowUp')}</th>
                <th className="p-3 font-semibold text-center bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400">{t('statsPage.colJoined')}</th>
                <th className="p-3 font-semibold text-center bg-purple-50/20 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 whitespace-nowrap">
                  {t('statsPage.colDqsg')}<sup>**</sup>
                </th>
                <th className="p-3 font-semibold text-center bg-teal-50/20 dark:bg-teal-950/5 text-teal-700 dark:text-teal-400 whitespace-nowrap">{t('pulse.colTraining')}</th>
                <th className="p-3 font-semibold text-center bg-teal-50/20 dark:bg-teal-950/5 text-teal-700 dark:text-teal-400 whitespace-nowrap">{t('pulse.colObjections')}</th>
                <th className="p-3 font-semibold text-center bg-teal-50/20 dark:bg-teal-950/5 text-teal-700 dark:text-teal-400 whitespace-nowrap">{t('pulse.colVideos')}</th>
                <th className="p-3 font-semibold text-right">{t('statsPage.colLastActive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
              {performanceRows.map(m => {
                const isLeader = m.role === 'leader'
                const isAppUser = m.isAppUser !== false
                const lastActive = m.last_activity_at ? new Date(m.last_activity_at) : null
                const doneCount = m.onboarding_steps?.length ?? 0
                const onboardingPct = isLeader ? 100 : Math.min(100, Math.round((doneCount / 9) * 100))
                const detailHref = getMemberHref(m)
                return (
                  <tr
                    key={m.user_id}
                    onClick={detailHref ? () => router.push(detailHref) : undefined}
                    className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${detailHref ? 'cursor-pointer' : ''} ${isLeader ? 'font-bold bg-amber-50/5 dark:bg-amber-950/5' : ''} ${!isAppUser ? 'opacity-70' : ''}`}
                  >
                    <td className="p-3 flex items-center gap-2 whitespace-nowrap">

                      {m.avatar_url ? (
                        <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
                          <img src={m.avatar_url} alt={m.full_name ?? ''} className="h-full w-full object-cover" />
                          {isLeader && <Crown className="absolute -top-1 -right-1 h-3 w-3 text-[#854F0B] bg-white rounded-full p-[1px]" strokeWidth={2.5} />}
                        </div>
                      ) : isLeader ? (
                        <Crown className="h-4 w-4 text-[#854F0B]" strokeWidth={2.5} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      )}
                      <span>{m.full_name ?? t('statsPage.unnamedMember')}</span>
                    </td>
                    <td className="p-3 text-sm text-[var(--text-2)] font-semibold uppercase">
                      {isLeader ? t('statsPage.roleLeader') : t('statsPage.rolePartner')}
                    </td>
                    <td className="p-3 text-center">
                      {isLeader ? null : isAppUser ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 text-sm font-black text-purple-700 dark:text-purple-400 whitespace-nowrap">
                          💎 {t('statsPage.typeNmm')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 text-sm font-black text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          🤝 {t('statsPage.typeField')}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-black tabular-nums bg-blue-50/10 dark:bg-blue-950/5 text-blue-600 dark:text-blue-400">{isAppUser ? m.candidate_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-indigo-50/10 dark:bg-indigo-950/5 text-indigo-600 dark:text-indigo-400 font-semibold">{isAppUser ? m.yeni_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-sky-50/10 dark:bg-sky-950/5 text-sky-600 dark:text-sky-400 font-semibold">{isAppUser ? m.iletisim_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-red-50/10 dark:bg-red-950/5 text-red-600 dark:text-red-400 font-semibold">{isAppUser ? m.davetli_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-cyan-50/10 dark:bg-sky-950/5 text-cyan-600 dark:text-cyan-400 font-semibold">{isAppUser ? m.sunum_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-amber-50/10 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400 font-semibold">{isAppUser ? m.takip_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-emerald-50/10 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400 font-black">{isAppUser ? m.katildi_count : '—'}</td>
                    <td className="p-3 text-center tabular-nums bg-purple-50/10 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 font-black">{isAppUser ? `%${onboardingPct}` : '—'}</td>
                    <td className="p-3 text-center bg-teal-50/10 dark:bg-teal-950/5"><PctCell value={progressByUserId[m.user_id]?.trainingPct ?? 0} show={isAppUser} /></td>
                    <td className="p-3 text-center bg-teal-50/10 dark:bg-teal-950/5"><PctCell value={progressByUserId[m.user_id]?.objectionPct ?? 0} show={isAppUser} /></td>
                    <td className="p-3 text-center bg-teal-50/10 dark:bg-teal-950/5"><PctCell value={videoByUserId[m.user_id]?.pct ?? 0} show={isAppUser} /></td>
                    <td className="p-3 text-right text-sm text-[var(--text-2)] font-medium truncate">
                      {lastActive ? lastActive.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                )
              })}
              {appRows.length > 0 && (
                <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-subtle)]/60 font-black text-[var(--text-1)]">
                  <td className="p-3 uppercase tracking-wide">{t('statsPage.colTotal')}</td>
                  <td className="p-3" />
                  <td className="p-3" />
                  <td className="p-3 text-center tabular-nums text-blue-600 dark:text-blue-400">{totals.candidate}</td>
                  <td className="p-3 text-center tabular-nums text-indigo-600 dark:text-indigo-400">{totals.yeni}</td>
                  <td className="p-3 text-center tabular-nums text-sky-600 dark:text-sky-400">{totals.iletisim}</td>
                  <td className="p-3 text-center tabular-nums text-red-600 dark:text-red-400">{totals.davetli}</td>
                  <td className="p-3 text-center tabular-nums text-cyan-600 dark:text-cyan-400">{totals.sunum}</td>
                  <td className="p-3 text-center tabular-nums text-amber-600 dark:text-amber-400">{totals.takip}</td>
                  <td className="p-3 text-center tabular-nums text-emerald-700 dark:text-emerald-400">{totals.katildi}</td>
                  <td className="p-3 text-center text-[var(--text-3)]">—</td>
                  <td className="p-3 text-center tabular-nums text-teal-700 dark:text-teal-400">%{totals.trainingAvg}</td>
                  <td className="p-3 text-center tabular-nums text-teal-700 dark:text-teal-400">%{totals.objectionAvg}</td>
                  <td className="p-3 text-center tabular-nums text-teal-700 dark:text-teal-400">%{totals.videoAvg}</td>
                  <td className="p-3 text-right text-[var(--text-3)]">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="space-y-1 pl-1 mt-1 text-xs italic leading-relaxed text-[var(--text-3)] select-none">
        <p>
          * {t('pulse.disclaimer')}{' '}
          <Link href="/kvkk" className="not-italic font-semibold text-brand hover:underline">
            {t('pulse.disclaimerLink')}
          </Link>
        </p>
        <p>** {t('statsPage.dqsgFootnote')}</p>
      </div>

      {teamStatsLocked && performanceRows.length > 0 && (
        <div
          className={`absolute inset-0 ${Z.cardOverlay} flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#534AB7]/25 via-[#7c3aed]/15 to-emerald-500/10 backdrop-blur-xl backdrop-saturate-150 px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
          aria-hidden={false}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-indigo-200 shadow-lg">
            <Lock className="h-6 w-6 text-[#534AB7] dark:text-indigo-200" strokeWidth={1.75} />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-bold text-[var(--text-1)]">{t('statsPage.teamLockedTitle')}</p>
            <p className="text-sm leading-relaxed text-[var(--text-2)]">{t('statsPage.teamLockedDesc')}</p>
          </div>
          <Link
            href="/odeme"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            {t('statsPage.teamLockedCta')}
          </Link>
        </div>
      )}
    </section>
  )
}
