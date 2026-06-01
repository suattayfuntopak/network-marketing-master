'use client'

import { useState } from 'react'
import { Landmark, Copy, Check, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { BANK_TRANSFER_INFO } from '@/lib/domain/bankTransfer'

type Variant = 'dashboard' | 'landing'

interface BankTransferCardProps {
  /** `dashboard` → ödeme sayfası (CSS değişkenleri); `landing` → tanıtım sayfası (slate/zinc). */
  variant?: Variant
  /**
   * Verilirse "Ödedim, Bildir" butonu bunu çağırır (giriş yapmış kullanıcı → super admin'e
   * otomatik e-posta). Verilmezse e-posta butonu klasik `mailto:` olur (anonim ziyaretçi).
   */
  onNotify?: () => Promise<boolean>
}

/** Variant'a göre nötr palet; vurgu (emerald + WhatsApp yeşili) her ikisinde ortak. */
function tokens(variant: Variant) {
  if (variant === 'landing') {
    return {
      card: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/[0.03]',
      innerBorder: 'border-slate-200 dark:border-white/[0.06]',
      innerBg: 'bg-white dark:bg-white/[0.02]',
      text1: 'text-slate-900 dark:text-white',
      text2: 'text-slate-600 dark:text-zinc-300',
      text3: 'text-slate-500 dark:text-zinc-400',
      muted: 'text-slate-400 dark:text-zinc-500',
      btn: 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]',
    }
  }
  return {
    card: 'border-[var(--border)] bg-[var(--bg-card)] shadow-sm',
    innerBorder: 'border-[var(--border)]',
    innerBg: 'bg-[var(--bg-subtle)]',
    text1: 'text-[var(--text-1)]',
    text2: 'text-[var(--text-2)]',
    text3: 'text-[var(--text-3)]',
    muted: 'text-[var(--text-3)]',
    btn: 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-[var(--bg-subtle)]',
  }
}

export function BankTransferCard({ variant = 'dashboard', onNotify }: BankTransferCardProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notified, setNotified] = useState(false)
  const tk = tokens(variant)

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

  const handleNotify = async () => {
    if (!onNotify || notifying || notified) return
    setNotifying(true)
    try {
      const ok = await onNotify()
      if (ok) {
        setNotified(true)
        toast.success(t('paymentPage.bankNotifiedToast'))
      } else {
        toast.error(t('paymentPage.bankNotifyError'))
      }
    } catch {
      toast.error(t('paymentPage.bankNotifyError'))
    } finally {
      setNotifying(false)
    }
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
    <div className={`max-w-6xl mx-auto rounded-3xl border p-6 sm:p-8 ${tk.card}`}>
      {/* Başlık */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base font-extrabold ${tk.text1}`}>
              {t('paymentPage.bankTransferTitle')}
            </h3>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
              {t('paymentPage.bankTransferBadge')}
            </span>
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${tk.text3}`}>
            {t('paymentPage.bankTransferSubtitle')}
          </p>
        </div>
      </div>

      {/* İki sütun */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2 items-stretch">
        {/* Sol: IBAN + (masaüstü) QR */}
        <div className={`flex flex-col rounded-2xl border p-5 ${tk.innerBorder} ${tk.innerBg}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${tk.muted}`}>
                  IBAN
                </span>
                <button
                  type="button"
                  onClick={copyIban}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${tk.btn}`}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className={`h-3.5 w-3.5 ${tk.muted}`} />
                  )}
                  <span className="hidden sm:inline">{t('paymentPage.bankIbanCopy')}</span>
                </button>
              </div>
              <p
                className={`mt-2 font-mono text-[13px] sm:text-base font-bold tracking-tight whitespace-nowrap overflow-x-auto scrollbar-none select-all ${tk.text1}`}
              >
                {BANK_TRANSFER_INFO.iban}
              </p>
            </div>

            {/* QR — yalnızca masaüstü: telefon bankacılığıyla ekranı taramak için */}
            <div className="hidden lg:flex flex-col items-center gap-1 shrink-0">
              <div className="rounded-lg bg-white p-1.5 ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/iban-qr.svg" alt="IBAN QR" className="h-[76px] w-[76px]" />
              </div>
              <span className={`text-[9px] font-semibold ${tk.muted}`}>
                {t('paymentPage.bankQrCaption')}
              </span>
            </div>
          </div>

          <div className={`mt-4 pt-4 flex flex-wrap gap-x-6 gap-y-1 border-t text-xs ${tk.innerBorder}`}>
            <span className={tk.text3}>
              {t('paymentPage.bankHolderLabel')}:{' '}
              <span className={`font-semibold ${tk.text1}`}>{BANK_TRANSFER_INFO.holder}</span>
            </span>
            <span className={tk.text3}>
              {t('paymentPage.bankNameLabel')}:{' '}
              <span className={`font-semibold ${tk.text1}`}>{BANK_TRANSFER_INFO.bank}</span>
            </span>
          </div>
        </div>

        {/* Sağ: adımlar + bilgi ver butonları */}
        <div className={`flex flex-col rounded-2xl border p-5 ${tk.innerBorder} ${tk.innerBg}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wider ${tk.muted}`}>
            {t('paymentPage.bankStepsTitle')}
          </p>
          <ol className="mt-3 space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-xs leading-relaxed ${tk.text2}`}>
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

            {onNotify ? (
              <button
                type="button"
                onClick={handleNotify}
                disabled={notifying || notified}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-70 disabled:cursor-default cursor-pointer ${tk.btn}`}
              >
                {notifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : notified ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Mail className={`h-4 w-4 ${tk.muted}`} />
                )}
                {t('paymentPage.bankNotifyPaid')}
              </button>
            ) : (
              <a
                href={`mailto:${BANK_TRANSFER_INFO.email}`}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition active:scale-95 ${tk.btn}`}
              >
                <Mail className={`h-4 w-4 ${tk.muted}`} />
                {t('paymentPage.bankNotifyEmail')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
