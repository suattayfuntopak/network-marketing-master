'use client'

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
}

export function TakvimWeekStrip({
  weekKeys,
  selected,
  todayKey,
  byDate,
  lang,
  title,
  onSelect,
}: TakvimWeekStripProps) {
  const weekdayLabels = weekdayShortLabels(lang)

  return (
    <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:block">
      <p className="mb-2 text-xs font-semibold text-[var(--text-2)]">{title}</p>
      <div className="grid grid-cols-7 gap-1">
        {weekKeys.map((key, i) => {
          const date = fromCalendarKey(key)
          const isSelected = key === selected
          const isToday = key === todayKey
          const hasDot = !!byDate[key]
          const isPast = key < todayKey && !isToday
          const isOverdue = isPast && hasDot

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex flex-col items-center rounded-xl px-1 py-2 transition-colors
                ${isSelected ? 'bg-[#534AB7] text-white' :
                  isToday ? 'bg-[#EEEDFE] text-[#534AB7]' :
                  isOverdue ? 'text-[#72243E]' :
                  'text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}
                ${isPast && !isOverdue ? 'opacity-50' : ''}`}
            >
              <span className="text-[10px] font-medium opacity-80">{weekdayLabels[i]}</span>
              <span className="text-sm font-bold">{date.getDate()}</span>
              <span className={`mt-0.5 text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-[var(--text-3)]'}`}>
                {formatCalendarDayShort(key, lang)}
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
        })}
      </div>
    </div>
  )
}
