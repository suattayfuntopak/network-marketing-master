'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, ChevronDown } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  listHubPrefetchDailyRollupsAction,
  listHubPrefetchEventsAction,
  type HubPrefetchDailyRow,
  type HubPrefetchEventRow,
} from '@/app/(dashboard)/platform-yonetim/hubPrefetchActions'

/**
 * Hub prefetch telemetri monitörü — süper admin için sade, premium, KATLANABİLİR
 * (native <details>) bir kart. Eski "debug dökümü" yerine: 7 günlük mini sütun
 * trendi + son sunucu olayları. Veri yoksa zarif boş durum gösterir; ham log /
 * çiğ i18n anahtarı sızdırmaz.
 */
export function HubPrefetchMonitorCard() {
  const { t } = useTranslation()

  const { data: dailyRollups = [], isLoading: dailyLoading } = useQuery({
    queryKey: ['platform', 'hub-prefetch-daily'],
    queryFn: () => listHubPrefetchDailyRollupsAction(7),
    staleTime: 60_000,
  })

  const { data: serverEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['platform', 'hub-prefetch-events'],
    queryFn: () => listHubPrefetchEventsAction(8),
    staleTime: 30_000,
  })

  const maxCount = useMemo(
    () => Math.max(1, ...dailyRollups.map((r: HubPrefetchDailyRow) => r.event_count)),
    [dailyRollups],
  )

  const dayShort = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })
  const timeShort = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <details className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 select-none">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
          <Activity className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[var(--text-1)]">
            {t('platformPage.hubPrefetchTitle')}
          </span>
          <span className="block text-[11px] font-medium text-[var(--text-3)]">
            {t('platformPage.hubPrefetchDaily')} · {t('platformPage.hubPrefetchServer')}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">
        {/* 7 günlük mini sütun trendi */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
            {t('platformPage.hubPrefetchDaily')}
          </p>
          {dailyLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-[var(--bg-subtle)]" />
          ) : dailyRollups.length === 0 ? (
            <p className="text-xs text-[var(--text-3)]">{t('platformPage.hubPrefetchDailyEmpty')}</p>
          ) : (
            <div className="flex items-end gap-1.5">
              {dailyRollups.map((row: HubPrefetchDailyRow) => (
                <div key={row.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] font-bold tabular-nums text-[var(--text-2)]">
                    {row.event_count}
                  </span>
                  <div className="flex h-14 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-teal-500/40 to-teal-400 dark:from-teal-500/30 dark:to-teal-400/80"
                      style={{ height: `${Math.max(6, (row.event_count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-medium tabular-nums text-[var(--text-3)]">
                    {dayShort(row.day)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son sunucu olayları */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
            {t('platformPage.hubPrefetchServer')}
          </p>
          {eventsLoading ? (
            <div className="h-12 animate-pulse rounded-lg bg-[var(--bg-subtle)]" />
          ) : serverEvents.length === 0 ? (
            <p className="text-xs text-[var(--text-3)]">{t('platformPage.hubPrefetchServerEmpty')}</p>
          ) : (
            <ul className="space-y-1">
              {serverEvents.map((row: HubPrefetchEventRow) => (
                <li
                  key={row.id}
                  className="flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)]/60 px-2.5 py-1.5 text-[11px]"
                >
                  <span className="rounded-md bg-teal-500/10 px-1.5 py-0.5 font-bold text-teal-600 dark:text-teal-300">
                    {row.active_tab}
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--text-2)]">
                    {row.hub_self_queries}/{row.total_tasks}
                  </span>
                  <span className="text-[var(--text-3)]">{row.source}</span>
                  <span className="ml-auto tabular-nums text-[var(--text-3)]">
                    {timeShort(row.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </details>
  )
}
