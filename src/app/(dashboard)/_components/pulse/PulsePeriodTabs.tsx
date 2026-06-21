'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { PulsePeriod } from '@/lib/domain/pulse'
import {
  PULSE_PERIOD_OPTIONS,
  PULSE_PERIOD_SHORT,
  pulsePeriodLabel,
} from '@/lib/domain/pulsePeriodLabels'

export { PULSE_PERIOD_OPTIONS, pulsePeriodLabel } from '@/lib/domain/pulsePeriodLabels'

type Props = {
  period: PulsePeriod
  onChange: (p: PulsePeriod) => void
  /** İstatistikler sayfasında bir punto büyük */
  comfortableTypography?: boolean
}

/** Bugün / Hafta / Ay / Yıl / Tüm zamanlar — ① ve ② için ortak. */
export function PulsePeriodTabs({ period, onChange, comfortableTypography = false }: Props) {
  const { t } = useTranslation()
  const btnCls = comfortableTypography
    ? 'text-[10px] px-1.5 py-1 sm:text-sm sm:px-2.5 sm:py-1'
    : 'text-[10px] px-2 py-1'

  return (
    <div
      className={clsx(
        'no-swipe flex flex-wrap self-start rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/80',
        comfortableTypography ? 'gap-0.5 p-0.5 sm:gap-1 sm:p-1' : 'gap-1 p-1',
      )}
      role="tablist"
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
    >
      {PULSE_PERIOD_OPTIONS.map(p => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={period === p}
          data-testid={p === 'all' ? 'pulse-period-tab-all' : undefined}
          onClick={() => onChange(p)}
          className={clsx(
            'rounded-lg font-bold transition',
            btnCls,
            p === 'all' && 'text-base sm:text-sm',
            period === p
              ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
          )}
        >
          <span
            className={clsx(
              'sm:hidden tabular-nums leading-none',
              p === 'all' ? 'text-lg font-black' : undefined,
            )}
          >
            {PULSE_PERIOD_SHORT[p]}
          </span>
          <span className="hidden sm:inline">
            {pulsePeriodLabel(t, p, { rolling30: comfortableTypography })}
          </span>
        </button>
      ))}
    </div>
  )
}
