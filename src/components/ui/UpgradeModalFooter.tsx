'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { SeePlansClickPhase, SeePlansClickSource } from '@/lib/domain/productEvents'
import { logSeePlansClick } from '@/lib/domain/seePlansAnalytics'
import { ODEME_PLANS_PATH } from '@/lib/domain/paymentRoutes'

export type { SeePlansClickSource }

type UpgradeModalFooterProps = {
  onClose: () => void
  phase: SeePlansClickPhase
  source: SeePlansClickSource
  /** sheet: hesap modalı alt şeridi; compact: UpgradeGate gövdesi içi */
  layout?: 'sheet' | 'compact'
  plansHref?: string
}

export function UpgradeModalFooter({
  onClose,
  phase,
  source,
  layout = 'compact',
  plansHref = ODEME_PLANS_PATH,
}: UpgradeModalFooterProps) {
  const { t } = useTranslation()
  const isSheet = layout === 'sheet'

  return (
    <div
      className={clsx(
        'flex flex-col-reverse gap-2 sm:flex-row',
        isSheet &&
          'shrink-0 border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4',
      )}
    >
      <button
        type="button"
        onClick={onClose}
        className={clsx(
          'flex-1 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition',
          isSheet ? 'px-3 py-2 text-xs sm:text-sm md:text-base' : 'px-3 py-2.5 text-sm',
        )}
      >
        {t('shellUi.accountAlertClose')}
      </button>
      <Link
        href={plansHref}
        onClick={() => {
          logSeePlansClick(phase, source)
          onClose()
        }}
        className={clsx(
          'flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-accent font-bold text-white shadow-md hover:opacity-95 transition',
          isSheet ? 'px-3 py-2 text-xs sm:text-sm md:text-base' : 'px-3 py-2.5 text-sm',
        )}
      >
        <Sparkles className={clsx(isSheet ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4')} />
        {t('shellUi.seePlansCta')}
      </Link>
    </div>
  )
}
