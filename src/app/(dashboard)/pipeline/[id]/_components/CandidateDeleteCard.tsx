'use client'

import { Trash2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

type Props = {
  onDelete: () => void
}

export function CandidateDeleteCard({ onDelete }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[110px] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
        {t('pipeline.deleteCandidate')}
      </p>
      <button
        type="button"
        onClick={onDelete}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FBEAF0] bg-[#FBEAF0] py-2.5 text-sm font-semibold text-[#72243E] transition hover:bg-[#f5d4e0]"
        title={t('pipeline.deleteCandidate')}
      >
        <Trash2 className="h-4 w-4" />
        {t('pipeline.deleteCandidate')}
      </button>
    </div>
  )
}
