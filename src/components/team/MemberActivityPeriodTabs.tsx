'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  hubPeriodTabLabel,
  type HubPeriodTab,
} from '@/components/hub/HubSummaryTabBar'
import type { SheetActivityPeriod } from '@/lib/domain/pulse'

const SHEET_PERIODS: SheetActivityPeriod[] = ['today', '7d', '30d', 'ytd', 'all']

const SHEET_TO_HUB_TAB: Record<SheetActivityPeriod, HubPeriodTab> = {
  today: 'daily',
  '7d': 'weekly',
  '30d': 'monthly',
  ytd: 'yearly',
  all: 'all',
}

const SHEET_PERIOD_SHORT: Record<SheetActivityPeriod, string> = {
  today: '1',
  '7d': '7',
  '30d': '30',
  ytd: '365',
  all: '∞',
}

export function sheetPeriodToHubTab(period: SheetActivityPeriod): HubPeriodTab {
  return SHEET_TO_HUB_TAB[period]
}

export function sheetActivityPeriodLabel(
  t: (key: string) => string,
  period: SheetActivityPeriod,
): string {
  return hubPeriodTabLabel(t, SHEET_TO_HUB_TAB[period])
}

export const MEMBER_ACTIVITY_PERIODS = SHEET_PERIODS

type Props = {
  active: SheetActivityPeriod
  onChange: (period: SheetActivityPeriod) => void
}

/** Saha Özetim HubSummaryTabBar ile aynı boyut/ritim — masaüstü metin, mobil 1/7/30/365/∞ */
export function MemberActivityPeriodTabs({ active, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className="horizontal-scroll-lock no-swipe flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1 scrollbar-none mb-4"
      role="tablist"
      aria-label={t('team.activitySheetSubtitle')}
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
    >
      {SHEET_PERIODS.map(period => {
        const isActive = active === period
        return (
          <button
            key={period}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(period)}
            className={clsx(
              'min-w-0 flex-1 shrink-0 rounded-lg px-1.5 py-2 text-center font-bold transition sm:px-3',
              period === 'all' ? 'text-base sm:text-sm' : 'text-xs',
              isActive
                ? 'bg-[var(--bg-card)] text-brand dark:text-white shadow-sm border border-[var(--border)]'
                : 'text-[var(--text-3)] dark:text-white/80 hover:text-[var(--text-2)]',
            )}
          >
            <span
              className={clsx(
                'sm:hidden tabular-nums leading-none',
                period === 'all' ? 'text-lg font-black' : 'text-sm',
              )}
            >
              {SHEET_PERIOD_SHORT[period]}
            </span>
            <span className="hidden sm:inline">{sheetActivityPeriodLabel(t, period)}</span>
          </button>
        )
      })}
    </div>
  )
}
