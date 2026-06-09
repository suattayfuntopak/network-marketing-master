'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'

export const HUB_PERIOD_TABS = ['daily', 'weekly', 'monthly', 'yearly'] as const
export type HubPeriodTab = (typeof HUB_PERIOD_TABS)[number]

/** @deprecated Use HubPeriodTab — kept for field summary imports */
export type HubSummaryTab = HubPeriodTab

const TAB_KEYS: Record<HubPeriodTab, string> = {
  daily: 'dashboard.summaryTabDaily',
  weekly: 'dashboard.summaryTabWeekly',
  monthly: 'dashboard.summaryTabMonthly',
  yearly: 'dashboard.summaryTabYearly',
}

type HubSummaryTabBarProps = {
  active: HubPeriodTab
  onChange: (tab: HubPeriodTab) => void
}

export function HubSummaryTabBar({ active, onChange }: HubSummaryTabBarProps) {
  const { t } = useTranslation()

  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1 scrollbar-none"
      role="tablist"
      aria-label={t('dashboard.summaryTabList')}
    >
      {HUB_PERIOD_TABS.map(tab => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={clsx(
            'min-w-[4.5rem] flex-1 shrink-0 rounded-lg px-2 py-2 text-center text-[11px] font-bold transition sm:min-w-0 sm:px-3 sm:text-xs',
            active === tab
              ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
          )}
        >
          {t(TAB_KEYS[tab])}
        </button>
      ))}
    </div>
  )
}

export function parseSummaryTab(raw: string | null): HubPeriodTab {
  if (raw === 'all') return 'daily'
  if (raw && (HUB_PERIOD_TABS as readonly string[]).includes(raw)) {
    return raw as HubPeriodTab
  }
  return 'daily'
}
