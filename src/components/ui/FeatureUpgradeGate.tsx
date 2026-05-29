'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, Lock } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'

interface FeatureUpgradeGateProps {
  /** e.g. team, compliance */
  feature: 'team'
  children: React.ReactNode
  locked: boolean
}

export function FeatureUpgradeGate({ feature, children, locked }: FeatureUpgradeGateProps) {
  const { t } = useTranslation()

  if (!locked) {
    return <>{children}</>
  }

  const title =
    feature === 'team' ? t('shellUi.teamGateTitle') : t('shellUi.featureGateTitle')
  const desc =
    feature === 'team' ? t('shellUi.teamGateDesc') : t('shellUi.featureGateDesc')

  return (
    <div className="relative min-h-[420px] rounded-2xl overflow-hidden">
      <div
        className="pointer-events-none select-none blur-[6px] opacity-40 saturate-50"
        aria-hidden
      >
        {children}
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center p-4 bg-[var(--bg)]/55 backdrop-blur-[2px] ${Z.confirmBackdrop}`}
      >
        <div
          className={`w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl text-center ${Z.confirm}`}
          role="dialog"
          aria-labelledby="feature-gate-title"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500">
            <Lock className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h2 id="feature-gate-title" className="text-lg font-bold text-[var(--text-1)]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{desc}</p>
          <Link
            href="/odeme"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
          >
            <Sparkles className="h-4 w-4" />
            {t('shellUi.upgradeBannerCta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
