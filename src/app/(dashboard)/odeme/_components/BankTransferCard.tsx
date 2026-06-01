'use client'

import { useState } from 'react'
import { Landmark, Copy, Check, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { BANK_TRANSFER_INFO } from '@/lib/domain/bankTransfer'

export function BankTransferCard() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyIban = () => {
    navigator.clipboard
      .writeText(BANK_TRANSFER_INFO.iban.replace(/\s/g, ''))
      .then(() => {
        setCopied(true)
        toast.success(t('paymentPage.bankIbanCopied'))
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  const waHref = `https://wa.me/${BANK_TRANSFER_INFO.whatsapp}?text=${encodeURIComponent(
    t('paymentPage.bankWhatsappPrefill'),
  )}`

  const steps = [
    t('paymentPage.bankStep1'),
    t('paymentPage.bankStep2'),
    t('paymentPage.bankStep3'),
  ]

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-7 shadow-sm">
      {/* Başlık */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-[var(--text-1)]">
              {t('paymentPage.bankTransferTitle')}
            </h4>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {t('paymentPage.bankTransferBadge')}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-3)]">
            {t('paymentPage.bankTransferSubtitle')}
          </p>
        </div>
      </div>

      {/* IBAN kutusu */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
              IBAN
            </span>
            <p className="mt-1 font-mono text-sm sm:text-base font-bold text-[var(--text-1)] break-all select-all">
              {BANK_TRANSFER_INFO.iban}
            </p>
          </div>
          <button
            type="button"
            onClick={copyIban}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-1)] transition hover:bg-[var(--bg-subtle)] active:scale-95"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[var(--text-3)]" />
            )}
            <span className="hidden sm:inline">{t('paymentPage.bankIbanCopy')}</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--border)] pt-3 text-xs">
          <span className="text-[var(--text-3)]">
            {t('paymentPage.bankHolderLabel')}:{' '}
            <span className="font-semibold text-[var(--text-1)]">{BANK_TRANSFER_INFO.holder}</span>
          </span>
          <span className="text-[var(--text-3)]">
            {t('paymentPage.bankNameLabel')}:{' '}
            <span className="font-semibold text-[var(--text-1)]">{BANK_TRANSFER_INFO.bank}</span>
          </span>
        </div>
      </div>

      {/* Adımlar */}
      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
          {t('paymentPage.bankStepsTitle')}
        </p>
        <ol className="mt-2.5 space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--text-2)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Bilgi ver butonları */}
      <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
        >
          <WhatsAppIcon className="h-4 w-4" />
          {t('paymentPage.bankNotifyWhatsapp')}
        </a>
        <a
          href={`mailto:${BANK_TRANSFER_INFO.email}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-xs font-bold text-[var(--text-1)] transition hover:bg-[var(--bg-card)] active:scale-95"
        >
          <Mail className="h-4 w-4 text-[var(--text-3)]" />
          {t('paymentPage.bankNotifyEmail')}
        </a>
      </div>
    </div>
  )
}
