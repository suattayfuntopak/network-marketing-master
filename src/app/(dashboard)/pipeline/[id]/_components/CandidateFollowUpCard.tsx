'use client'

import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'
import { useTranslation } from '@/providers/LanguageProvider'
import { daysSince, toInputDateTime, quickFollowUpFromToday } from './candidateDetailUtils'

type Props = {
  nextFollowUpAt: string | null
  lastContactAt: string | null
  nextFollowLabel: string | null
  onSave: (isoOrEmpty: string | null) => void
}

export function CandidateFollowUpCard({
  nextFollowUpAt,
  lastContactAt,
  nextFollowLabel,
  onSave,
}: Props) {
  const { t, lang } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [tempFollowUp, setTempFollowUp] = useState('')

  useBodyScrollLock(editing)
  useHistoryBackClose(editing, () => setEditing(false))

  function openEditor() {
    setTempFollowUp(toInputDateTime(nextFollowUpAt))
    setEditing(true)
  }

  function save() {
    setEditing(false)
    if (!tempFollowUp) {
      onSave(null)
      return
    }
    onSave(new Date(tempFollowUp).toISOString())
  }

  function clear() {
    setEditing(false)
    onSave(null)
  }

  return (
    <>
      <div className="flex min-h-[110px] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
            {t('pipeline.nextContact')}
          </p>
          <button
            type="button"
            onClick={openEditor}
            className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-3)] transition hover:text-brand"
            title={t('common.edit')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex flex-1 flex-col justify-end gap-2">
          <div className="flex w-full items-baseline justify-between">
            <p className="truncate text-sm font-semibold text-brand">
              {nextFollowLabel ?? '—'}
            </p>
            <span className="ml-1 shrink-0 text-[10px] text-[var(--text-3)]">
              ({daysSince(lastContactAt, t)})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSave(quickFollowUpFromToday(3, nextFollowUpAt))}
              className="flex-1 rounded-lg border border-brand/25 bg-brand/5 px-2 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/10 active:scale-95"
            >
              {t('pipeline.followUpQuick3')}
            </button>
            <button
              type="button"
              onClick={() => onSave(quickFollowUpFromToday(7, nextFollowUpAt))}
              className="flex-1 rounded-lg border border-brand/25 bg-brand/5 px-2 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/10 active:scale-95"
            >
              {t('pipeline.followUpQuick7')}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div
          className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-xs space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[var(--text-1)]">{t('pipeline.nextContact')}</h3>
            <input
              type="datetime-local"
              value={tempFollowUp}
              onChange={e => setTempFollowUp(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-brand"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clear}
                className="text-xs font-semibold text-[var(--text-3)] transition hover:text-red-500"
              >
                {lang === 'en' ? 'Clear' : 'Temizle'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex h-9 items-center justify-center rounded-xl border border-[var(--border)] px-3 text-sm font-bold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
                  title={t('common.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-green-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-green-600"
                >
                  <Check className="h-4 w-4" />
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
