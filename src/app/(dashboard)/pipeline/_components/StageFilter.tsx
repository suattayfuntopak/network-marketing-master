'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { CandidateFilter } from '@/hooks/useCandidates'
import { STAGE_COLOR } from '@/lib/domain/stages'
import type { CandidateStage } from '@/types/database.types'
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'

const STAGE_FILTERS: CandidateFilter[] = [
  'tumü',
  'yeni',
  'iletisim',
  'davetli',
  'sunum',
  'takip',
  'kararsiz',
  'katildi',
  'ilgilenmedi',
  'pasif',
  'kayboldu',
]

interface StageFilterProps {
  active: CandidateFilter
  onChange: (f: CandidateFilter) => void
  counts: Record<CandidateFilter, number>
}

export function StageFilter({ active, onChange, counts }: StageFilterProps) {
  const { t } = useTranslation()

  function getLabel(key: CandidateFilter): string {
    if (key === 'tumü') return t('pipelinePage.all')
    return t(`stages.${key}`)
  }

  return (
    <HorizontalScrollLock className="flex gap-2 pb-1 scrollbar-hide">
      {STAGE_FILTERS.map((key) => {
        const isStage = key !== 'tumü'
        const stageChip = isStage ? STAGE_COLOR[key as CandidateStage] : null
        return (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={clsx(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap',
            active === key
              ? isStage
                ? clsx(stageChip, 'ring-2 ring-offset-1 ring-offset-[var(--bg-page)] ring-current shadow-sm')
                : 'bg-brand text-white dark:bg-[#5D44C9] dark:text-white dark:hover:bg-[#4a38b0]'
              : isStage
                ? clsx(stageChip, 'opacity-90 hover:opacity-100')
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[var(--bg-subtle)] dark:text-[var(--text-2)] dark:hover:bg-[var(--border)]',
          )}
        >
          {getLabel(key)}
          <span
            className={clsx(
              'ml-1.5 tabular-nums',
              active === key
                ? isStage
                  ? 'opacity-80'
                  : 'text-purple-200'
                : isStage
                  ? 'opacity-70'
                  : 'text-gray-400 dark:text-[var(--text-3)]',
            )}
          >
            {counts[key] ?? 0}
          </span>
        </button>
        )
      })}
    </HorizontalScrollLock>
  )
}
