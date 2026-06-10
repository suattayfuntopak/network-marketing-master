'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  listHubPrefetchDailyRollupsAction,
  listHubPrefetchEventsAction,
  type HubPrefetchDailyRow,
  type HubPrefetchEventRow,
} from '@/app/(dashboard)/platform-yonetim/hubPrefetchActions'
import {
  readHubPrefetchStats,
  type HubPrefetchStats,
} from '@/lib/domain/hubPeriodPrefetch'

/** Super admin — hub prefetch (istemci + sunucu aggregate + günlük trend). */
export function HubPrefetchDebugCard() {
  const { t } = useTranslation()
  const [localStats, setLocalStats] = useState<HubPrefetchStats | null>(() =>
    readHubPrefetchStats(),
  )

  const { data: serverEvents = [], isLoading } = useQuery({
    queryKey: ['platform', 'hub-prefetch-events'],
    queryFn: () => listHubPrefetchEventsAction(12),
    staleTime: 30_000,
  })

  const { data: dailyRollups = [], isLoading: dailyLoading } = useQuery({
    queryKey: ['platform', 'hub-prefetch-daily'],
    queryFn: () => listHubPrefetchDailyRollupsAction(7),
    staleTime: 60_000,
  })

  useEffect(() => {
    const onFocus = () => setLocalStats(readHubPrefetchStats())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-2)] space-y-3">
      <p className="font-bold text-[var(--text-1)]">{t('platformPage.hubPrefetchTitle')}</p>

      {localStats ? (
        <div className="space-y-1 rounded-lg bg-[var(--bg-subtle)]/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
            {t('platformPage.hubPrefetchLocal')}
          </p>
          <p>
            {t('platformPage.hubPrefetchTab')}:{' '}
            <span className="font-mono">{localStats.activeTab}</span>
          </p>
          <p>
            {t('platformPage.hubPrefetchSelf')}: {localStats.hubSelfQueries} ·{' '}
            {t('platformPage.hubPrefetchTotal')}: {localStats.totalTasks}
          </p>
          <p className="text-[var(--text-3)]">{new Date(localStats.at).toLocaleString()}</p>
        </div>
      ) : (
        <p className="text-[var(--text-3)]">{t('platformPage.hubPrefetchEmpty')}</p>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
          {t('platformPage.hubPrefetchDaily')}
        </p>
        {dailyLoading ? (
          <p className="text-[var(--text-3)]">…</p>
        ) : dailyRollups.length === 0 ? (
          <p className="text-[var(--text-3)]">{t('platformPage.hubPrefetchDailyEmpty')}</p>
        ) : (
          <ul className="max-h-28 space-y-1 overflow-y-auto font-mono text-[10px]">
            {dailyRollups.map((row: HubPrefetchDailyRow) => (
              <li key={row.day} className="flex flex-wrap gap-x-2 text-[var(--text-2)]">
                <span>{row.day}</span>
                <span>
                  {row.event_count}× · {row.sum_hub_self_queries}/{row.sum_total_tasks}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
          {t('platformPage.hubPrefetchServer')}
        </p>
        {isLoading ? (
          <p className="text-[var(--text-3)]">…</p>
        ) : serverEvents.length === 0 ? (
          <p className="text-[var(--text-3)]">{t('platformPage.hubPrefetchServerEmpty')}</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-[10px]">
            {serverEvents.map((row: HubPrefetchEventRow) => (
              <li key={row.id} className="flex flex-wrap gap-x-2 text-[var(--text-2)]">
                <span>{row.source}</span>
                <span>{row.active_tab}</span>
                <span>
                  {row.hub_self_queries}/{row.total_tasks}
                </span>
                <span className="text-[var(--text-3)]">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
