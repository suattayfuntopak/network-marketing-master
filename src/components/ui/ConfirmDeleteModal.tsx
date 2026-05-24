'use client'

import { useEffect } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmDeleteModalProps {
  name: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ name, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  // Escape tuşuyla kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)]">
        {/* İkon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FBEAF0]">
            <AlertTriangle className="h-7 w-7 text-[#72243E]" strokeWidth={1.75} />
          </div>
        </div>

        {/* Başlık */}
        <h2 className="mb-2 text-center text-base font-bold text-[var(--text-1)]">
          Silmek istediğinizden emin misiniz?
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--text-2)] leading-relaxed">
          <span className="font-semibold text-[var(--text-1)]">{name}</span> silindikten sonra
          <br />
          5 saniye içinde geri alabilirsiniz.
        </p>

        {/* Butonlar */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)]"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#72243E] py-3 text-sm font-semibold text-white transition hover:bg-[#5a1c31] active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            Evet, Sil
          </button>
        </div>
      </div>
    </>
  )
}
