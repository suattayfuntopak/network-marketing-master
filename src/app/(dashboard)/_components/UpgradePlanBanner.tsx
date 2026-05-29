'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'

/** Shown during free trial or post-trial free — links to paid plans. */
export function UpgradePlanBanner() {
  const pathname = usePathname()
  const { data: ws } = useWorkspace()
  const { t } = useTranslation()

  if (pathname.startsWith('/odeme')) return null
  if (!ws || ws.isSuperAdmin) return null
  if (ws.licenseType !== 'free') return null

  const showTrial = ws.isTrialActive

  return (
    <div className="mx-4 mb-4 md:mx-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-1)]">
            {showTrial ? t('shellUi.upgradeBannerTrialTitle') : t('shellUi.upgradeBannerExpiredTitle')}
          </p>
          <p className="text-xs text-[var(--text-2)] mt-0.5 leading-relaxed max-w-xl">
            {showTrial ? t('shellUi.upgradeBannerTrialDesc') : t('shellUi.upgradeBannerExpiredDesc')}
          </p>
        </div>
      </div>
      <Link
        href="/odeme"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
      >
        {t('shellUi.upgradeBannerCta')}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
