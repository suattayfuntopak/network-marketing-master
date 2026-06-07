'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, Bot, Copy, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { Z } from '@/lib/ui/zIndex'
import { waHref } from '@/lib/utils/waLink'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useTranslation } from '@/providers/LanguageProvider'
import { generateNmmInviteMessage } from '../actions'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'

interface Props {
  candidate: { id: string; full_name: string | null; phone: string | null }
  onClose: () => void
}

/**
 * Saha ortağına (aday) kişiye özel NMM davet metnini, onun kendi sayfasında açar.
 * Otomatik üretir; kullanıcı dilerse düzenler ve tek tıkla WhatsApp'tan gönderir.
 */
export function NmmInviteSheet({ candidate, onClose }: Props) {
  const { t } = useTranslation()
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useBodyScrollLock()

  useEffect(() => {
    if (!hasAiFieldAccess) {
      setLoading(false)
      openUpgrade('ai_field')
      return
    }
    let cancelled = false
    generateNmmInviteMessage(candidate.id).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setMessage(res.message ?? '')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [candidate.id, hasAiFieldAccess, openUpgrade])

  const regenerate = useCallback(async () => {
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
    setLoading(true)
    setError(null)
    const res = await generateNmmInviteMessage(candidate.id)
    if (res.error) setError(res.error)
    else setMessage(res.message ?? '')
    setLoading(false)
  }, [candidate.id, hasAiFieldAccess, openUpgrade])

  const waLink = waHref(candidate.phone, message)

  function handleCopy() {
    if (!message) return
    navigator.clipboard.writeText(message)
    toast.success(t('coachUi.inviteCopied'))
  }

  return (
    <>
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/40 backdrop-blur-sm`} onClick={onClose} />
      <div
        className={`fixed left-1/2 top-1/2 ${Z.sheet} flex w-[calc(100%-2rem)] md:w-[440px] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#534AB7]/10 text-[#534AB7] dark:text-indigo-300">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--text-1)]">{t('coachUi.inviteTitle')}</p>
              <p className="truncate text-xs text-[var(--text-3)]">
                {t('coachUi.inviteSubtitle', { name: candidate.full_name ?? '' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-[var(--border)]"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-[var(--text-3)]">
            <Loader2 className="h-7 w-7 animate-spin text-[#534AB7]" />
            <p className="text-sm">{t('coachUi.inviteGenerating')}</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E] dark:bg-red-950/20 dark:text-red-300">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void regenerate()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
            >
              <RefreshCw className="h-4 w-4" /> {t('coachUi.inviteRegenerate')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm leading-relaxed text-[var(--text-1)] outline-none transition focus:border-[#534AB7]"
            />
            <p className="text-xs italic text-[var(--text-3)]">{t('coachUi.inviteHint')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] active:scale-95"
                title={t('coachUi.copy')}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void regenerate()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] active:scale-95"
                title={t('coachUi.inviteRegenerate')}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                >
                  <WhatsAppIcon className="h-4 w-4 fill-current" /> {t('coachUi.inviteSend')}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/50 px-3 py-2.5 text-sm font-bold text-white"
                >
                  <WhatsAppIcon className="h-4 w-4 fill-current" /> {t('coachUi.inviteSend')}
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
      {UpgradePrompt}
    </>
  )
}
