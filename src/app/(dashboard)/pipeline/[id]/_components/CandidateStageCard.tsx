'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { clsx } from 'clsx'
import { STAGE_COLOR, STAGE_ORDER } from '@/lib/domain/stages'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'
import { useTranslation } from '@/providers/LanguageProvider'
import type { CandidateStage } from '@/types/database.types'

type Props = {
  stage: CandidateStage
  onChangeStage: (stage: CandidateStage) => void
}

export function CandidateStageCard({ stage, onChangeStage }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useBodyScrollLock(open)
  useHistoryBackClose(open, () => setOpen(false))

  function select(next: CandidateStage) {
    setOpen(false)
    onChangeStage(next)
  }

  return (
    <>
      <div className="flex min-h-[110px] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
          {t('pipeline.stage')}
        </p>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={clsx(
            'mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90',
            STAGE_COLOR[stage],
          )}
          title={t('pipeline.stage')}
        >
          {t(`stages.${stage}`)}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <>
          <div
            className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/30 backdrop-blur-sm`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed top-1/2 left-1/2 w-[90%] max-w-[320px] -translate-x-1/2 -translate-y-1/2 ${Z.sheet} overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] pb-4 shadow-2xl animate-in fade-in zoom-in duration-200`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-1)]">{t('pipeline.selectStage')}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="overflow-y-auto py-1" style={{ maxHeight: '55vh' }}>
              {STAGE_ORDER.map(s => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => select(s)}
                    className={clsx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-[var(--bg-subtle)]',
                      s === stage ? 'text-brand' : 'text-[var(--text-1)]',
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        STAGE_COLOR[s].split(' ')[0],
                      )}
                    />
                    {t(`stages.${s}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
