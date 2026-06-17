'use client'

import { X } from 'lucide-react'
import { getStageLabel } from '@/lib/domain/stages'
import { Z } from '@/lib/ui/zIndex'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]'

interface Props {
  query: string
  selected: NmmCandidate | null
  dropdownOpen: boolean
  filtered: NmmCandidate[]
  lang: 'tr' | 'en'
  containerRef: React.RefObject<HTMLDivElement | null>
  label: string
  placeholder: string
  noCandidatesLabel: string
  onQueryChange: (value: string) => void
  onDropdownOpen: (open: boolean) => void
  onSelect: (c: NmmCandidate) => void
  onClear: () => void
}

export function CandidateSearchCombobox({
  query,
  selected,
  dropdownOpen,
  filtered,
  lang,
  containerRef,
  label,
  placeholder,
  noCandidatesLabel,
  onQueryChange,
  onDropdownOpen,
  onSelect,
  onClear,
}: Props) {
  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]">{label}</label>

      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-[#0F6E56] bg-[var(--bg-card)] px-4 py-3 ring-2 ring-[#E1F5EE]">
          <div>
            <p className="text-sm font-semibold text-[var(--text-1)]">{selected.full_name}</p>
            <p className="text-xs text-[var(--text-3)]">{getStageLabel(selected.stage, lang)}</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] transition hover:text-[var(--text-1)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={e => {
            onQueryChange(e.target.value)
            onDropdownOpen(true)
          }}
          onFocus={() => {
            if (query) onDropdownOpen(true)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClass}
        />
      )}

      {dropdownOpen && !selected && query.length > 0 && (
        <div
          className={`absolute left-0 right-0 top-full ${Z.dropdown} mt-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl`}
          style={{ maxHeight: '240px', overflowY: 'auto' }}
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-3)]">{noCandidatesLabel}</p>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => onSelect(c)}
                className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--bg-subtle)] last:border-b-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                  {c.phone && <p className="text-xs text-[var(--text-3)]">{c.phone}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-semibold text-brand">
                  {getStageLabel(c.stage as CandidateStage, lang)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
