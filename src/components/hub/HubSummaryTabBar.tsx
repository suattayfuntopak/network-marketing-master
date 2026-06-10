'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { crownSolidMap, type ButtonColor } from '@/components/ui/SquareButton'
import {
  HUB_PERIOD_TABS,
  type HubPeriodTab,
  parseSummaryTab,
} from '@/lib/domain/hubPeriodPrefetch'

export { HUB_PERIOD_TABS, parseSummaryTab }
export type { HubPeriodTab }

/** @deprecated Use HubPeriodTab — kept for field summary imports */
export type HubSummaryTab = HubPeriodTab

export const HUB_PERIOD_TAB_LABEL_KEYS: Record<HubPeriodTab, string> = {
  daily: 'dashboard.summaryTabDaily',
  weekly: 'dashboard.summaryTabWeekly',
  monthly: 'dashboard.summaryTabMonthly',
  yearly: 'dashboard.summaryTabYearly',
}

/** Pano launcher ilk 4 kutu — Hedefim, Saha Özetim, Saha Radarı, Boru Hattı */
const HUB_TAB_PANO_COLORS: Record<HubPeriodTab, ButtonColor> = {
  daily: 'indigo',
  weekly: 'teal',
  monthly: 'coral',
  yearly: 'amber',
}

export function hubPeriodTabLabel(
  t: (key: string) => string,
  tab: HubPeriodTab,
): string {
  return t(HUB_PERIOD_TAB_LABEL_KEYS[tab])
}

type HubSummaryTabBarProps = {
  active: HubPeriodTab
  onChange: (tab: HubPeriodTab) => void
}

export function HubSummaryTabBar({ active, onChange }: HubSummaryTabBarProps) {
  const { t } = useTranslation()

  return (
    <div
      className="horizontal-scroll-lock no-swipe flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1 scrollbar-none"
      role="tablist"
      aria-label={t('dashboard.summaryTabList')}
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
    >
      {HUB_PERIOD_TABS.map(tab => {
        const isActive = active === tab
        const panoColor = HUB_TAB_PANO_COLORS[tab]
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={clsx(
              'min-w-[4.5rem] flex-1 shrink-0 rounded-lg px-2 py-2 text-center text-[11px] font-bold transition sm:min-w-0 sm:px-3 sm:text-xs',
              isActive
                ? clsx(crownSolidMap[panoColor], 'text-white shadow-sm border border-white/20')
                : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
            )}
          >
            {t(HUB_PERIOD_TAB_LABEL_KEYS[tab])}
          </button>
        )
      })}
    </div>
  )
}

