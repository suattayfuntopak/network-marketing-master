'use client'

import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubDayLoginStripProps = {
  dayActive: boolean
  loading?: boolean
  dayDate?: Date
}

export function HubDayLoginStrip({ dayActive, loading, dayDate }: HubDayLoginStripProps) {
  const { lang, t } = useTranslation()

  const dayTitle = useMemo(() => {
    const d = dayDate ? new Date(dayDate) : new Date()
    const locale = lang === 'en' ? 'en-US' : 'tr-TR'
    return d.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }, [dayDate, lang])

  if (loading) return <Skeleton className="h-20 rounded-2xl" />

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 md:px-5">
      <div className="flex items-center justify-center gap-3">
        <span
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors',
            dayActive
              ? 'bg-brand text-white shadow-sm shadow-brand/30'
              : 'border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-3)]',
          )}
          aria-label={dayActive ? t('crown.hubDayActive') : t('crown.hubDayInactive')}
        >
          {dayActive ? '✓' : ''}
        </span>
        <p className="text-sm font-semibold text-[var(--text-1)]">{dayTitle}</p>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-[var(--text-2)]">
        {dayActive ? t('crown.hubLoginDayActive') : t('crown.hubLoginDayInactive')}
      </p>
    </div>
  )
}
