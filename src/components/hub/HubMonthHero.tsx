'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubMonthHeroProps = {
  loginDays: number
  monthPct: number
  loading?: boolean
}

export function HubMonthHero({
  loginDays,
  monthPct,
  loading,
}: HubMonthHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-28 rounded-2xl" />

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${monthPct}%` }} />
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-[var(--text-2)]">
        {t('crown.hubLoginDaysMonth', { count: loginDays })}
      </p>
    </div>
  )
}
