'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Film, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'

export function PanoVideoStrip() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()

  const { data, isLoading } = useQuery({
    queryKey: ['video-catalog', ws?.workspaceId],
    queryFn: () => getVideoCatalogAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  if (!ws?.workspaceId) return null

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  }

  const summary = data?.summary
  const pct = summary?.pct ?? 0
  const completed = summary?.completed ?? 0
  const total = summary?.total ?? 0
  const totalMin = (data?.videos ?? []).reduce((s, v) => s + v.durationMin, 0)
  const watchedMin = Math.round((pct / 100) * totalMin)

  return (
    <Link
      href="/egitim/videolar"
      className="block rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 dark:from-teal-950/30 dark:to-emerald-950/20 p-4 shadow-sm transition hover:border-teal-500/40 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Film className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" />
          <span className="text-sm font-bold text-[var(--text-1)] truncate">
            {t('videoTraining.panoStripTitle')}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-lg font-black tabular-nums text-teal-700 dark:text-teal-400">%{pct}</span>
          <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
        </div>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
        <div
          className="h-full rounded-full bg-teal-600 transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--text-2)]">
        {t('videoTraining.panoStripMeta', { watched: watchedMin, total: totalMin, completed, count: total })}
      </p>
    </Link>
  )
}
