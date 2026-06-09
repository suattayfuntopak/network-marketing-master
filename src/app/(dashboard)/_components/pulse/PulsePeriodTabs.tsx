'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { PulsePeriod } from '@/lib/domain/pulse'

export const PULSE_PERIOD_OPTIONS: PulsePeriod[] = ['today', '7d', '30d', 'ytd']

/** Dönem etiketleri — Saha Özetim sekmeleriyle aynı (Günlük/Haftalık/Aylık/Yıllık). */
export function pulsePeriodLabel(t: (key: string) => string, p: PulsePeriod): string {
  if (p === 'today') return t('dashboard.summaryTabDaily')
  if (p === '7d') return t('dashboard.summaryTabWeekly')
  if (p === '30d') return t('dashboard.summaryTabMonthly')
  return t('dashboard.summaryTabYearly')
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
          onClick={() => onChange(p)}
          className={clsx(
            'rounded-lg font-bold transition',
            btnCls,
            period === p
              ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
          )}
        >
          {pulsePeriodLabel(t, p)}
        </button>
      ))}
    </div>
  )
}
