'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Film, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { queryKeys } from '@/lib/query/keys'
import {
  getVideoCatalogAction,
  deleteTrainingVideoAction,
  type TrainingVideoAdmin,
} from '@/app/(dashboard)/egitim/videoActions'
import { TrainingVideoCard } from './TrainingVideoCard'
import { VideoEditModal } from './VideoEditModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const PAGE_SIZE = 9

export function VideolarContent({
  embedded = false,
  addFormOpen: addFormOpenProp,
  onAddFormOpenChange,
}: {
  embedded?: boolean
  addFormOpen?: boolean
  onAddFormOpenChange?: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const qc = useQueryClient()
  const isAdmin = !!ws?.isSuperAdmin
  const [internalModalOpen, setInternalModalOpen] = useState(false)
  const modalOpen = addFormOpenProp ?? internalModalOpen
  const setModalOpen = onAddFormOpenChange ?? setInternalModalOpen

  const [editing, setEditing] = useState<TrainingVideoAdmin | null>(null)
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    if (addFormOpenProp) setEditing(null)
  }, [addFormOpenProp])
  const [deletingVideo, setDeletingVideo] = useState<TrainingVideoAdmin | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.videoCatalog(ws?.workspaceId ?? ''),
    queryFn: () => getVideoCatalogAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 5 * 60_000,
  })

  const totalPages = Math.max(1, Math.ceil((data?.videos?.length ?? 0) / PAGE_SIZE))

  const activePage = Math.min(page, Math.max(0, totalPages - 1))

  const pageVideos = useMemo(() => {
    const vids = data?.videos ?? []
    const start = activePage * PAGE_SIZE
    return vids.slice(start, start + PAGE_SIZE)
  }, [data?.videos, activePage])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.videoCatalog(ws?.workspaceId ?? '') })
    qc.invalidateQueries({ queryKey: ['pulse-my', ws?.workspaceId] })
  }

  async function handleConfirmDelete() {
    if (!deletingVideo) return
    const video = deletingVideo
    setDeletingVideo(null)
    try {
      await deleteTrainingVideoAction(video.id)
      toast.success(t('videoTraining.videoDeleted'))
      invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('videoTraining.deleteFailed'))
    }
  }

  if (!ws?.workspaceId) return null

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 px-4 py-6 sm:px-6'}>
      <header className="space-y-2">
        {!embedded && (
        <Link
          href="/egitim"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-readable hover:underline"
        >
          <ArrowLeft className="h-4 w-4 text-brand-readable" />
          {t('videoTraining.backToTraining')}
        </Link>
        )}
        {!embedded && (
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--text-1)]">
            <Film className="h-5 w-5 text-brand-readable" />
            {t('videoTraining.pageTitle')}
          </h1>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setEditing(null); setModalOpen(true) }}
              className="flex items-center gap-1.5 rounded-xl bg-[#3730A3] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#28227d] active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('videoTraining.addVideoShort')}</span>
            </button>
          )}
        </div>
        )}
        {!embedded && (
        <p className="text-base text-[var(--text-3)]">{t('videoTraining.pageSubtitle')}</p>
        )}
        {data && (
          <p className="text-sm font-bold text-[var(--text-2)]">
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
                  onEdit={() => setEditing(video)}
                  onDelete={() => setDeletingVideo(video)}
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
                  className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-bold transition ${
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

      {(modalOpen || editing) && (
        <VideoEditModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={invalidate}
        />
      )}

      {deletingVideo && (
        <ConfirmDialog
          message={t('videoTraining.confirmDelete', { title: deletingVideo.titleTr })}
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingVideo(null)}
        />
      )}
    </div>
  )
}
