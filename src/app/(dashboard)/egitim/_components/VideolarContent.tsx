'use client'

import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Film } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import { TrainingVideoCard } from './TrainingVideoCard'
import { Skeleton } from '@/components/ui/Skeleton'

export function VideolarContent() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['video-catalog', ws?.workspaceId],
    queryFn: () => getVideoCatalogAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 20_000,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['video-catalog', ws?.workspaceId] })
    qc.invalidateQueries({ queryKey: ['pulse-my', ws?.workspaceId] })
  }

  if (!ws?.workspaceId) return null

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-2">
        <Link
          href="/egitim"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('videoTraining.backToTraining')}
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-bold text-[var(--text-1)]">
          <Film className="h-5 w-5 text-brand" />
          {t('videoTraining.pageTitle')}
        </h1>
        <p className="text-sm text-[var(--text-3)]">{t('videoTraining.pageSubtitle')}</p>
        {data && data.summary.startedIncomplete > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('videoTraining.dropoffHint', { count: data.summary.startedIncomplete })}
          </p>
        )}
        {data && (
          <p className="text-xs font-bold text-[var(--text-2)]">
            {data.summary.completed} / {data.summary.total} · {data.summary.pct}%
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.videos.map(video => (
            <li key={video.key}>
              <TrainingVideoCard
                video={video}
                workspaceId={ws.workspaceId}
                progress={data.progressByKey[video.key]}
                onProgressChange={invalidate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
