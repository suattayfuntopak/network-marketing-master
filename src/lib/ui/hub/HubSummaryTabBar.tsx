'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'

export const HUB_SUMMARY_TABS = ['daily', 'weekly', 'monthly', 'yearly', 'all'] as const
export type HubSummaryTab = (typeof HUB_SUMMARY_TABS)[number]

const TAB_KEYS: Record<HubSummaryTab, string> = {
  daily: 'dashboard.summaryTabDaily',
  weekly: 'dashboard.summaryTabWeekly',
  monthly: 'dashboard.summaryTabMonthly',
  yearly: 'dashboard.summaryTabYearly',
  all: 'dashboard.summaryTabAllTime',
}

type HubSummaryTabBarProps = {
  active: HubSummaryTab
  onChange: (tab: HubSummaryTab) => void
}

export function HubSummaryTabBar({ active, onChange }: HubSummaryTabBarProps) {
  const { t } = useTranslation()

  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1 scrollbar-none"
      role="tablist"
      aria-label={t('dashboard.summaryTabList')}
    >
      {HUB_SUMMARY_TABS.map(tab => (
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

export function parseSummaryTab(raw: string | null): HubSummaryTab {
  if (raw && (HUB_SUMMARY_TABS as readonly string[]).includes(raw)) {
    return raw as HubSummaryTab
  }
  return 'daily'
}
