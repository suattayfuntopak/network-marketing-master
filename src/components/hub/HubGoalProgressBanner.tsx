'use client'

import { Target, Users } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

type HubGoalProgressBannerProps = {
  current: number
  target: number
  overall: number
  period: 'monthly' | 'yearly'
}

export function HubGoalProgressBanner({
  current,
  target,
  overall,
  period,
}: HubGoalProgressBannerProps) {
  const { t } = useTranslation()

  if (target <= 0) return null

  const pct = Math.min(100, Math.round((current / target) * 100))
  const titleKey = 'crown.hubGoalProgressTitle'
  const subtitleKey =
    period === 'yearly'
      ? 'crown.hubGoalProgressSubtitleYearly'
      : 'crown.hubGoalProgressSubtitleMonthly'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/60 p-4 shadow-sm md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
            <Target className="h-5.5 w-5.5" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] md:text-sm">
              {t(titleKey)}
            </h4>
            <p className="text-xs font-semibold leading-relaxed text-[var(--text-2)] md:text-sm">
              {t(subtitleKey, { target, current, overall })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-black tabular-nums text-brand md:text-sm">
            %{pct}
          </span>
          <span className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">
            <Users className="h-3 w-3" />
            {current} / {target}
          </span>
        </div>
      </div>

      <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
