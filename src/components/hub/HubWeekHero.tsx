'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { weeklyAccent } from '@/components/hub/hubWeeklyAccent'
import { Skeleton } from '@/components/ui/Skeleton'

type HubWeekHeroProps = {
  loading?: boolean
}

export function HubWeekHero({ loading }: HubWeekHeroProps) {
  const { lang, t } = useTranslation()

  const monthLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })
  }, [lang])

  if (loading) return <Skeleton className="h-16 rounded-2xl" />

  return (
    <div className={`rounded-2xl border border-[var(--border)] ${weeklyAccent.surface} px-4 py-3.5 md:px-5`}>
      <p className="text-lg font-black capitalize text-[var(--text-1)] md:text-xl">{monthLabel}</p>
      <p className="mt-0.5 text-xs font-medium text-[var(--text-2)]">{t('crown.hubWeekSubtitle')}</p>
    </div>
  )
}
