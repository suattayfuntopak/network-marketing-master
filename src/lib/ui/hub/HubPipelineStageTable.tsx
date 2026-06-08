'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { STAGE_ORDER, STAGE_CARD_BG, getStageLabel } from '@/lib/domain/stages'
import type { CandidateStage } from '@/types/database.types'
import { Skeleton } from '@/components/ui/Skeleton'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'

type HubPipelineStageTableProps = {
  counts: Partial<Record<CandidateStage, number>>
  loading?: boolean
}

export function HubPipelineStageTable({ counts, loading }: HubPipelineStageTableProps) {
  const { lang, t } = useTranslation()

  const rows = useMemo(
    () =>
      STAGE_ORDER.map(stage => ({
        stage,
        label: getStageLabel(stage, lang),
        count: counts[stage] ?? 0,
      })),
    [counts, lang],
  )

  const total = rows.reduce((sum, r) => sum + r.count, 0)
  const mid = Math.ceil(rows.length / 2)
  const left = rows.slice(0, mid)
  const right = rows.slice(mid)

  if (loading) {
    return (
      <HubSectionCard title={t('crown.hubPipelineFunnelTitle')}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </HubSectionCard>
    )
  }

  function renderColumn(col: typeof rows) {
    return (
      <ul className="space-y-2">
        {col.map(row => (
          <li key={row.stage}>
            <Link
              href={`/pipeline?stage=${row.stage}`}
              className={clsx(
                'flex items-center justify-between gap-3 rounded-xl border border-black/5 px-3 py-2.5 transition hover:brightness-[1.02] active:scale-[0.99] dark:border-white/10 md:px-4',
                STAGE_CARD_BG[row.stage],
              )}
            >
              <span className="min-w-0 text-sm font-semibold">{row.label}</span>
              <span className="shrink-0 rounded-lg bg-black/5 px-2.5 py-0.5 text-sm font-black tabular-nums shadow-sm dark:bg-white/10">
                {row.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <HubSectionCard title={t('crown.hubPipelineFunnelTitle')}>
      <p className="mb-3 text-xs font-medium text-[var(--text-3)]">
        {t('crown.hubPipelineFunnelSubtitle', { total })}
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {renderColumn(left)}
        {renderColumn(right)}
      </div>
    </HubSectionCard>
  )
}
