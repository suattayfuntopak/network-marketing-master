'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { useCandidates } from '@/hooks/useCandidates'
import { useWorkspace } from '@/hooks/useWorkspace'
import type { NmmCandidate } from '@/types/database.types'

function buildWeekBars(candidates: NmmCandidate[], lang: 'tr' | 'en') {
  const daysShort =
    lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const count = candidates.filter(c => {
      const t = new Date(c.created_at)
      return t >= d && t < next
    }).length
    const dayIdx = (d.getDay() + 6) % 7
    return { label: daysShort[dayIdx], count, isToday: i === 6 }
  })
}

export function PanoWeeklyLite() {
  const { lang, t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { candidates, isLoading } = useCandidates(ws?.workspaceId)

  const bars = useMemo(() => buildWeekBars(candidates, lang), [candidates, lang])
  const total = useMemo(() => bars.reduce((s, b) => s + b.count, 0), [bars])
  const max = Math.max(...bars.map(b => b.count), 1)

  if (isLoading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
          {t('shellUi.last7DaysTrend')}
        </p>
        <span className="text-xs font-bold text-brand">
          {total} {t('shellUi.candidatesLabel')}
        </span>
      </div>
      <div className="flex h-14 items-end gap-1.5">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-[var(--text-1)]">
              {b.count > 0 ? b.count : ''}
            </span>
            <div
              className={`w-full rounded-t-md transition-all ${
                b.isToday ? 'bg-brand' : 'bg-brand-subtle dark:bg-brand/25'
              }`}
              style={{
                height: `${Math.max((b.count / max) * 40, b.count > 0 ? 6 : 2)}px`,
              }}
            />
            <span
              className={`text-[9px] font-semibold ${
                b.isToday ? 'text-brand' : 'text-[var(--text-3)]'
              }`}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/istatistikler"
        className="mt-3 inline-block text-xs font-medium text-brand hover:underline"
      >
        {t('dashboard.weeklyLiteLink')}
      </Link>
    </div>
  )
}
