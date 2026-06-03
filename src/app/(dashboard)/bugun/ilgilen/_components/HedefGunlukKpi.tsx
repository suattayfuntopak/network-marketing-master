'use client'

import { useUserGoal } from '@/hooks/useUserGoal'
import { useTranslation } from '@/providers/LanguageProvider'
import type { FunnelCounts } from '@/lib/domain/roadmap'

const ROWS: { key: keyof FunnelCounts; color: string }[] = [
  { key: 'arama', color: '#534AB7' },
  { key: 'tanisma', color: '#0F6E56' },
  { key: 'sunum', color: '#854F0B' },
  { key: 'yeniUye', color: '#72243E' },
]

/** Bugün İlgilen üstünde hızlı günlük huni KPI'ı (yalnız hedef varsa görünür). */
export function HedefGunlukKpi() {
  const { t } = useTranslation()
  const { progress, isLoading } = useUserGoal()

  if (isLoading || !progress?.hasGoal) return null
  const p = progress

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
        {t('hedef.todayTitle')}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {ROWS.map(({ key, color }) => {
          const target = p.targets[key]
          const actual = p.actuals[key]
          const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0
          return (
            <div key={key} className="rounded-xl bg-[var(--bg-subtle)] p-2.5 text-center">
              <p className="text-lg font-bold" style={{ color }}>
                {actual}
                <span className="text-xs font-medium text-[var(--text-3)]">/{target}</span>
              </p>
              <p className="mt-0.5 text-[10px] font-medium leading-tight text-[var(--text-3)]">
                {t(`hedef.${key}`)}
              </p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
