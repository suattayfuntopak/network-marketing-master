'use client'

import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, PlayCircle, Shield, Trophy, User } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { personAccent } from '@/lib/ui/personAccent'
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'
import { Skeleton } from '@/components/ui/Skeleton'
import { Z } from '@/lib/ui/zIndex'
import type { PerfLearningMap } from '@/app/(dashboard)/istatistikler/_components/TeamPerformanceTable'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'

type MemberRow = {
  user_id: string
  full_name: string | null
}

type TeamTrainingRankingTableProps = {
  members: MemberRow[]
  progressByUserId: PerfLearningMap
  videoByUserId: Record<string, VideoProgressSummary>
  loading?: boolean
}

type TrainingRow = {
  userId: string
  name: string
  trainingPct: number
  objectionPct: number
  videoPct: number
  avg: number
}

/** Eşit muamele: herkese aynı (adam) ikon, kişiye özel renk (sıralama vurgusu yok). */
function PersonIcon({ userId }: { userId: string }) {
  return <User className={clsx('h-4 w-4 shrink-0', personAccent(userId).icon)} strokeWidth={2.5} aria-hidden />
}

function PctCell({ value }: { value: number }) {
  return <span className="font-bold tabular-nums">%{value}</span>
}

function MobileTrainingMetricGrid({
  row,
  t,
}: {
  row: TrainingRow
  t: (key: string) => string
}) {
  const cells = [
    { label: t('team.colContentLibrary'), value: row.trainingPct, icon: BookOpen, iconClass: 'text-brand' },
    { label: t('team.colVideoTraining'), value: row.videoPct, icon: PlayCircle, iconClass: 'text-teal-600 dark:text-teal-400' },
    { label: t('team.colObjectionBank'), value: row.objectionPct, icon: Shield, iconClass: 'text-amber-600 dark:text-amber-400' },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] bg-[var(--bg-subtle)]/40 p-3 sm:grid-cols-3">
      {cells.map(({ label, value, icon: Icon, iconClass }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2.5"
        >
          <div className="mb-1 flex items-center gap-1.5 text-[var(--text-3)]">
            <Icon className={clsx('h-4 w-4 shrink-0', iconClass)} strokeWidth={2.25} aria-hidden />
            <span className="min-w-0 text-[10px] font-bold uppercase leading-tight tracking-wide">
              {label}
            </span>
          </div>
          <p className="text-lg font-black tabular-nums text-[var(--text-1)]">%{value}</p>
        </div>
      ))}
    </div>
  )
}

export function TeamTrainingRankingTable({
  members,
  progressByUserId,
  videoByUserId,
  loading,
}: TeamTrainingRankingTableProps) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rows = useMemo((): TrainingRow[] => {
    return members
      .map(m => {
        const trainingPct = progressByUserId[m.user_id]?.trainingPct ?? 0
        const objectionPct = progressByUserId[m.user_id]?.objectionPct ?? 0
        const videoPct = videoByUserId[m.user_id]?.pct ?? 0
        const avg = Math.round((trainingPct + objectionPct + videoPct) / 3)
        return {
          userId: m.user_id,
          name: m.full_name ?? '—',
          trainingPct,
          objectionPct,
          videoPct,
          avg,
        }
      })
      .sort((a, b) => b.avg - a.avg || b.trainingPct - a.trainingPct)
  }, [members, progressByUserId, videoByUserId])

  if (loading) {
    return <Skeleton className="h-40 rounded-2xl" />
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-sm text-[var(--text-3)]">{t('team.emptyTrainingRanking')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
        <Trophy className="h-4 w-4 text-amber-500" />
        {t('crown.ranking')}
      </div>

      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] md:hidden">
        {rows.map((row) => {
          const open = expandedId === row.userId
          return (
            <li key={row.userId}>
              <div className="flex items-center gap-2 p-3">
                <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-semibold text-[var(--text-1)]">
                  <PersonIcon userId={row.userId} />
                  <span className="truncate">{row.name}</span>
                </p>
                <span className="shrink-0 rounded-lg bg-[var(--bg-subtle)] px-2 py-0.5 text-xs font-bold tabular-nums text-brand">
                  %{row.avg}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : row.userId)}
                  aria-expanded={open}
                  aria-label={t('team.expandMetrics')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]"
                >
                  <ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} />
                </button>
              </div>
              {open ? <MobileTrainingMetricGrid row={row} t={t} /> : null}
            </li>
          )
        })}
      </ul>

      <HorizontalScrollLock className="hidden rounded-xl border border-[var(--border)] md:block">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]">
              <th className={`sticky left-0 ${Z.cardControlsUpper} bg-[var(--bg-subtle)] p-2.5 text-left font-semibold shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]`}>
                {t('team.colPerson')}
              </th>
              <th className="p-2.5 text-center font-semibold">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-brand" strokeWidth={2.25} aria-hidden />
                  {t('team.colContentLibrary')}
                </span>
              </th>
              <th className="p-2.5 text-center font-semibold">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" strokeWidth={2.25} aria-hidden />
                  {t('team.colVideoTraining')}
                </span>
              </th>
              <th className="p-2.5 text-center font-semibold">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2.25} aria-hidden />
                  {t('team.colObjectionBank')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row) => {
              return (
                <tr key={row.userId}>
                  <td
                    className={clsx(
                      'sticky left-0 bg-[var(--bg-card)] p-2.5 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]',
                      Z.cardControlsUpper,
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <PersonIcon userId={row.userId} />
                      <span className="truncate font-medium text-[var(--text-1)]">{row.name}</span>
                    </span>
                  </td>
                  <td className="bg-inherit p-2.5 text-center">
                    <PctCell value={row.trainingPct} />
                  </td>
                  <td className="bg-inherit p-2.5 text-center">
                    <PctCell value={row.videoPct} />
                  </td>
                  <td className="bg-inherit p-2.5 text-center">
                    <PctCell value={row.objectionPct} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </HorizontalScrollLock>
    </div>
  )
}
