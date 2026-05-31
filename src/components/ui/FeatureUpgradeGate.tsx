'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Sparkles, ArrowRight, Lock, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface FeatureUpgradeGateProps {
  feature: 'team'
  children: React.ReactNode
  locked: boolean
}

const backdropClass = `fixed inset-0 flex items-center justify-center p-4 ${Z.confirmBackdrop} bg-black/55 backdrop-blur-sm`

export function FeatureUpgradeGate({ feature, children, locked }: FeatureUpgradeGateProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useBodyScrollLock(locked)

  useEffect(() => setMounted(true), [])

  if (!locked) {
    return <>{children}</>
  }

  const title =
    feature === 'team' ? t('shellUi.teamGateTitle') : t('shellUi.featureGateTitle')
  const desc =
    feature === 'team' ? t('shellUi.teamGateDesc') : t('shellUi.featureGateDesc')

  const dismissedCard = (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center shadow-2xl">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
        <Lock className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="text-base font-bold text-[var(--text-1)]">{title}</h2>
      <p className="mt-2 text-xs leading-relaxed text-[var(--text-2)]">{desc}</p>
      <Link
        href="/odeme"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
      >
        <Sparkles className="h-4 w-4" />
        {t('shellUi.upgradeBannerCta')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )

  const overlay = dismissed ? (
    <div className={backdropClass} aria-hidden={false}>
      <div className={`w-full max-w-md px-1 ${Z.confirm}`}>{dismissedCard}</div>
    </div>
  ) : (
    <div
      className={backdropClass}
      role="presentation"
      onClick={() => setDismissed(true)}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-2xl text-center ${Z.confirm}`}
        role="dialog"
        aria-labelledby="feature-gate-title"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:bg-[var(--border)] hover:text-[var(--text-1)] transition"
          aria-label={t('shellUi.accountAlertClose')}
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500">
          <Lock className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h2 id="feature-gate-title" className="text-base sm:text-lg font-bold text-[var(--text-1)] pr-8">
          {title}
        </h2>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--text-2)]">{desc}</p>
        <Link
          href="/odeme"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
        >
          <Sparkles className="h-4 w-4" />
          {t('shellUi.upgradeBannerCta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(overlay, document.body)
}
