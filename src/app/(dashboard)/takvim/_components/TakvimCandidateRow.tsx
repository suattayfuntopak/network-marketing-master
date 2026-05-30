'use client'

import { Calendar } from 'lucide-react'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { getStageLabel, STAGE_COLOR } from '@/lib/domain/stages'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'

type TakvimCandidateRowProps = {
  candidate: NmmCandidate
  lang: string
  deferLabel: string
  dayLabel: string
  daysLabel: string
  onOpen: () => void
  onDefer: (days: number) => void
  isDeferring: boolean
}

export function TakvimCandidateRow({
  candidate,
  lang,
  deferLabel,
  dayLabel,
  daysLabel,
  onOpen,
  onDefer,
  isDeferring,
}: TakvimCandidateRowProps) {
  const stage = candidate.stage as CandidateStage | null

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-[#534AB7]/30 hover:shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left active:scale-[0.99]"
      >
        <PersonAvatar
          name={candidate.full_name}
          imageUrl={resolveCandidateFields(candidate).avatarUrl}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-1)]">{candidate.full_name}</p>
          {candidate.phone && <p className="text-xs text-[var(--text-2)]">{candidate.phone}</p>}
        </div>
        {stage && STAGE_COLOR[stage] && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STAGE_COLOR[stage]}`}>
            {getStageLabel(stage, lang)}
          </span>
        )}
      </button>

      <div className="border-t border-[var(--border)] px-4 pb-3 pt-2.5">
        <p className="mb-2 px-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--text-3)]">
          {deferLabel}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[1, 3, 7].map(days => (
            <button
              key={days}
              type="button"
              disabled={isDeferring}
              onClick={e => {
                e.stopPropagation()
                onDefer(days)
              }}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-2 text-xs font-medium text-[var(--text-1)] transition hover:border-[#1A56DB]/30 hover:bg-[#E8F0FE] hover:text-[#1A56DB] disabled:opacity-50"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span>+{days} {days === 1 ? dayLabel : daysLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </li>
  )
}
