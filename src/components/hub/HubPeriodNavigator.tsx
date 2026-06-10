'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
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

/**
 * Dönem şeridi: sabit ◀ ▶ okların ALTINDAN akan, parmakla serbestçe kaydırılan
 * (native scroll-snap → momentum + snap bedava) bir şerit. Kullanıcı istediği
 * dönemde durur; snap o döneme oturunca offset güncellenir ve metrikleri yüklenir.
 * Oklar tek tek adım için aynen çalışır.
 */
const RANGE = 24 // görünür offset penceresi (-24..+24) — pratikte sonsuz his

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

export function HubPeriodNavigator({ mode, accentClass }: HubPeriodNavigatorProps) {
  const { lang, t } = useTranslation()
  const { offset, go } = useHubPeriodNavigation()

  const scrollRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingRef = useRef(false) // programatik scroll sırasında settle'ı bastır
  const settledByScrollRef = useRef<number | null>(null) // offset değişimi scroll'dan mı geldi

  const offsets = useMemo(() => {
    const arr: number[] = []
    for (let o = -RANGE; o <= RANGE; o++) arr.push(o)
    return arr
  }, [])

  const labelFor = useCallback(
    (o: number, compact = false) => {
      if (mode === 'day') return formatDayLabel(calendarDayRange(o).date, lang, o)
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
      return formatYearLabel(yearRange(o).year, lang, o)
    },
    [lang, mode],
  )

  const centerOffset = useCallback((o: number, smooth: boolean) => {
    const el = scrollRef.current
    const slot = slotRefs.current.get(o)
    if (!el || !slot) return
    const target = slot.offsetLeft - (el.clientWidth - slot.clientWidth) / 2
    syncingRef.current = true
    el.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' })
    window.setTimeout(() => {
      syncingRef.current = false
    }, smooth ? 450 : 80)
  }, [])

  // İlk montaj: mevcut offset'i ortala (layout hazır olunca).
  useEffect(() => {
    const id = requestAnimationFrame(() => centerOffset(offset, false))
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Offset dışarıdan değişti (ok / doğrudan tıklama) → yumuşak ortala.
  // Scroll-settle kaynaklı değişimde kullanıcı zaten orada; tekrar kaydırma.
  useEffect(() => {
    if (settledByScrollRef.current === offset) {
      settledByScrollRef.current = null
      return
    }
    centerOffset(offset, true)
  }, [offset, centerOffset])

  const handleScroll = useCallback(() => {
    if (syncingRef.current) return
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      const center = el.scrollLeft + el.clientWidth / 2
      let nearest = offset
      let best = Infinity
      for (const [o, slot] of slotRefs.current) {
        const slotCenter = slot.offsetLeft + slot.clientWidth / 2
        const d = Math.abs(slotCenter - center)
        if (d < best) {
          best = d
          nearest = o
        }
      }
      if (nearest !== offset) {
        settledByScrollRef.current = nearest
        go(nearest) // dönem değişti → metrikleri yüklenir
      }
    }, 130)
  }, [offset, go])

  const labelClass =
    mode === 'week' || mode === 'month'
      ? 'text-[10px] leading-tight sm:text-xs'
      : 'text-[11px] leading-tight sm:text-sm'

  // Oklar JSX'te şeritten SONRA gelir → sonra boyanır → şeridin üstünde durur
  // (raw z-index'e gerek yok). Opak bg + halo, altlarından akan slotları gizler.
  const arrowClass =
    'absolute inset-y-0 flex w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-3)] shadow-[0_0_14px_6px_var(--bg-card)] transition hover:border-brand/30 hover:text-brand active:scale-95'

  return (
    <div className="relative w-full select-none">
      {/* Kayan şerit — native scroll-snap (momentum + snap bedava). */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-no-swipe="true"
        data-testid="hub-period-navigator"
        className="no-swipe scrollbar-hide flex snap-x snap-mandatory touch-pan-x overflow-x-auto overscroll-x-contain px-[30%]"
      >
        {offsets.map(o => {
          const active = o === offset
          return (
            <button
              key={o}
              type="button"
              data-offset={o}
              ref={el => {
                if (el) slotRefs.current.set(o, el)
                else slotRefs.current.delete(o)
              }}
              onClick={() => go(o)}
              className={clsx(
                'flex shrink-0 basis-[40%] snap-center items-center justify-center rounded-xl border px-1 py-2.5 text-center font-semibold transition-colors',
                active
                  ? clsx(accentClass ?? 'border-brand/35 bg-brand/10 dark:bg-brand/15', 'font-black text-[var(--text-1)]')
                  : 'border-transparent text-[var(--text-3)] opacity-70',
              )}
            >
              <PeriodLabel text={labelFor(o)} compactText={labelFor(o, true)} className={labelClass} />
            </button>
          )
        })}
      </div>

      {/* Sabit oklar — şeritten sonra render edilir, üstte durur. */}
      <button
        type="button"
        onClick={() => go(offset - 1)}
        aria-label={t('dashboard.summaryPeriodPrev')}
        data-testid="hub-period-prev"
        className={clsx(arrowClass, 'left-0')}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={() => go(offset + 1)}
        aria-label={t('dashboard.summaryPeriodNext')}
        data-testid="hub-period-next"
        className={clsx(arrowClass, 'right-0')}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
      </button>
    </div>
  )
}
