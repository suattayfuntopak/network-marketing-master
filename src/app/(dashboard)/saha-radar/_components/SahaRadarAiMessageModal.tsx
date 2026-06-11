'use client'

import { createPortal } from 'react-dom'
import { Copy, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import { Z } from '@/lib/ui/zIndex'

export type ActiveAiMessage = {
  message: string
  candidateName: string
  phone: string | null
  candidateId: string
  isCoaching?: boolean
}

export function SahaRadarAiMessageModal({
  activeAiMessage,
  onClose,
  onWaSend,
}: {
  activeAiMessage: ActiveAiMessage
  onClose: () => void
  onWaSend: (candidateId: string) => void
}) {
  return createPortal(
    <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20 text-brand">
              <Sparkles className="h-4 w-4 fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-1)]">
                {activeAiMessage.isCoaching ? 'Koçluk Mesajı' : 'Yapay Zeka Mesajı'}
              </h2>
              <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">
                {activeAiMessage.candidateName} için üretildi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mb-5">
          <textarea
            value={activeAiMessage.message}
            readOnly
            rows={6}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] leading-relaxed outline-none resize-none"
          />
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(activeAiMessage.message)
              toast.success('Mesaj kopyalandı!')
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-brand-subtle hover:text-brand active:scale-95"
            title="Kopyala"
          >
            <Copy className="h-4 w-4" />
          </button>
          {activeAiMessage.phone &&
            waHref(activeAiMessage.phone, activeAiMessage.message) && (
              <a
                href={waHref(activeAiMessage.phone, activeAiMessage.message)!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onWaSend(activeAiMessage.candidateId)
                  onClose()
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp text-white transition hover:opacity-90 active:scale-95 shadow-[0_4px_12px_rgba(37,211,102,0.2)]"
                title="WhatsApp ile Gönder"
              >
                <WhatsAppIcon className="h-4.5 w-4.5" />
              </a>
            )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
