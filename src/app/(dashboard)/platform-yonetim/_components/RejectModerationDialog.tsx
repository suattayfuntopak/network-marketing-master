'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useTranslation } from '@/providers/LanguageProvider'

type Props = {
  defaultReason: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function RejectModerationDialog({ defaultReason, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  const [mounted] = useState(() => typeof window !== 'undefined')
  const [reason, setReason] = useState(defaultReason)

  useBodyScrollLock()

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setReason(defaultReason)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel, defaultReason])

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-base font-bold text-[var(--text-1)]">
          {t('platformPage.rejectRequestTitle')}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          {t('platformPage.rejectRequestMessage')}
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          className="mt-4 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-brand focus:ring-2 focus:ring-[#EEEDFE]"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)]"
          >
            <X className="h-4 w-4" />
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim() || defaultReason)}
            className="flex-1 rounded-xl bg-[#72243E] py-3 text-sm font-semibold text-white transition hover:bg-[#5a1c31]"
          >
            {t('platformPage.rejectRequestConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
