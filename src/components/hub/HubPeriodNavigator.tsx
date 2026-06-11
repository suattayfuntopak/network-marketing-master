'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  calendarDayRange,
  formatDayLabel,
  formatMonthLabel,
  formatMonthLabelCompact,
  formatWeekRangeLabel,
  formatWeekRangeLabelCompact,
  formatYearLabel,
  monthRange,
  rollingWeekRange,
  yearRange,
} from '@/lib/utils/hubPeriodRange'
import { useHubPeriodNavigation } from '@/components/hub/useHubPeriodNavigation'

type HubPeriodNavigatorProps = {
  mode: 'day' | 'week' | 'month' | 'year'
  accentClass?: string
}

function PeriodLabel({
  text,
  compactText,
  className,
}: {
  text: string
  compactText?: string
  className?: string
}) {
  if (!compactText || compactText === text) return <p className={className}>{text}</p>
  return (
    <>
      <p className={clsx(className, 'sm:hidden')}>{compactText}</p>
      <p className={clsx(className, 'hidden sm:block')}>{text}</p>
    </>
  )
}

/**
 * Dönem şeridi: solda/sağda oklar; ortada üç buton (önceki · seçili · sonraki).
 * Oklar ve yan butonlar offset'i ±1 kaydırır — sınırsız geçmiş/gelecek.
 */
export function HubPeriodNavigator({ mode, accentClass }: HubPeriodNavigatorProps) {
  const { lang, t } = useTranslation()
  const { offset, go } = useHubPeriodNavigation()

  const prevOffset = offset - 1
  const nextOffset = offset + 1

  function labelFor(o: number, compact = false) {
    if (mode === 'day') {
      return formatDayLabel(calendarDayRange(o).date, lang, o)
    }
    if (mode === 'week') {
      const r = rollingWeekRange(o)
      return compact
        ? formatWeekRangeLabelCompact(r.startDate, r.endDate, lang)
        : formatWeekRangeLabel(r.startDate, r.endDate, lang)
    }
    if (mode === 'month') {
      const r = monthRange(o)
      return compact ? formatMonthLabelCompact(r.startDate, lang) : formatMonthLabel(r.startDate, lang)
    }
    return formatYearLabel(yearRange(o).year)
  }

  const labelClass =
    mode === 'week' || mode === 'month'
      ? 'truncate text-[10px] leading-tight font-semibold sm:text-xs'
      : 'truncate text-[11px] leading-tight font-semibold sm:text-sm'

  const sideBtnClass =
    'min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-1.5 py-2.5 text-center transition hover:border-brand/25 hover:bg-[var(--bg-subtle)] active:scale-[0.99] sm:px-2'

  const arrowClass =
    'flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-2 text-[var(--text-3)] transition hover:border-brand/30 hover:text-brand active:scale-95 sm:px-2.5'

  return (
    <div
      className="flex w-full items-stretch gap-1.5 sm:gap-2"
      data-testid="hub-period-navigator"
      data-no-swipe="true"
    >
      <button
        type="button"
        onClick={() => go(prevOffset)}
        aria-label={t('dashboard.summaryPeriodPrev')}
        data-testid="hub-period-prev"
        className={arrowClass}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <button type="button" onClick={() => go(prevOffset)} className={sideBtnClass}>
        <PeriodLabel
          text={labelFor(prevOffset)}
          compactText={labelFor(prevOffset, true)}
          className={clsx(labelClass, 'text-[var(--text-3)]')}
        />
      </button>

      <div
        className={clsx(
          'min-w-0 flex-[1.15] rounded-xl border px-1.5 py-2.5 text-center shadow-sm sm:px-2',
          accentClass ?? 'border-brand/35 bg-brand/10 dark:bg-brand/15',
        )}
      >
        <PeriodLabel
          text={labelFor(offset)}
          compactText={labelFor(offset, true)}
          className={clsx(labelClass, 'font-black text-[var(--text-1)]')}
        />
      </div>

      <button type="button" onClick={() => go(nextOffset)} className={sideBtnClass}>
        <PeriodLabel
          text={labelFor(nextOffset)}
          compactText={labelFor(nextOffset, true)}
          className={clsx(labelClass, 'text-[var(--text-3)]')}
        />
      </button>

      <button
        type="button"
        onClick={() => go(nextOffset)}
        aria-label={t('dashboard.summaryPeriodNext')}
        data-testid="hub-period-next"
        className={arrowClass}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
      </button>
    </div>
  )
}
