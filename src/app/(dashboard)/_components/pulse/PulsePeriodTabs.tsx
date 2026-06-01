'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import type { PulsePeriod } from '@/lib/domain/pulse'

export const PULSE_PERIOD_OPTIONS: PulsePeriod[] = ['today', '7d', '30d', 'ytd', 'all']

/** Dönem etiketleri pulse + statsPage anahtarlarından gelir (mevcut konvansiyon). */
export function pulsePeriodLabel(t: (key: string) => string, p: PulsePeriod): string {
  if (p === 'today') return t('pulse.periodToday')
  if (p === '7d') return t('statsPage.period7d')
  if (p === '30d') return t('statsPage.period30d')
  if (p === 'ytd') return t('pulse.periodYtd')
  return t('statsPage.periodAll')
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
    <div className="flex flex-wrap gap-0.5 self-start rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5">
      {PULSE_PERIOD_OPTIONS.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-lg font-bold transition-all ${btnCls} ${
            period === p
              ? 'border border-[var(--border)] bg-[var(--bg-card)] text-brand shadow-sm'
              : 'text-[var(--text-2)]'
          }`}
        >
          {pulsePeriodLabel(t, p)}
        </button>
      ))}
    </div>
  )
}
