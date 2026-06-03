'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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

const PAGE_SIZE = 9

export function VideolarContent() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const qc = useQueryClient()
  const isAdmin = !!ws?.isSuperAdmin
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingVideoAdmin | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['video-catalog', ws?.workspaceId],
    queryFn: () => getVideoCatalogAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 20_000,
  })

  const videos = data?.videos ?? []
  const totalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE))

  const activePage = Math.min(page, Math.max(0, totalPages - 1))

  const pageVideos = useMemo(() => {
    const start = activePage * PAGE_SIZE
    return videos.slice(start, start + PAGE_SIZE)
  }, [videos, activePage])

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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-[var(--text-1)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-brand dark:text-[var(--text-1)]" />
          {t('videoTraining.backToTraining')}
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-bold text-[var(--text-1)]">
            <Film className="h-5 w-5 text-brand dark:text-[var(--text-1)]" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageVideos.map(video => (
              <li key={video.key} className="min-h-[240px]">
                <TrainingVideoCard
                  video={video}
                  workspaceId={ws.workspaceId}
                  progress={data!.progressByKey[video.key]}
                  onProgressChange={invalidate}
                  isAdmin={isAdmin}
                  onEdit={() => { setEditing(video); setModalOpen(true) }}
                  onDelete={() => handleDelete(video)}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-2" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-current={activePage === i ? 'page' : undefined}
                  className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activePage === i
                      ? 'border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-1)] shadow-sm'
                      : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          )}
        </>
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
