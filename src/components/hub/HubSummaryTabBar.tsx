'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { crownSolidMap, type ButtonColor } from '@/components/ui/SquareButton'
import {
  HUB_PERIOD_TABS,
  type HubPeriodTab,
  parseSummaryTab,
} from '@/lib/domain/hubPeriodPrefetch'
import {
  HUB_PERIOD_TAB_LABEL_KEYS,
  hubPeriodTabLabel,
} from '@/lib/domain/pulsePeriodLabels'

export { HUB_PERIOD_TABS, parseSummaryTab, HUB_PERIOD_TAB_LABEL_KEYS, hubPeriodTabLabel }
export type { HubPeriodTab }

/** @deprecated Use HubPeriodTab — kept for field summary imports */
export type HubSummaryTab = HubPeriodTab

/** Mobilde sığması için kısa etiket: 1 / 7 / 30 / 365 / ∞ */
const HUB_PERIOD_TAB_SHORT: Record<HubPeriodTab, string> = {
  daily: '1',
  weekly: '7',
  monthly: '30',
  yearly: '365',
  all: '∞',
}

const HUB_TAB_PANO_COLORS: Record<HubPeriodTab, ButtonColor> = {
  daily: 'indigo',
  weekly: 'teal',
  monthly: 'coral',
  yearly: 'amber',
  all: 'purple',
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
            data-testid={`hub-summary-tab-${tab}`}
            onClick={() => onChange(tab)}
            className={clsx(
              'min-w-0 flex-1 shrink-0 rounded-lg px-1.5 py-2 text-center font-bold transition sm:px-3',
              tab === 'all' ? 'text-base sm:text-sm' : 'text-xs',
              isActive
                ? clsx(crownSolidMap[panoColor], 'text-white shadow-sm border border-white/20')
                : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
            )}
          >
            <span
              className={clsx(
                'sm:hidden tabular-nums leading-none',
                tab === 'all' ? 'text-lg font-black' : 'text-sm',
              )}
            >
              {HUB_PERIOD_TAB_SHORT[tab]}
            </span>
            <span className="hidden sm:inline">{t(HUB_PERIOD_TAB_LABEL_KEYS[tab])}</span>
          </button>
        )
      })}
    </div>
  )
}

