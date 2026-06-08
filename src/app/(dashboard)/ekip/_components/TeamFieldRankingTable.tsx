'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Pencil,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { clsx } from 'clsx'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  FUNNEL_METRIC_ORDER,
  FUNNEL_METRIC_VISUAL,
  type FunnelMetricKey,
} from '@/lib/ui/funnelMetricVisuals'
import { Z } from '@/lib/ui/zIndex'
import type { TeamRankingMetricsResult } from '@/app/(dashboard)/istatistikler/teamActivityActions'

type DownlineRow = {
  user_id: string
  full_name: string | null
}

type TeamFieldRankingTableProps = {
  downlines: DownlineRow[]
  metrics: TeamRankingMetricsResult | undefined
  loading: boolean
  getMemberHref: (row: { user_id: string; full_name: string | null }) => string | null
}

function medalForRank(rank: number): string | null {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

const ACTIVITY_COLUMNS = [
  { id: 'whatsapp' as const, Icon: null as typeof Sparkles | null, labelKey: 'team.legendWhatsapp' },
  { id: 'notes' as const, Icon: Pencil, labelKey: 'team.activityNotes' },
  { id: 'stage' as const, Icon: ArrowRight, labelKey: 'team.activityStageChanges' },
  { id: 'ai' as const, Icon: Sparkles, labelKey: 'team.activityAi' },
  { id: 'active' as const, Icon: CalendarDays, labelKey: 'team.activityActiveDays' },
  { id: 'total' as const, Icon: Activity, labelKey: 'team.activityTotalActions' },
]

const FUNNEL_LABEL_KEYS: Record<FunnelMetricKey, string> = {
  arama: 'dashboard.dailyTrackMetricCalls',
  tanisma: 'dashboard.dailyTrackMetricMeetings',
  sunum: 'dashboard.dailyTrackMetricPresentations',
  yeniUye: 'dashboard.dailyTrackMetricMembers',
}

export function TeamFieldRankingTable({
  downlines,
  metrics,
  loading,
  getMemberHref,
}: TeamFieldRankingTableProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const rows = useMemo(() => {
    return downlines
      .map(m => {
        const data = metrics?.byUser[m.user_id]
        return {
          userId: m.user_id,
          name: m.full_name ?? t('statsPage.unnamedMember'),
          href: getMemberHref(m),
          funnel: data?.funnel ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 },
          whatsapps: data?.whatsapps ?? 0,
          notes: data?.notes ?? 0,
          stageChanges: data?.stageChanges ?? 0,
          aiActions: data?.aiActions ?? 0,
          activeDays: data?.activeDays ?? 0,
          totalActions: data?.totalActions ?? 0,
        }
      })
      .sort((a, b) => b.totalActions - a.totalActions || b.funnel.arama - a.funnel.arama)
  }, [downlines, metrics, getMemberHref, t])

  if (!loading && downlines.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
      </section>
    )
  }

  const metricValue = (row: (typeof rows)[number], colId: (typeof ACTIVITY_COLUMNS)[number]['id']) => {
    if (colId === 'whatsapp') return row.whatsapps
    if (colId === 'notes') return row.notes
    if (colId === 'stage') return row.stageChanges
    if (colId === 'ai') return row.aiActions
    if (colId === 'active') return row.activeDays
    return row.totalActions
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
          <Trophy className="h-4 w-4 text-amber-500" />
          {t('crown.ranking')}
        </div>

        {loading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : (
          <div
            className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none"
            data-no-swipe="true"
            onTouchStart={e => e.stopPropagation()}
          >
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]">
                  <th className={`sticky left-0 ${Z.cardControls} bg-[var(--bg-subtle)] p-2.5 text-left font-semibold`}>
                    {t('team.colPerson')}
                  </th>
                  {FUNNEL_METRIC_ORDER.map(metric => {
                    const { Icon, color } = FUNNEL_METRIC_VISUAL[metric]
                    return (
                      <th key={metric} className="p-2 text-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-card)]">
                          <Icon className="h-4 w-4" style={{ color }} strokeWidth={2.25} aria-hidden />
                        </span>
                        <span className="sr-only">{t(FUNNEL_LABEL_KEYS[metric])}</span>
                      </th>
                    )
                  })}
                  {ACTIVITY_COLUMNS.map(col => (
                    <th key={col.id} className="p-2 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-card)]">
                        {col.id === 'whatsapp' ? (
                          <WhatsAppIcon className="h-4 w-4 text-[#128C7E]" aria-hidden />
                        ) : col.Icon ? (
                          <col.Icon
                            className={clsx(
                              'h-4 w-4',
                              col.id === 'stage' && 'text-amber-600 dark:text-amber-400',
                              col.id === 'ai' && 'text-indigo-600 dark:text-indigo-400',
                              col.id === 'total' && 'text-brand',
                              (col.id === 'notes' || col.id === 'active') && 'text-[var(--text-2)]',
                            )}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <span className="sr-only">{t(col.labelKey)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row, idx) => (
                  <tr
                    key={row.userId}
                    className={clsx(
                      idx === 0 && 'bg-amber-50/70 dark:bg-amber-950/20',
                      idx === 2 && 'bg-sky-50/70 dark:bg-sky-950/20',
                    )}
                  >
                    <td className={`sticky left-0 ${Z.cardControls} bg-inherit p-2.5`}>
                      <button
                        type="button"
                        onClick={() => row.href && router.push(row.href)}
                        disabled={!row.href}
                        className="flex w-full min-w-0 items-center gap-1.5 text-left disabled:cursor-default"
                      >
                        <span className="w-6 shrink-0 tabular-nums text-[var(--text-3)]">
                          {medalForRank(idx) ?? idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-1)]">
                          {row.name}
                        </span>
                        {row.href ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
                        ) : null}
                      </button>
                    </td>
                    {FUNNEL_METRIC_ORDER.map(metric => (
                      <td key={metric} className="p-2 text-center tabular-nums text-[var(--text-1)]">
                        {row.funnel[metric]}
                      </td>
                    ))}
                    {ACTIVITY_COLUMNS.map(col => (
                      <td key={col.id} className="p-2 text-center tabular-nums text-[var(--text-1)]">
                        {col.id === 'active'
                          ? `${metricValue(row, col.id)}${t('team.dayShort')}`
                          : metricValue(row, col.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && rows.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
            {t('team.fieldLegendTitle')}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3 md:grid-cols-5">
            {FUNNEL_METRIC_ORDER.map(metric => {
              const { Icon, color } = FUNNEL_METRIC_VISUAL[metric]
              return (
                <div key={metric} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} strokeWidth={2.25} aria-hidden />
                  <span>{t(FUNNEL_LABEL_KEYS[metric])}</span>
                </div>
              )
            })}
            {ACTIVITY_COLUMNS.map(col => (
              <div key={col.id} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                {col.id === 'whatsapp' ? (
                  <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-[#128C7E]" aria-hidden />
                ) : col.Icon ? (
                  <col.Icon className="h-3.5 w-3.5 shrink-0 text-[var(--text-2)]" strokeWidth={2.25} aria-hidden />
                ) : null}
                <span>{t(col.labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
