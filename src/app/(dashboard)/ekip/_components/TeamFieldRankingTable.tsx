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
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  FUNNEL_METRIC_ORDER,
  FUNNEL_METRIC_VIVID_CLASS,
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
  arama: 'team.fieldMetricCalls',
  tanisma: 'team.fieldMetricMeetings',
  sunum: 'team.fieldMetricPresentations',
  yeniUye: 'team.fieldMetricMembers',
}

function rowStickyBg(idx: number): string {
  if (idx === 0) return 'bg-amber-50/70 dark:bg-amber-950/20'
  if (idx === 2) return 'bg-sky-50/70 dark:bg-sky-950/20'
  return 'bg-[var(--bg-card)]'
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

  const activityIconClass = (colId: (typeof ACTIVITY_COLUMNS)[number]['id']) =>
    clsx(
      'h-4 w-4 mx-auto',
      colId === 'stage' && 'text-amber-600 dark:text-amber-400',
      colId === 'ai' && 'text-indigo-600 dark:text-indigo-400',
      colId === 'total' && 'text-brand dark:text-brand-accent',
      (colId === 'notes' || colId === 'active') && 'text-[var(--text-2)] dark:text-[var(--text-1)]',
    )

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4 no-swipe">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
          <Trophy className="h-4 w-4 text-amber-500" />
          {t('crown.ranking')}
        </div>

        {loading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : (
          <HorizontalScrollLock className="rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]">
                  <th className={`sticky left-0 ${Z.cardControlsUpper} bg-[var(--bg-subtle)] p-2.5 text-left font-semibold shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]`}>
                    {t('team.colPerson')}
                  </th>
                  {FUNNEL_METRIC_ORDER.map(metric => {
                    const { Icon } = FUNNEL_METRIC_VISUAL[metric]
                    return (
                      <th key={metric} className="p-2 text-center">
                        <Icon
                          className={clsx('mx-auto h-4 w-4', FUNNEL_METRIC_VIVID_CLASS[metric])}
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span className="sr-only">{t(FUNNEL_LABEL_KEYS[metric])}</span>
                      </th>
                    )
                  })}
                  {ACTIVITY_COLUMNS.map(col => (
                    <th key={col.id} className="p-2 text-center">
                      {col.id === 'whatsapp' ? (
                        <WhatsAppIcon className="mx-auto h-4 w-4 text-[#128C7E]" aria-hidden />
                      ) : col.Icon ? (
                        <col.Icon className={activityIconClass(col.id)} strokeWidth={2.25} aria-hidden />
                      ) : null}
                      <span className="sr-only">{t(col.labelKey)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row, idx) => {
                  const stickyBg = rowStickyBg(idx)
                  return (
                    <tr
                      key={row.userId}
                      className={clsx(
                        idx === 0 && 'bg-amber-50/70 dark:bg-amber-950/20',
                        idx === 2 && 'bg-sky-50/70 dark:bg-sky-950/20',
                      )}
                    >
                      <td className={clsx(
                        'sticky left-0 p-2.5 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]',
                        Z.cardControlsUpper,
                        stickyBg,
                      )}>
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
                        <td key={metric} className="bg-inherit p-2 text-center tabular-nums text-[var(--text-1)]">
                          {row.funnel[metric]}
                        </td>
                      ))}
                      {ACTIVITY_COLUMNS.map(col => (
                        <td key={col.id} className="bg-inherit p-2 text-center tabular-nums text-[var(--text-1)]">
                          {col.id === 'active'
                            ? `${metricValue(row, col.id)}${t('team.dayShort')}`
                            : metricValue(row, col.id)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </HorizontalScrollLock>
        )}
      </section>

    </div>
  )
}
