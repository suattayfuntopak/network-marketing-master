'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useTranslation } from '@/providers/LanguageProvider'

interface ConfirmDialogProps {
  message: string
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  message,
  title,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const [mounted] = useState(() => typeof window !== 'undefined')

  useBodyScrollLock()

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
      <div className="relative w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
            variant === 'danger'
              ? 'bg-red-50 dark:bg-red-950/30'
              : 'bg-brand-subtle dark:bg-[#2d2a5e]'
          }`}>
            {variant === 'danger'
              ? <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" strokeWidth={1.75} />
              : <HelpCircle className="h-7 w-7 text-brand dark:text-[#a09be8]" strokeWidth={1.75} />
            }
          </div>
        </div>
        {title && (
          <h2 className="mb-2 text-center text-base font-bold text-[var(--text-1)]">{title}</h2>
        )}
        <p className="mb-6 text-center text-sm text-[var(--text-2)]">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)]"
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white transition ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand hover:bg-[#453DA0]'
            }`}
          >
            {confirmLabel ?? t('common.yes')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
