'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Sparkles, X } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { getAccountLifecycle } from '@/lib/domain/accountLifecycle'
import { Z } from '@/lib/ui/zIndex'

function formatDateTime(date: Date, lang: 'tr' | 'en') {
  return date.toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AccountStatusAlert() {
  const { data: ws } = useWorkspace()
  const { t, lang } = useTranslation()
  const [open, setOpen] = useState(false)

  const lifecycle = useMemo(() => {
    if (!ws || ws.isSuperAdmin || ws.licenseType !== 'free') return null
    return getAccountLifecycle({
      licenseType: ws.licenseType,
      licenseExpiresAt: ws.licenseExpiresAt,
      workspaceCreatedAt: ws.workspaceCreatedAt,
    })
  }, [ws])

  if (!lifecycle || lifecycle.phase === 'paid') return null

  const registered = formatDateTime(lifecycle.registeredAt, lang)
  const accessEnd = formatDateTime(lifecycle.freeAccessEndsAt, lang)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="account-status-breathe group w-full rounded-2xl border-2 border-white/90 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-3.5 py-3 sm:px-4 sm:py-3.5 text-left shadow-lg shadow-red-900/25 transition hover:brightness-105 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
          </span>
          <p className="text-xs sm:text-sm font-bold text-white leading-snug flex-1">
            {t('shellUi.accountAlertTitle')}
          </p>
          <span className="hidden sm:inline text-[11px] font-semibold text-white/90 underline-offset-2 group-hover:underline shrink-0">
            {t('shellUi.accountAlertTap')}
          </span>
        </div>
      </button>

      {open && (
        <div
          className={`fixed inset-0 flex items-center justify-center p-3 sm:p-4 ${Z.confirmBackdrop} bg-black/55 backdrop-blur-sm`}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="account-status-title"
            className={`relative w-full max-w-[min(100%,22rem)] sm:max-w-md max-h-[min(88vh,520px)] overflow-y-auto rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl ${Z.confirm}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)] transition z-10"
              aria-label={t('shellUi.accountAlertClose')}
            >
              <X className="h-4 w-4" strokeWidth={2.25} />
            </button>

            <div className="border-b border-[var(--border)] px-4 pt-4 pb-3 pr-11 sm:px-5 sm:pt-5 sm:pb-4">
              <h2
                id="account-status-title"
                className="text-sm sm:text-base font-black uppercase tracking-wide text-[var(--text-1)]"
              >
                {t('shellUi.accountModalTitle')}
              </h2>
            </div>

            <div className="space-y-4 px-4 py-3.5 sm:px-5 sm:py-4 text-xs sm:text-sm leading-relaxed text-[var(--text-2)]">
              <ul className="space-y-1.5 list-disc pl-4">
                <li>{t('shellUi.accountModalRegistered', { date: registered })}</li>
                <li>{t('shellUi.accountModalFreeAccess', { date: accessEnd })}</li>
              </ul>

              <div>
                <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[var(--text-1)] mb-1.5">
                  {t('shellUi.accountModalSectionPlan')}
                </h3>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li>{t('shellUi.accountModalTrialBullets')}</li>
                  <li>{t('shellUi.accountModalTeamBullets')}</li>
                </ul>
              </div>

              <p className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-[11px] sm:text-xs text-[var(--text-2)]">
                {t('shellUi.accountModalFootnote', { date: accessEnd })}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
              >
                {t('shellUi.accountAlertClose')}
              </button>
              <Link
                href="/odeme"
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-3 py-2 text-xs sm:text-sm font-bold text-white shadow-md hover:opacity-95 transition"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t('shellUi.upgradeBannerCta')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
