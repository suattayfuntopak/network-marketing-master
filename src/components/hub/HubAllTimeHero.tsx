'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubAllTimeHeroProps = {
  activeDays: number
  loading?: boolean
}

export function HubAllTimeHero({ activeDays, loading }: HubAllTimeHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-28 rounded-2xl" />

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <p className="text-center text-xs font-semibold text-[var(--text-2)] md:text-sm">
        {t('crown.allTimeHeroSubtitle', { days: activeDays })}
      </p>
    </div>
  )
}
