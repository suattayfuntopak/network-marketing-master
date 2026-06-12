'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { PulsePeriod } from '@/lib/domain/pulse'

export const PULSE_PERIOD_OPTIONS: PulsePeriod[] = ['today', '7d', '30d', 'ytd', 'all']

/** Dönem etiketleri — varsayılan Saha Özetim ile hizalı; İstatistikler'de 30g kayan pencere. */
export function pulsePeriodLabel(
  t: (key: string) => string,
  p: PulsePeriod,
  opts?: { rolling30?: boolean },
): string {
  if (p === 'today') return t('dashboard.summaryTabDaily')
  if (p === '7d') return t('dashboard.summaryTabWeekly')
  if (p === '30d') return opts?.rolling30 ? t('statsPage.period30d') : t('dashboard.summaryTabMonthly')
  if (p === 'all') return t('dashboard.summaryTabAllTime')
  return t('dashboard.summaryTabYearly')
}

/** Mobilde sığması için kısa etiket: 1 / 7 / 30 / 365 / ∞ */
const PULSE_PERIOD_SHORT: Record<PulsePeriod, string> = {
  today: '1',
  '7d': '7',
  '30d': '30',
  ytd: '365',
  all: '∞',
}

type Props = {
  period: PulsePeriod
  onChange: (p: PulsePeriod) => void
  /** İstatistikler sayfasında bir punto büyük */
  comfortableTypography?: boolean
}

/** Bugün / Hafta / Ay / Yıl / Tüm zamanlar — ① ve ② için ortak. */
export function PulsePeriodTabs({ period, onChange, comfortableTypography = false }: Props) {
  const { t } = useTranslation()
  const btnCls = comfortableTypography ? 'text-sm px-2.5 py-1' : 'text-[10px] px-2 py-1'

  return (
    <div
      className="no-swipe flex flex-wrap gap-1 self-start rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1"
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
