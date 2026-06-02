'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Trophy, MessageCircle, UserPlus, BarChart3 } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import type { TeamMember } from '@/hooks/useTeamMembers'
import type { TeamFieldActivityResult } from '@/app/(dashboard)/istatistikler/teamActivityActions'

type DownlineRow = TeamMember & { full_name: string | null }

type ChartMode = 'call' | 'whatsapp'

interface Props {
  downlines: DownlineRow[]
  activity: TeamFieldActivityResult | undefined
  loading: boolean
  teamStatsLocked: boolean
  getMemberHref: (row: { user_id: string; full_name: string | null; isAppUser?: boolean }) => string | null
  onOpenActivity?: (member: { userId: string; fullName: string | null; pipelineHref: string | null }) => void
}

function medalForRank(rank: number): string | null {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

export function TeamActivitySummary({
  downlines,
  activity,
  loading,
  teamStatsLocked,
  getMemberHref,
  onOpenActivity,
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const [chartMode, setChartMode] = useState<ChartMode>('call')

  const activeCount = useMemo(() => {
    const now = Date.now()
    return downlines.filter(m => {
      if (!m.last_activity_at) return false
      const days = (now - new Date(m.last_activity_at).getTime()) / 86_400_000
      return days < 7
    }).length
  }, [downlines])

  const chartRows = useMemo(() => {
    const key = chartMode === 'call' ? 'calls' : 'whatsapps'
    return downlines
      .map(m => ({
        userId: m.user_id,
        name: m.full_name ?? t('statsPage.unnamedMember'),
        value: activity?.byUser[m.user_id]?.[key] ?? 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [downlines, activity, chartMode, t])

  const maxBar = Math.max(...chartRows.map(r => r.value), 1)

  const rankingRows = useMemo(() => {
    return downlines
      .map(m => {
        const a = activity?.byUser[m.user_id]
        return {
          userId: m.user_id,
          name: m.full_name ?? t('statsPage.unnamedMember'),
          calls: a?.calls ?? 0,
          whatsapps: a?.whatsapps ?? 0,
          newCandidates: a?.newCandidates ?? 0,
          activeDays: a?.activeDays ?? 0,
          href: getMemberHref({ ...m, isAppUser: true }),
        }
      })
      .sort((a, b) => b.calls - a.calls || b.whatsapps - a.whatsapps)
  }, [downlines, activity, getMemberHref, t])

  if (teamStatsLocked) return null

  if (!loading && downlines.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('statsPage.teamActivityTitle')}</h2>
        <p className="text-sm text-[var(--text-3)] italic">{t('pulse.teamEmpty')}</p>
        <Link
          href="/ekip"
          className="inline-flex text-sm font-semibold text-brand hover:underline"
        >
          {t('pulse.teamEmptyCta')}
        </Link>
      </section>
    )
  }

  const totals = activity?.totals ?? { calls: 0, whatsapps: 0, newCandidates: 0 }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('statsPage.teamActivityTitle')}</h2>
        <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
          {t('statsPage.teamActivitySubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              value={downlines.length}
              label={t('statsPage.kpiTeamMembers')}
              borderClass="border-brand/25"
              valueClass="text-brand"
            />
            <KpiCard
              value={activeCount}
              label={t('statsPage.kpiActivePartners')}
              borderClass="border-emerald-500/25"
              valueClass="text-emerald-600 dark:text-emerald-400"
            />
            <KpiCard
              value={totals.calls}
              label={t('statsPage.kpiTotalCalls')}
              borderClass="border-blue-500/25"
              valueClass="text-blue-600 dark:text-blue-400"
            />
            <KpiCard
              value={totals.whatsapps}
              label={t('statsPage.kpiTotalWhatsApp')}
              borderClass="border-[#25D366]/30"
              valueClass="text-[#128C7E] dark:text-[#25D366]"
            />
          </div>

          <p className="text-xs text-[var(--text-3)] italic">{t('statsPage.teamActivityFootnote')}</p>

          <div className="space-y-3 rounded-xl border border-[var(--border)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
                <Phone className="h-4 w-4 text-blue-600" />
                {t('statsPage.teamCallsChartTitle')}
              </h3>
              <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChartMode('call')}
                  className={`rounded-md px-2.5 py-1 transition ${chartMode === 'call' ? 'bg-brand text-white' : 'text-[var(--text-3)]'}`}
                >
                  {t('pulse.calls')}
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('whatsapp')}
                  className={`rounded-md px-2.5 py-1 transition ${chartMode === 'whatsapp' ? 'bg-[#128C7E] text-white' : 'text-[var(--text-3)]'}`}
                >
                  WhatsApp
                </button>
              </div>
            </div>

            {chartRows.every(r => r.value === 0) ? (
              <p className="py-6 text-center text-sm text-[var(--text-3)] italic">
                {t('statsPage.teamCallsChartEmpty')}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {chartRows.map(row => (
                  <li key={row.userId} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 truncate font-medium text-[var(--text-1)]" title={row.name}>
                      {row.name}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                        <div
                          className={`h-full rounded-full transition-all ${chartMode === 'call' ? 'bg-blue-600' : 'bg-[#25D366]'}`}
                          style={{ width: `${Math.max((row.value / maxBar) * 100, row.value > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right font-bold tabular-nums text-[var(--text-1)]">
                        {row.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-[var(--border)] p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
              <Trophy className="h-4 w-4 text-amber-500" />
              {t('statsPage.teamRankingTitle')}
            </h3>
            <div className="overflow-x-auto scrollbar-none" data-no-swipe="true" onTouchStart={e => e.stopPropagation()}>
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                    <th className="pb-2 pr-2">#</th>
                    <th className="pb-2 pr-2">{t('statsPage.colPartnerName')}</th>
                    <th className="pb-2 px-2 text-center">
                      <Phone className="mx-auto h-3.5 w-3.5" aria-hidden />
                    </th>
                    <th className="pb-2 px-2 text-center">
                      <WhatsAppIcon className="mx-auto h-3.5 w-3.5" aria-hidden />
                    </th>
                    <th className="pb-2 px-2 text-center">
                      <UserPlus className="mx-auto h-3.5 w-3.5" aria-hidden />
                    </th>
                    <th className="pb-2 pl-2 text-center">
                      <MessageCircle className="mx-auto h-3.5 w-3.5" aria-hidden />
                    </th>
                    {onOpenActivity && (
                      <th className="pb-2 pl-2 text-center w-10" aria-label={t('team.activityBtn')} />
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rankingRows.map((row, idx) => (
                    <tr
                      key={row.userId}
                      onClick={row.href ? () => router.push(row.href!) : undefined}
                      className={row.href ? 'cursor-pointer hover:bg-[var(--bg-subtle)]/75' : ''}
                    >
                      <td className="py-2.5 pr-2 tabular-nums text-[var(--text-3)]">
                        {medalForRank(idx) ?? idx + 1}
                      </td>
                      <td className="py-2.5 pr-2 font-medium text-[var(--text-1)] truncate max-w-[140px]">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold tabular-nums">{row.calls}</td>
                      <td className="py-2.5 px-2 text-center font-bold tabular-nums">{row.whatsapps}</td>
                      <td className="py-2.5 px-2 text-center font-bold tabular-nums">{row.newCandidates}</td>
                      <td className="py-2.5 pl-2 text-center font-bold tabular-nums text-[var(--text-2)]">
                        {row.activeDays}{t('statsPage.activeDaysSuffix')}
                      </td>
                      {onOpenActivity && (
                        <td className="py-2.5 pl-2 text-center">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              onOpenActivity({
                                userId: row.userId,
                                fullName: row.name,
                                pipelineHref: row.href,
                              })
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand/25 bg-brand/5 text-brand hover:bg-brand/10 transition cursor-pointer"
                            title={t('team.activityBtn')}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function KpiCard({
  value,
  label,
  borderClass,
  valueClass,
}: {
  value: number
  label: string
  borderClass: string
  valueClass: string
}) {
  return (
    <div className={`rounded-xl border-t-4 ${borderClass} border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm`}>
      <p className={`text-3xl font-black tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">{label}</p>
    </div>
  )
}
