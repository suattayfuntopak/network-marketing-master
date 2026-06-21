'use client'

import { createPortal } from 'react-dom'
import { Bot, Copy, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import { Z } from '@/lib/ui/zIndex'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'
import type { useTranslation } from '@/providers/LanguageProvider'

type TranslateFn = ReturnType<typeof useTranslation>['t']

export function CustomerAiMessageModal({
  t,
  customerName,
  phone,
  message,
  loading,
  error,
  onClose,
}: {
  t: TranslateFn
  customerName: string
  phone: string | null
  message: string
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  useHistoryBackClose(true, onClose)
  return createPortal(
    <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand">
              <Bot className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--text-1)]">{t('musteriler.aiMessageTitle')}</h2>
              <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-3)]">
                {t('musteriler.aiMessageFor', { name: customerName })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
            <p className="text-xs font-medium text-[var(--text-3)]">{t('musteriler.aiMessageGenerating')}</p>
          </div>
        ) : error ? (
          <p className="rounded-xl border border-rose-200/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            {error}
          </p>
        ) : (
          <>
            <textarea
              value={message}
              readOnly
              rows={6}
              className="mb-5 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm leading-relaxed text-[var(--text-1)] outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(message)
                  toast.success(t('musteriler.aiMessageCopied'))
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-brand-subtle hover:text-brand active:scale-95"
                title={t('coachUi.copy')}
              >
                <Copy className="h-4 w-4" />
              </button>
              {phone && waHref(phone, message) && (
                <a
                  href={waHref(phone, message)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp text-white shadow-[0_4px_12px_rgba(37,211,102,0.2)] transition hover:opacity-90 active:scale-95"
                  title="WhatsApp"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
