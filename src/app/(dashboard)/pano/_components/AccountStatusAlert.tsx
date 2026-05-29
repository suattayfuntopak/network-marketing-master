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
        className="account-status-breathe group w-full rounded-2xl border-2 border-white bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-3.5 py-3 sm:px-4 sm:py-3.5 text-left shadow-lg shadow-red-900/40 transition hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
          </span>
          <p className="flex-1 text-[11px] sm:text-xs font-black uppercase tracking-wide text-white leading-snug">
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
            className={`relative flex w-full max-w-[min(100%,22rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl sm:max-w-md sm:rounded-3xl max-h-[min(88vh,520px)] md:max-w-lg md:max-h-none ${Z.confirm}`}
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

            <div className="border-b border-[var(--border)] px-4 pt-4 pb-3 pr-11 sm:px-5 sm:pt-5 sm:pb-4 md:px-6 md:pt-6 md:pb-4">
              <h2
                id="account-status-title"
                className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide text-[var(--text-1)]"
              >
                {t('shellUi.accountModalTitle')}
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 text-xs leading-relaxed text-[var(--text-2)] sm:px-5 sm:py-4 sm:text-sm md:flex-none md:overflow-visible md:space-y-2 md:px-6 md:py-4 md:text-base">
              <ul className="space-y-1.5 list-disc pl-4 md:space-y-1">
                <li>{t('shellUi.accountModalRegistered', { date: registered })}</li>
                <li className="md:hidden">
                  {t('shellUi.accountModalFreeAccess', { date: accessEnd })}
                </li>
                <li className="hidden md:list-item">
                  {t('shellUi.accountModalFreeAccessDesktop', { date: accessEnd })}
                </li>
              </ul>

              <div>
                <h3 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wide text-[var(--text-1)] mb-1.5 md:mb-1">
                  {t('shellUi.accountModalSectionPlan')}
                </h3>
                <ul className="space-y-1.5 list-disc pl-4 md:space-y-1">
                  <li className="md:hidden">{t('shellUi.accountModalTrialBullets')}</li>
                  <li className="hidden md:list-item">
                    {t('shellUi.accountModalTrialBulletsDesktop')}
                  </li>
                  <li className="md:hidden">{t('shellUi.accountModalTeamBullets')}</li>
                  <li className="hidden md:list-item">
                    {t('shellUi.accountModalTeamBulletsDesktop')}
                  </li>
                </ul>
              </div>

              <p className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-[11px] sm:text-xs text-[var(--text-2)] md:py-2.5 md:text-sm">
                <span className="md:hidden">
                  {t('shellUi.accountModalFootnote', { date: accessEnd })}
                </span>
                <span className="hidden md:inline">
                  {t('shellUi.accountModalFootnoteDesktop', { date: accessEnd })}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 sm:flex-row sm:px-5 sm:py-3.5 md:px-6 md:py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs sm:text-sm md:text-base font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
              >
                {t('shellUi.accountAlertClose')}
              </button>
              <Link
                href="/odeme"
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-3 py-2 text-xs sm:text-sm md:text-base font-bold text-white shadow-md hover:opacity-95 transition"
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
