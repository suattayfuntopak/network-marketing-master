'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Trophy, UserPlus, ChevronRight } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubKpiRow } from '@/components/hub/HubKpiRow'
import { Skeleton } from '@/components/ui/Skeleton'
import type { TeamFieldActivityResult } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import type { PulsePeriod } from '@/lib/domain/pulse'

type DownlineRow = {
  user_id: string
  full_name: string | null
  last_activity_at: string | null
}

type ChartMode = 'call' | 'whatsapp'

type HubPeriodTeamPanelProps = {
  downlines: DownlineRow[]
  activity: TeamFieldActivityResult | undefined
  loading: boolean
  teamStatsLocked: boolean
  joinedInPeriod: number
  period: PulsePeriod
  getMemberHref: (row: { user_id: string; full_name: string | null }) => string | null
}

function medalForRank(rank: number): string | null {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

export function HubPeriodTeamPanel({
  downlines,
  activity,
  loading,
  teamStatsLocked,
  joinedInPeriod,
  period,
  getMemberHref,
}: HubPeriodTeamPanelProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [chartMode, setChartMode] = useState<ChartMode>('call')
  const [now] = useState(() => Date.now())

  const activeCount = useMemo(() => {
    return downlines.filter(m => {
      if (!m.last_activity_at) return false
      return (now - new Date(m.last_activity_at).getTime()) / 86_400_000 < 7
    }).length
  }, [downlines, now])

  const chartRows = useMemo(() => {
    const key = chartMode === 'call' ? 'calls' : 'whatsapps'
    return downlines
      .map(m => ({
        userId: m.user_id,
        name: m.full_name ?? t('statsPage.unnamedMember'),
        value: activity?.byUser[m.user_id]?.[key] ?? 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
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
          href: getMemberHref(m),
        }
      })
      .sort((a, b) => b.calls - a.calls || b.whatsapps - a.whatsapps)
      .slice(0, 6)
  }, [downlines, activity, getMemberHref, t])

  if (teamStatsLocked) return null

  if (!loading && downlines.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('crown.teamSummary')}</h2>
        <p className="mt-2 text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
        <Link href="/ekip" className="mt-3 inline-flex text-sm font-semibold text-brand hover:underline">
          {t('pulse.teamEmptyCta')}
        </Link>
      </section>
    )
  }

  const totals = activity?.totals ?? { calls: 0, whatsapps: 0, newCandidates: 0 }
  const callsChartTitle =
    period === 'today'
      ? t('crown.callsByPersonDay')
      : period === '7d'
        ? t('crown.callsByPerson')
        : period === '30d'
          ? t('crown.callsByPersonMonth')
          : t('crown.callsByPersonYear')

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
      <div>
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('crown.teamSummary')}</h2>
        <p className="mt-0.5 text-xs text-[var(--text-3)]">{t('crown.hubTeamSubtitle')}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <>
          <HubKpiRow
            items={[
              {
                label: t('crown.teamMembers'),
                value: downlines.length,
                valueClass: 'text-brand',
                borderClass: 'border-t-4 border-brand/30',
              },
              {
                label: t('crown.activePeople'),
                value: activeCount,
                valueClass: 'text-emerald-600 dark:text-emerald-400',
                borderClass: 'border-t-4 border-emerald-500/30',
              },
              {
                label: t('crown.totalCalls'),
                value: totals.calls,
                valueClass: 'text-blue-600 dark:text-blue-400',
                borderClass: 'border-t-4 border-blue-500/30',
              },
              {
                label: t('crown.totalMembers'),
                value: joinedInPeriod,
                valueClass: 'text-amber-600 dark:text-amber-400',
                borderClass: 'border-t-4 border-amber-500/30',
              },
            ]}
          />

          {rankingRows.length > 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
                <Trophy className="h-4 w-4 text-amber-500" />
                {t('crown.ranking')}
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {rankingRows.map((row, idx) => (
                  <li
                    key={row.userId}
                    className={
                      idx === 0
                        ? 'rounded-lg bg-amber-50/80 dark:bg-amber-950/20'
                        : idx === 2
                          ? 'rounded-lg bg-sky-50/80 dark:bg-sky-950/20'
                          : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => row.href && router.push(row.href)}
                      disabled={!row.href}
                      className="flex w-full items-center gap-2 px-1 py-2.5 text-left text-sm disabled:cursor-default"
                    >
                      <span className="w-6 shrink-0 tabular-nums text-[var(--text-3)]">
                        {medalForRank(idx) ?? idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-1)]">{row.name}</span>
                      <span className="inline-flex items-center gap-0.5 tabular-nums text-[var(--text-2)]">
                        <Phone className="h-3 w-3" aria-hidden />
                        {row.calls}
                      </span>
                      <span className="inline-flex items-center gap-0.5 tabular-nums text-[var(--text-2)]">
                        <WhatsAppIcon className="h-3 w-3" aria-hidden />
                        {row.whatsapps}
                      </span>
                      <span className="inline-flex items-center gap-0.5 tabular-nums text-[var(--text-2)]">
                        <UserPlus className="h-3 w-3" aria-hidden />
                        {row.newCandidates}
                      </span>
                      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-[var(--text-3)]">
                        {row.activeDays}g
                      </span>
                      {row.href ? <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3 rounded-xl border border-[var(--border)] p-3 md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                <span aria-hidden>📞 </span>
                {callsChartTitle}
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
              <p className="py-4 text-center text-sm text-[var(--text-3)]">{t('statsPage.teamCallsChartEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {chartRows.map(row => (
                  <li key={row.userId} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 truncate font-medium text-[var(--text-1)] md:w-28" title={row.name}>
                      {row.name}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                        <div
                          className={`h-full rounded-full ${chartMode === 'call' ? 'bg-blue-600' : 'bg-whatsapp'}`}
                          style={{ width: `${Math.max((row.value / maxBar) * 100, row.value > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right font-bold tabular-nums">{row.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
