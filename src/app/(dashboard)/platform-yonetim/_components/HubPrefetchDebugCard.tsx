'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  readHubPrefetchStats,
  type HubPrefetchStats,
} from '@/lib/domain/hubPeriodPrefetch'

/** Super admin — son istemci hub prefetch özeti (sessionStorage). */
export function HubPrefetchDebugCard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<HubPrefetchStats | null>(() => readHubPrefetchStats())

  useEffect(() => {
    const onFocus = () => setStats(readHubPrefetchStats())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  if (!stats) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 px-4 py-3 text-xs text-[var(--text-3)]">
        {t('platformPage.hubPrefetchEmpty')}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-2)] space-y-1">
      <p className="font-bold text-[var(--text-1)]">{t('platformPage.hubPrefetchTitle')}</p>
      <p>
        {t('platformPage.hubPrefetchTab')}: <span className="font-mono">{stats.activeTab}</span>
      </p>
      <p>
        {t('platformPage.hubPrefetchSelf')}: {stats.hubSelfQueries} · {t('platformPage.hubPrefetchTotal')}:{' '}
        {stats.totalTasks}
      </p>
      <p className="text-[var(--text-3)]">
        {new Date(stats.at).toLocaleString()}
      </p>
    </div>
  )
}
