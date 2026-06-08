'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubAllTimeHeroProps = {
  activeDays: number
  loading?: boolean
}

export function HubAllTimeHero({ activeDays, loading }: HubAllTimeHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-20 rounded-2xl" />

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <p className="text-xs font-semibold text-[var(--text-1)] md:text-sm">
        {t('crown.allTimeHeroTitle')}
      </p>
      <p className="mt-1 text-xs text-[var(--text-3)] md:text-sm">
        {t('crown.allTimeHeroSubtitle', { days: activeDays })}
      </p>
    </div>
  )
}
