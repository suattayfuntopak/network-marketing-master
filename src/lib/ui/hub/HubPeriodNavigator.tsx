'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  formatMonthLabel,
  formatWeekRangeLabel,
  monthRange,
  rollingWeekRange,
} from '@/lib/utils/hubPeriodRange'
import { useHubPeriodNavigation } from '@/lib/ui/hub/useHubPeriodNavigation'

type HubPeriodNavigatorProps = {
  mode: 'week' | 'month'
  accentClass?: string
}

export function HubPeriodNavigator({ mode, accentClass }: HubPeriodNavigatorProps) {
  const { lang } = useTranslation()
  const { offset, go } = useHubPeriodNavigation()

  const prevOffset = offset - 1
  const nextOffset = offset + 1

  const current =
    mode === 'week'
      ? rollingWeekRange(offset)
      : monthRange(offset)
  const prev =
    mode === 'week'
      ? rollingWeekRange(prevOffset)
      : monthRange(prevOffset)
  const next =
    mode === 'week'
      ? rollingWeekRange(nextOffset)
      : monthRange(nextOffset)

  function labelFor(_o: number, start: Date, end: Date) {
    if (mode === 'week') return formatWeekRangeLabel(start, end, lang)
    return formatMonthLabel(start, lang)
  }

  const currentLabel =
    mode === 'week'
      ? formatWeekRangeLabel(current.startDate, current.endDate, lang)
      : formatMonthLabel(current.startDate, lang)

  return (
    <div className="flex w-full items-stretch gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => go(prevOffset)}
        className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-2 text-[var(--text-3)] transition hover:border-brand/30 hover:text-brand active:scale-95 sm:px-2.5"
        aria-label="Previous period"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <button
        type="button"
        onClick={() => go(prevOffset)}
        className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-2 py-2.5 text-center transition hover:border-brand/25 hover:bg-[var(--bg-subtle)] active:scale-[0.99] sm:px-3"
      >
        <p className="truncate text-[11px] font-semibold text-[var(--text-3)] sm:text-xs">
          {labelFor(prevOffset, prev.startDate, prev.endDate)}
        </p>
      </button>

      <div
        className={clsx(
          'min-w-0 flex-[1.15] rounded-xl border px-2 py-2.5 text-center shadow-sm sm:px-3',
          accentClass ?? 'border-brand/35 bg-brand/10 dark:bg-brand/15',
        )}
      >
        <p className="truncate text-xs font-black text-[var(--text-1)] sm:text-sm">{currentLabel}</p>
      </div>

      <button
        type="button"
        onClick={() => go(nextOffset)}
        className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-2 py-2.5 text-center transition hover:border-brand/25 hover:bg-[var(--bg-subtle)] active:scale-[0.99] sm:px-3"
      >
        <p className="truncate text-[11px] font-semibold text-[var(--text-3)] sm:text-xs">
          {labelFor(nextOffset, next.startDate, next.endDate)}
        </p>
      </button>

      <button
        type="button"
        onClick={() => go(nextOffset)}
        className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-2 text-[var(--text-3)] transition hover:border-brand/30 hover:text-brand active:scale-95 sm:px-2.5"
        aria-label="Next period"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
      </button>
    </div>
  )
}
