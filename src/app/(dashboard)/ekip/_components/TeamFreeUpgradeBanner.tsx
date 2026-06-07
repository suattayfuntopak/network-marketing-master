'use client'

import Link from 'next/link'
import { Sparkles, Users } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function TeamFreeUpgradeBanner() {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-[#EEEDFE]/80 to-[var(--bg-card)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
          <Users className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-1)]">{t('shellUi.teamFreeBannerTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">{t('shellUi.teamFreeBannerDesc')}</p>
          <Link
            href="/odeme"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('shellUi.upgradeBannerCta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
