'use client'

import { clsx } from 'clsx'
import type { CandidateFilter } from '@/hooks/useCandidates'

const FILTERS: { key: CandidateFilter; label: string }[] = [
  { key: 'tumü',       label: 'Tümü'      },
  { key: 'aktif',      label: 'Aktif'     },
  { key: 'sicak',      label: 'Sıcak 🔥'  },
  { key: 'kaybolanlar', label: 'Kaybolanlar' },
]

interface StageFilterProps {
  active: CandidateFilter
  onChange: (f: CandidateFilter) => void
  counts: Record<CandidateFilter, number>
}

export function StageFilter({ active, onChange, counts }: StageFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={clsx(
            'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
            active === key
              ? 'bg-[#534AB7] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {label}
          <span className={clsx('ml-1.5', active === key ? 'text-purple-200' : 'text-gray-400')}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  )
}
