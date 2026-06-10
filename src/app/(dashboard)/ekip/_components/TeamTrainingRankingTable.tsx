'use client'

import { useMemo } from 'react'
import { BookOpen, PlayCircle, Shield, Trophy } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
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

function medalForRank(rank: number): string | null {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

function rowStickyBg(idx: number): string {
  if (idx === 0) return 'bg-amber-50 dark:bg-amber-950'
  if (idx === 2) return 'bg-sky-50 dark:bg-sky-950'
  return 'bg-[var(--bg-card)]'
}

function rowBg(idx: number): string {
  if (idx === 0) return 'bg-amber-50 dark:bg-amber-950'
  if (idx === 2) return 'bg-sky-50 dark:bg-sky-950'
  return ''
}

function PctCell({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold tabular-nums">%{value}</span>
      <div className="h-1 w-10 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
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

  const rows = useMemo(() => {
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

  if (rows.length === 0) return null

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text-1)]">
        <Trophy className="h-4 w-4 text-amber-500" />
        {t('crown.ranking')}
      </div>
      <HorizontalScrollLock className="rounded-xl border border-[var(--border)]">
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
            {rows.map((row, idx) => {
              const stickyBg = rowStickyBg(idx)
              return (
              <tr key={row.userId} className={rowBg(idx)}>
                <td
                  className={clsx(
                    'sticky left-0 p-2.5 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]',
                    Z.cardControlsUpper,
                    stickyBg,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-6 shrink-0 tabular-nums text-[var(--text-3)]">
                      {medalForRank(idx) ?? idx + 1}
                    </span>
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
            )})}
          </tbody>
        </table>
      </HorizontalScrollLock>
    </div>
  )
}
