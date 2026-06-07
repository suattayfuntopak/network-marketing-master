'use client'

import Link from 'next/link'
import { Film, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { useVideoCatalog } from '@/hooks/useVideoCatalog'
import { akademiHref } from '@/lib/domain/akademiTab'
import { Skeleton } from '@/components/ui/Skeleton'
import { videoProgressAccent } from '@/app/(dashboard)/canli-egitim/_components/videoProgressTheme'

export function PanoVideoStrip() {
  const { t } = useTranslation()
  const { data, isLoading } = useVideoCatalog()

  if (isLoading) {
    return <Skeleton className="h-20 rounded-2xl" />
  }

  if (!data) return null

  const summary = data.summary
  const pct = summary.pct
  const completed = summary.completed
  const total = summary.total
  const totalMin = data.videos.reduce((s, v) => s + v.durationMin, 0)
  const watchedMin = Math.round((pct / 100) * totalMin)

  return (
    <Link
      href={akademiHref('videos')}
      className={clsx(
        'block rounded-2xl border p-4 shadow-sm transition active:scale-[0.99]',
        videoProgressAccent.border,
        videoProgressAccent.surface,
        videoProgressAccent.surfaceHover,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Film className={clsx('h-5 w-5 shrink-0', videoProgressAccent.textDark)} />
          <span className="truncate text-sm font-bold text-[var(--text-1)]">
            {t('videoTraining.panoStripTitle')}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={clsx('text-lg font-black tabular-nums', videoProgressAccent.textDark)}>%{pct}</span>
          <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
        </div>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div
          className={clsx('h-full rounded-full transition-all', videoProgressAccent.progress)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--text-2)]">
        {t('videoTraining.panoStripMeta', { watched: watchedMin, total: totalMin, completed, count: total })}
      </p>
    </Link>
  )
}
