'use client'

import { Target, Flame, BarChart2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

interface FunnelStep {
  key: string
  label: string
  count: number
  color: string
  pct: number
  dropFromPrev: number | null
}

interface TemperatureData {
  hot: number
  warm: number
  cold: number
  hotPct: number
  warmPct: number
  coldPct: number
}

interface TrendBar {
  label: string
  count: number
}

interface Props {
  total: number
  funnelSteps: FunnelStep[]
  temperatureData: TemperatureData
  trendBars: TrendBar[]
  maxTrendCount: number
}

export function StatsCharts({ total, funnelSteps, temperatureData, trendBars, maxTrendCount }: Props) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Dönüşüm Hunisi */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 h-full">
        <div>
          <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
            <Target className="h-4 w-4 text-[#1A56DB]" />
            {t('statsPage.funnelTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
            {t('statsPage.funnelSubtitle')}
          </p>
        </div>

        {total === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-3)] italic">
            {t('statsPage.funnelEmpty')}
          </div>
        ) : (
          <div className="space-y-2">
            {funnelSteps.map((step) => (
              <div key={step.key} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-sm font-semibold text-[var(--text-2)] line-clamp-1">
                    {step.label}
                  </div>
                  {/* Custom Dynamic CSS Bar */}
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                    <div
                      className="h-full rounded-lg transition-all duration-1000 ease-out"
                      style={{
                        backgroundColor: step.color,
                        width: `${Math.max(step.pct, step.count > 0 ? 8 : 0)}%`
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-1)] drop-shadow-sm">
                      {step.count}
                    </span>
                  </div>
                  <div className="w-10 text-right text-sm font-bold text-[var(--text-1)]">
                    %{step.pct}
                  </div>
                </div>
                {step.dropFromPrev !== null && step.dropFromPrev > 0 && (
                  <p className="mt-1 pl-28 text-sm text-[var(--text-3)] font-medium">
                    ↓ {step.dropFromPrev} {t('statsPage.funnelDropSuffix')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* İvme Grafikleri: Sıcaklık & Mini Trend */}
      <div className="flex flex-col h-full space-y-6">

        {/* Sıcaklık Dağılımı Donut */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              {t('statsPage.tempTitle')}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
              {t('statsPage.tempSubtitle')}
            </p>
          </div>

          {total === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-3)] italic">
              {t('statsPage.tempEmpty')}
            </div>
          ) : (
            <div className="flex items-center gap-6 py-4 md:py-6">
              {/* SVG Concentric Gauge / Ring Chart */}
              <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                <svg width="96" height="96" className="transform -rotate-90">
                  {/* Cold Arc */}
                  <circle cx="48" cy="48" r="38" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="38" stroke="#6B7280" strokeWidth="6" fill="transparent"
                    strokeDasharray="238.7" strokeDashoffset={238.7 - (238.7 * temperatureData.coldPct) / 100} strokeLinecap="round" />

                  {/* Warm Arc */}
                  <circle cx="48" cy="48" r="28" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="28" stroke="#534AB7" strokeWidth="6" fill="transparent"
                    strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * temperatureData.warmPct) / 100} strokeLinecap="round" />

                  {/* Hot Arc */}
                  <circle cx="48" cy="48" r="18" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="18" stroke="#C03E1F" strokeWidth="6" fill="transparent"
                    strokeDasharray="113.1" strokeDashoffset={113.1 - (113.1 * temperatureData.hotPct) / 100} strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <Flame className="h-4 w-4 text-orange-500 mx-auto animate-pulse" />
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C03E1F]" />
                    <span>{t('statsPage.tempHot')}</span>
                  </div>
                  <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.hotPct} ({temperatureData.hot})</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#534AB7]" />
                    <span>{t('statsPage.tempWarm')}</span>
                  </div>
                  <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.warmPct} ({temperatureData.warm})</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6B7280]" />
                    <span>{t('statsPage.tempCold')}</span>
                  </div>
                  <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.coldPct} ({temperatureData.cold})</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Büyüme Hızı / Aday Edinme Trendi */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-[#4169E1]" />
                {t('statsPage.velocityTitle')}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
                {t('statsPage.velocitySubtitle')}
              </p>
            </div>
            <span className="text-sm font-bold text-[#4169E1] bg-[#EEF2FF] dark:bg-[#0a0f2e] border border-blue-100/50 dark:border-blue-900/10 px-2 py-0.5 rounded-full">
              {total} {t('statsPage.velocityNew')}
            </span>
          </div>

          {total === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-3)] italic">
              {t('statsPage.velocityEmpty')}
            </div>
          ) : (
            <div className="flex items-end gap-2 flex-1 pt-6 min-h-[130px] pb-2">
              {trendBars.map((bar, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-sm font-bold text-[var(--text-1)]">{bar.count > 0 ? bar.count : ''}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${bar.count > 0 ? 'bg-[#4169E1]' : 'bg-[#EEF2FF] dark:bg-[#4169E1]/20'}`}
                    style={{ height: `${Math.max((bar.count / maxTrendCount) * 105, bar.count > 0 ? 10 : 2)}px` }}
                  />
                  <span className="text-sm font-semibold text-[var(--text-3)] truncate w-full text-center">{bar.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  )
}
