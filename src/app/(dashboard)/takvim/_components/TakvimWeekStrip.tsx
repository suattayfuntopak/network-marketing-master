'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCalendarDayShort, weekdayShortLabels } from '@/lib/utils/calendarLocale'
import { fromCalendarKey } from '@/lib/utils/calendarDates'

type TakvimWeekStripProps = {
  weekKeys: string[]
  selected: string
  todayKey: string
  byDate: Record<string, unknown[]>
  lang: 'tr' | 'en'
  title: string
  onSelect: (key: string) => void
  onPrevWeek?: () => void
  onNextWeek?: () => void
}

function DayCell({
  dayKey,
  weekdayLabel,
  selected,
  todayKey,
  byDate,
  lang,
  onSelect,
  compact,
}: {
  dayKey: string
  weekdayLabel: string
  selected: string
  todayKey: string
  byDate: Record<string, unknown[]>
  lang: 'tr' | 'en'
  onSelect: (key: string) => void
  compact?: boolean
}) {
  const date = fromCalendarKey(dayKey)
  const isSelected = dayKey === selected
  const isToday = dayKey === todayKey
  const hasDot = !!byDate[dayKey]
  const isPast = dayKey < todayKey && !isToday
  const isOverdue = isPast && hasDot

  return (
    <button
      type="button"
      onClick={() => onSelect(dayKey)}
      className={`flex shrink-0 flex-col items-center rounded-xl transition-colors
        ${compact ? 'min-w-[4.25rem] snap-center px-2 py-2' : 'px-1 py-2'}
        ${isSelected ? 'bg-[#534AB7] text-white' :
          isToday ? 'bg-[#EEEDFE] text-[#534AB7]' :
          isOverdue ? 'text-[#72243E]' :
          'text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}
        ${isPast && !isOverdue ? 'opacity-50' : ''}`}
    >
      <span className="text-[10px] font-medium opacity-80">{weekdayLabel}</span>
      <span className="text-sm font-bold">{date.getDate()}</span>
      <span className={`mt-0.5 text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-[var(--text-3)]'}`}>
        {formatCalendarDayShort(dayKey, lang)}
      </span>
      {hasDot && (
        <span className={`mt-1 h-1 w-1 rounded-full ${
          isSelected ? 'bg-white' :
          isOverdue ? 'bg-[#72243E]' :
          'bg-[#534AB7]'
        }`} />
      )}
    </button>
  )
}

export function TakvimWeekStrip({
  weekKeys,
  selected,
  todayKey,
  byDate,
  lang,
  title,
  onSelect,
  onPrevWeek,
  onNextWeek,
}: TakvimWeekStripProps) {
  const weekdayLabels = weekdayShortLabels(lang)

  return (
    <>
      {/* Mobil: yatay kaydırma */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:hidden">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--text-2)]">{title}</p>
          <div className="flex gap-1">
            {onPrevWeek && (
              <button
                type="button"
                onClick={onPrevWeek}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-2)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {onNextWeek && (
              <button
                type="button"
                onClick={onNextWeek}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-2)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {weekKeys.map((key, i) => (
            <DayCell
              key={key}
              dayKey={key}
              weekdayLabel={weekdayLabels[i]}
              selected={selected}
              todayKey={todayKey}
              byDate={byDate}
              lang={lang}
              onSelect={onSelect}
              compact
            />
          ))}
        </div>
      </div>

      {/* Masaüstü: grid */}
      <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:block">
        <p className="mb-2 text-xs font-semibold text-[var(--text-2)]">{title}</p>
        <div className="grid grid-cols-7 gap-1">
          {weekKeys.map((key, i) => (
            <DayCell
              key={key}
              dayKey={key}
              weekdayLabel={weekdayLabels[i]}
              selected={selected}
              todayKey={todayKey}
              byDate={byDate}
              lang={lang}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </>
  )
}
