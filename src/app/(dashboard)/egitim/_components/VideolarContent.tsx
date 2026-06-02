'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Film, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  getVideoCatalogAction,
  deleteTrainingVideoAction,
  type TrainingVideoAdmin,
} from '@/app/(dashboard)/egitim/videoActions'
import { TrainingVideoCard } from './TrainingVideoCard'
import { VideoEditModal } from './VideoEditModal'
import { Skeleton } from '@/components/ui/Skeleton'

export function VideolarContent() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const qc = useQueryClient()
  const isAdmin = !!ws?.isSuperAdmin
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingVideoAdmin | null>(null)

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

  async function handleDelete(video: TrainingVideoAdmin) {
    if (!window.confirm(`"${video.titleTr}" videosunu silmek istediğine emin misin?`)) return
    try {
      await deleteTrainingVideoAction(video.id)
      toast.success('Video silindi.')
      invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Silme başarısız.')
    }
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
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-bold text-[var(--text-1)]">
            <Film className="h-5 w-5 text-brand" />
            {t('videoTraining.pageTitle')}
          </h1>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setEditing(null); setModalOpen(true) }}
              title="Yeni video ekle"
              aria-label="Yeni video ekle"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3730A3] hover:bg-[#28227d] text-white shadow-sm transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
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
                isAdmin={isAdmin}
                onEdit={() => { setEditing(video); setModalOpen(true) }}
                onDelete={() => handleDelete(video)}
              />
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <VideoEditModal
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={invalidate}
        />
      )}
    </div>
  )
}
