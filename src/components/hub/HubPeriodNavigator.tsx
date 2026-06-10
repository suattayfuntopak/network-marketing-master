'use client'

import { useCallback, useRef } from 'react'
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
import { useHubPeriodSwipe } from '@/components/hub/useHubPeriodSwipe'

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
  if (!compactText || compactText === text) {
    return <p className={className}>{text}</p>
  }
  return (
    <>
      <p className={clsx(className, 'sm:hidden')}>{compactText}</p>
      <p className={clsx(className, 'hidden sm:block')}>{text}</p>
    </>
  )
}

export function HubPeriodNavigator({ mode, accentClass }: HubPeriodNavigatorProps) {
  const { lang } = useTranslation()
  const { offset, go } = useHubPeriodNavigation()
  const containerRef = useRef<HTMLDivElement>(null)

  const prevOffset = offset - 1
  const nextOffset = offset + 1

  const labelFor = useCallback(
    (o: number, compact = false) => {
      if (mode === 'day') {
        const r = calendarDayRange(o)
        return formatDayLabel(r.date, lang, o)
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
      const r = yearRange(o)
      return formatYearLabel(r.year, lang, o)
    },
    [lang, mode],
  )

  const goPrev = useCallback(() => go(prevOffset), [go, prevOffset])
  const goNext = useCallback(() => go(nextOffset), [go, nextOffset])

  const { dragX, isDragging } = useHubPeriodSwipe(containerRef, {
    onSwipePrev: goPrev,
    onSwipeNext: goNext,
  })

  const currentLabel = labelFor(offset)
  const currentCompact = labelFor(offset, true)
  const prevLabel = labelFor(prevOffset)
  const prevCompact = labelFor(prevOffset, true)
  const nextLabel = labelFor(nextOffset)
  const nextCompact = labelFor(nextOffset, true)

  const slotLabelClass =
    mode === 'week' || mode === 'month'
      ? 'text-[9px] font-semibold leading-tight text-[var(--text-3)] sm:text-xs'
      : 'text-[10px] font-semibold leading-tight text-[var(--text-3)] sm:text-xs'

  const centerLabelClass =
    mode === 'week' || mode === 'month'
      ? 'text-[10px] font-black leading-tight text-[var(--text-1)] sm:text-sm'
      : 'text-xs font-black leading-tight text-[var(--text-1)] sm:text-sm'

  return (
    <div
      ref={containerRef}
      className="no-swipe w-full touch-pan-x select-none"
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
      style={{
        transform: dragX ? `translateX(${dragX}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="flex w-full items-stretch gap-1 sm:gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-1.5 text-[var(--text-3)] transition hover:border-brand/30 hover:text-brand active:scale-95 sm:px-2.5"
          aria-label="Previous period"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <button
          type="button"
          onClick={goPrev}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-1 py-2 text-center transition hover:border-brand/25 hover:bg-[var(--bg-subtle)] active:scale-[0.99] sm:px-3 sm:py-2.5"
        >
          <PeriodLabel text={prevLabel} compactText={prevCompact} className={slotLabelClass} />
        </button>

        <div
          className={clsx(
            'min-w-0 flex-[1.15] rounded-xl border px-1 py-2 text-center shadow-sm sm:px-3 sm:py-2.5',
            accentClass ?? 'border-brand/35 bg-brand/10 dark:bg-brand/15',
          )}
        >
          <PeriodLabel text={currentLabel} compactText={currentCompact} className={centerLabelClass} />
        </div>

        <button
          type="button"
          onClick={goNext}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-1 py-2 text-center transition hover:border-brand/25 hover:bg-[var(--bg-subtle)] active:scale-[0.99] sm:px-3 sm:py-2.5"
        >
          <PeriodLabel text={nextLabel} compactText={nextCompact} className={slotLabelClass} />
        </button>

        <button
          type="button"
          onClick={goNext}
          className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-1.5 text-[var(--text-3)] transition hover:border-brand/30 hover:text-brand active:scale-95 sm:px-2.5"
          aria-label="Next period"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}
