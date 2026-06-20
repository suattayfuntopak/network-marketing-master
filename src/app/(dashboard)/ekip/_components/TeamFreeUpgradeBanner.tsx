'use client'

import Link from 'next/link'
import { Sparkles, Users } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { UpgradeGate } from '@/components/ui/UpgradeGate'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import type { ProUpgradeCtaSource } from '@/lib/domain/planFeatureMatrix'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'

type Props = {
  /** Plus kullanıcı → Pro yükseltme; diğerleri → genel planlar. */
  upgradeTarget?: 'general' | 'pro'
  analyticsSource?: ProUpgradeCtaSource
}

export function TeamFreeUpgradeBanner({
  upgradeTarget = 'general',
  analyticsSource = 'ekip_summary',
}: Props) {
  const { t } = useTranslation()

  if (upgradeTarget === 'general') {
    return <UpgradeGate variant="banner" />
  }

  return (
    <div className="rounded-2xl border border-pink-500/25 bg-gradient-to-br from-pink-50/80 to-[var(--bg-card)] p-4 sm:p-5 dark:border-pink-500/20 dark:from-pink-950/10 dark:to-[var(--bg-card)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
          <Users className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-1)]">{t('shellUi.teamProUpgradeTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">{t('shellUi.teamProUpgradeDesc')}</p>
          <Link
            href="/odeme?plan=pro"
            onClick={() => {
              void logProductEventAction(PRODUCT_EVENTS.proUpgradeCtaClick, {
                source: analyticsSource,
                feature: 'team_pulse',
              })
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('shellUi.teamProUpgradeCta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
