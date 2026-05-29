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
        className="account-status-breathe group w-full rounded-2xl border-2 border-white/90 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3.5 text-left shadow-lg shadow-red-900/25 transition hover:brightness-105 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/90">
              {t('shellUi.accountAlertEyebrow')}
            </p>
            <p className="text-sm font-bold text-white leading-snug">
              {t('shellUi.accountAlertTitle')}
            </p>
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-white/90 underline-offset-2 group-hover:underline">
            {t('shellUi.accountAlertTap')}
          </span>
        </div>
      </button>

      {open && (
        <div
          className={`fixed inset-0 flex items-center justify-center p-4 ${Z.confirmBackdrop} bg-black/55 backdrop-blur-sm`}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="account-status-title"
            className={`relative w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl ${Z.confirm}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-3)] hover:bg-[var(--bg-subtle)] transition"
              aria-label={t('shellUi.accountAlertClose')}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-[var(--border)] bg-gradient-to-r from-red-600/10 to-red-500/5 px-6 pt-6 pb-4 pr-14">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                {t('shellUi.accountAlertEyebrow')}
              </p>
              <h2
                id="account-status-title"
                className="mt-1 text-lg font-bold text-[var(--text-1)]"
              >
                {t('shellUi.accountModalTitle')}
              </h2>
            </div>

            <div className="space-y-5 px-6 py-5 text-sm leading-relaxed text-[var(--text-2)]">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-1)] mb-2">
                  {t('shellUi.accountModalSectionInfo')}
                </h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>{t('shellUi.accountModalRegistered', { date: registered })}</li>
                  <li>
                    {t('shellUi.accountModalFreeAccess', { date: accessEnd })}
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-1)] mb-2">
                  {t('shellUi.accountModalSectionPlan')}
                </h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>{t('shellUi.accountModalTrialBullets')}</li>
                  <li>{t('shellUi.accountModalTeamBullets')}</li>
                </ul>
              </section>

              <p className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-3 text-xs text-[var(--text-2)]">
                {t('shellUi.accountModalFootnote', { date: accessEnd })}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-[var(--border)] px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
              >
                {t('shellUi.accountAlertClose')}
              </button>
              <Link
                href="/odeme"
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
              >
                <Sparkles className="h-4 w-4" />
                {t('shellUi.upgradeBannerCta')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
