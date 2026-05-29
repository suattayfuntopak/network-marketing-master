'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarClock, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { getAccountLifecycle } from '@/lib/domain/accountLifecycle'

function formatDateTime(iso: Date, lang: 'tr' | 'en') {
  return iso.toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AccountLifecycleBanner() {
  const pathname = usePathname()
  const { data: ws } = useWorkspace()
  const { t, lang } = useTranslation()

  const lifecycle = useMemo(() => {
    if (!ws || ws.isSuperAdmin) return null
    return getAccountLifecycle({
      licenseType: ws.licenseType,
      licenseExpiresAt: ws.licenseExpiresAt,
      workspaceCreatedAt: ws.workspaceCreatedAt,
      isSuperAdmin: ws.isSuperAdmin,
    })
  }, [ws])

  if (pathname.startsWith('/odeme')) return null
  if (!lifecycle || lifecycle.phase === 'paid') return null

  const registered = formatDateTime(lifecycle.registeredAt, lang)
  const trialEnd = formatDateTime(lifecycle.trialEndsAt, lang)
  const graceEnd = formatDateTime(lifecycle.graceEndsAt, lang)

  const bodyKey =
    lifecycle.phase === 'trial'
      ? 'shellUi.lifecycleTrialBody'
      : lifecycle.phase === 'limited_free'
        ? 'shellUi.lifecycleLimitedBody'
        : 'shellUi.lifecycleLockedBody'

  const tone =
    lifecycle.phase === 'access_locked'
      ? 'border-rose-500/30 bg-rose-500/5'
      : lifecycle.phase === 'limited_free'
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-indigo-500/30 bg-indigo-500/5'

  return (
    <div
      className={`mx-4 mt-3 md:mx-6 rounded-2xl border px-4 py-3.5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between ${tone}`}
    >
      <div className="flex gap-3 min-w-0">
        <CalendarClock className="h-5 w-5 shrink-0 text-[var(--text-2)] mt-0.5" />
        <div className="min-w-0 text-xs leading-relaxed text-[var(--text-2)]">
          <p className="font-semibold text-[var(--text-1)] text-sm mb-1">
            {t('shellUi.lifecycleTitle')}
          </p>
          <p>{t('shellUi.lifecycleRegistered', { date: registered })}</p>
          <p>{t('shellUi.lifecycleTrialEnd', { date: trialEnd })}</p>
          <p className="mt-1">{t(bodyKey, { date: graceEnd })}</p>
        </div>
      </div>
      {(lifecycle.phase === 'trial' ||
        lifecycle.phase === 'limited_free' ||
        lifecycle.phase === 'access_locked') && (
        <Link
          href="/odeme"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#534AB7] px-3.5 py-2 text-xs font-bold text-white hover:opacity-95 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t('shellUi.upgradeBannerCta')}
        </Link>
      )}
    </div>
  )
}
