'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { STAGE_ORDER, getStageLabel } from '@/lib/domain/stages'
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
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/30">
        {col.map(row => (
          <li
            key={row.stage}
            className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-4"
          >
            <span className="min-w-0 text-sm font-medium text-[var(--text-1)]">{row.label}</span>
            <span className="shrink-0 rounded-lg bg-[var(--bg-card)] px-2.5 py-0.5 text-sm font-black tabular-nums text-[var(--text-1)]">
              {row.count}
            </span>
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
