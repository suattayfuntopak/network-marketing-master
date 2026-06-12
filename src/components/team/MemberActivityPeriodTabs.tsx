'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { SheetActivityPeriod } from '@/lib/domain/pulse'
import {
  PULSE_PERIOD_OPTIONS,
  PULSE_PERIOD_SHORT,
  sheetActivityPeriodLabel,
} from '@/lib/domain/pulsePeriodLabels'

export {
  sheetActivityPeriodLabel,
  sheetPeriodToHubTab,
} from '@/lib/domain/pulsePeriodLabels'

export const MEMBER_ACTIVITY_PERIODS = PULSE_PERIOD_OPTIONS

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
      {MEMBER_ACTIVITY_PERIODS.map(period => {
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
              {PULSE_PERIOD_SHORT[period]}
            </span>
            <span className="hidden sm:inline">{sheetActivityPeriodLabel(t, period)}</span>
          </button>
        )
      })}
    </div>
  )
}
