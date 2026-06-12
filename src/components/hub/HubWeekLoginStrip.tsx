'use client'

import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubWeekLoginStripProps = {
  weekActive: boolean[]
  loading?: boolean
  /** Hafta penceresinin son günü (offset haftalar için) */
  weekEnd?: Date
}

export function HubWeekLoginStrip({ weekActive, loading, weekEnd }: HubWeekLoginStripProps) {
  const { lang, t } = useTranslation()

  const dayLabels = useMemo(() => {
    const short =
      lang === 'en'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    const end = weekEnd ? new Date(weekEnd) : new Date()
    end.setHours(0, 0, 0, 0) // istemci: kullanıcı-yerel gün (kasıtlı)
    return weekActive.map((_, i) => {
      const d = new Date(end)
      d.setDate(d.getDate() - (6 - i))
      const idx = (d.getDay() + 6) % 7
      return short[idx]
    })
  }, [weekActive, lang, weekEnd])

  if (loading) return <Skeleton className="h-24 rounded-2xl" />

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 md:px-5">
      <div className="flex items-center justify-between gap-3">
        {weekActive.map((active, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-colors md:h-9 md:w-9',
                active
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-3)]',
              )}
              aria-label={active ? t('crown.hubDayActive') : t('crown.hubDayInactive')}
            >
              {active ? '✓' : ''}
            </span>
            <span className="text-[10px] font-semibold text-[var(--text-3)]">{dayLabels[i]}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
