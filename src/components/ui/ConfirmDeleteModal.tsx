'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useTranslation } from '@/providers/LanguageProvider'

interface ConfirmDeleteModalProps {
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ message, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useBodyScrollLock()

  // Escape tuşuyla kapat
  useEffect(() => {
    setMounted(true)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center p-4`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xs rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
        {/* İkon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FBEAF0]">
            <AlertTriangle className="h-7 w-7 text-[#72243E]" strokeWidth={1.75} />
          </div>
        </div>

        {/* Başlık */}
        <h2 className={`text-center text-base font-bold text-[var(--text-1)] ${message ? 'mb-2' : 'mb-6'}`}>
          {t('common.confirmDeleteTitle')}
        </h2>
        {message && (
          <p className="mb-6 text-center text-sm text-[var(--text-2)]">{message}</p>
        )}

        {/* Butonlar */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)]"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#72243E] py-3 text-sm font-semibold text-white transition hover:bg-[#5a1c31] active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            {t('common.confirmYes')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

