'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { CandidateFilter } from '@/hooks/useCandidates'

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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide no-swipe" data-no-swipe="true">
      {STAGE_FILTERS.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={clsx(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap',
            active === key
              ? 'bg-[#534AB7] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[var(--bg-subtle)] dark:text-[var(--text-2)] dark:hover:bg-[var(--border)]'
          )}
        >
          {getLabel(key)}
          <span className={clsx('ml-1.5', active === key ? 'text-purple-200' : 'text-gray-400 dark:text-[var(--text-3)]')}>
            {counts[key] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
