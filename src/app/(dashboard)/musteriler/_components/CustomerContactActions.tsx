'use client'

import { Bot, Lock, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import type { useTranslation } from '@/providers/LanguageProvider'

type TranslateFn = ReturnType<typeof useTranslation>['t']

type Props = {
  phone: string | null
  customerId: string
  t: TranslateFn
  generatingId: string | null
  hasAiFieldAccess: boolean
  onAiClick: () => void
  className?: string
}

export function CustomerContactActions({
  phone,
  customerId,
  t,
  generatingId,
  hasAiFieldAccess,
  onAiClick,
  className = 'mt-2',
}: Props) {
  const waLink = phone ? waHref(phone) : null
  const generating = generatingId === customerId

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      role="presentation"
    >
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md sm:hidden"
          aria-label={t('pipeline.call')}
          title={t('pipeline.call')}
        >
          <Phone className="h-4 w-4" strokeWidth={1.75} />
        </a>
      )}
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-whatsapp text-white transition-all hover:scale-105 hover:shadow-md"
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
      ) : (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-3)]"
          title={t('pipeline.noWhatsApp')}
          aria-hidden
        >
          <WhatsAppIcon className="h-4 w-4 opacity-40" />
        </div>
      )}
      <button
        type="button"
        onClick={onAiClick}
        disabled={generating}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand transition-all hover:scale-105 hover:shadow-md disabled:opacity-50"
        aria-label={t('musteriler.aiMessageCta')}
        title={t('musteriler.aiMessageCta')}
      >
        {generating ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        ) : (
          <Bot className="h-4 w-4" strokeWidth={1.75} />
        )}
        {!hasAiFieldAccess && (
          <Lock className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-[var(--text-3)]" strokeWidth={2.5} aria-hidden />
        )}
      </button>
    </div>
  )
}
