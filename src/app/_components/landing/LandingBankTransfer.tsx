'use client'

import { useState } from 'react'
import { Landmark, Copy, Check, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { BANK_TRANSFER_INFO } from '@/lib/domain/bankTransfer'

/**
 * Landing sayfası havale/EFT kartı — ödeme sayfasındaki BankTransferCard ile aynı
 * bilgiyi gösterir ama landing estetiğine (slate/zinc + dark variant) uyar.
 * Kaldırmak için BANK_TRANSFER_ENABLED'ı false yap (LandingPricing içinde sarılı).
 */
export function LandingBankTransfer() {
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
    <div className="max-w-6xl mx-auto rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/[0.03] p-6 sm:p-8">
      {/* Başlık */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('paymentPage.bankTransferTitle')}
            </h3>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
              {t('paymentPage.bankTransferBadge')}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
            {t('paymentPage.bankTransferSubtitle')}
          </p>
        </div>
      </div>

      {/* İki sütun */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2 items-stretch">
        {/* Sol: IBAN */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                IBAN
              </span>
              <p className="mt-1.5 font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white break-all select-all">
                {BANK_TRANSFER_INFO.iban}
              </p>
            </div>
            <button
              type="button"
              onClick={copyIban}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-700 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-95 cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              )}
              <span className="hidden sm:inline">{t('paymentPage.bankIbanCopy')}</span>
            </button>
          </div>

          <div className="mt-4 pt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200 dark:border-white/[0.06] text-xs">
            <span className="text-slate-500 dark:text-zinc-400">
              {t('paymentPage.bankHolderLabel')}:{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{BANK_TRANSFER_INFO.holder}</span>
            </span>
            <span className="text-slate-500 dark:text-zinc-400">
              {t('paymentPage.bankNameLabel')}:{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{BANK_TRANSFER_INFO.bank}</span>
            </span>
          </div>
        </div>

        {/* Sağ: adımlar + butonlar */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {t('paymentPage.bankStepsTitle')}
          </p>
          <ol className="mt-3 space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2.5">
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-95"
            >
              <Mail className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
              {t('paymentPage.bankNotifyEmail')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
