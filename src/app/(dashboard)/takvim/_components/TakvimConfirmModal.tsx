'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'

type TakvimConfirmModalProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function TakvimConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
}: TakvimConfirmModalProps) {
  const [mounted] = useState(() => typeof window !== 'undefined')

  useBodyScrollLock()
  useHistoryBackClose(true, onCancel)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-crown-subtle">
            <AlertTriangle className="h-7 w-7 text-crown" strokeWidth={1.75} />
          </div>
        </div>
        <h2 className="mb-2 text-center text-base font-bold text-[var(--text-1)]">{title}</h2>
        <p className="mb-6 text-center text-sm text-[var(--text-2)]">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-[#4338a8] disabled:opacity-50"
          >
            {isLoading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
