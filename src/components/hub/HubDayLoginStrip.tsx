'use client'

import { Calendar } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubDayLoginStripProps = {
  loading?: boolean
  dayDate?: Date
}

export function HubDayLoginStrip({ loading, dayDate }: HubDayLoginStripProps) {
  const { lang } = useTranslation()

  const { dayTitle, dayNumber } = useMemo(() => {
    const d = dayDate ? new Date(dayDate) : new Date()
    const locale = lang === 'en' ? 'en-US' : 'tr-TR'
    return {
      dayTitle: d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      dayNumber: d.getDate(),
    }
  }, [dayDate, lang])

  if (loading) return <Skeleton className="h-14 rounded-2xl" />

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 md:px-5">
      <div className="flex items-center justify-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center text-brand" aria-hidden>
          <Calendar className="h-10 w-10" strokeWidth={1.25} />
          <span className="absolute inset-0 flex items-center justify-center pt-1.5 text-xs font-bold">
            {dayNumber}
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--text-1)]">{dayTitle}</p>
      </div>
    </div>
  )
}
