'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { youtubeEmbedUrl } from '@/lib/domain/videoTraining'
import {
  localizedVideoDescription,
  localizedVideoTitle,
  type TrainingVideoDef,
} from '@/lib/domain/trainingVideos'
import type { VideoProgressRow } from '@/lib/domain/videoProgress'
import {
  markVideoCompletedAction,
  markVideoStartedAction,
  updateVideoWatchPercentAction,
} from '@/app/(dashboard)/egitim/videoActions'

type Props = {
  video: TrainingVideoDef
  workspaceId: string
  progress?: VideoProgressRow
  onProgressChange: () => void
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

const actionBtn =
  'flex flex-1 items-center justify-center rounded-xl px-2 py-1.5 text-xs font-bold transition min-w-0'

export function TrainingVideoCard({ video, workspaceId, progress, onProgressChange, isAdmin, onEdit, onDelete }: Props) {
  const { lang, t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [localPct, setLocalPct] = useState<number | null>(null)

  const isCompleted = progress?.status === 'completed' || (progress?.watch_percent ?? 0) >= 90
  const isStarted = !!progress && !isCompleted
  const pct = localPct ?? progress?.watch_percent ?? 0
  const hasRelated = !!video.relatedTrainingId

  const relatedHref = hasRelated
    ? /^\d+$/.test(video.relatedTrainingId!)
      ? `/itirazlar?id=${video.relatedTrainingId}`
      : `/egitim?id=${video.relatedTrainingId}`
    : '#'

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
      onProgressChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
      {isAdmin && (
        <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Düzenle"
            aria-label="Videoyu düzenle"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] transition"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Sil"
            aria-label="Videoyu sil"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm hover:bg-red-500/10 hover:text-red-500 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4 pr-4">
        <p className="pr-14 text-[10px] font-bold uppercase tracking-wider text-brand dark:text-[var(--text-1)]">
          {lang === 'en' ? video.categoryEn : video.categoryTr}
        </p>
        <h3 className="mt-1 line-clamp-2 pr-14 text-sm font-bold text-[var(--text-1)]">
          {localizedVideoTitle(video, lang)}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-[var(--text-3)]">
          {localizedVideoDescription(video, lang)} · ~{video.durationMin} {lang === 'en' ? 'min' : 'dk'}
        </p>

        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            disabled={busy || isCompleted}
            onClick={() => run(() => markVideoStartedAction(workspaceId, video.key))}
            className={`${actionBtn} border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:border-brand/40 disabled:opacity-50`}
          >
            {t('videoTraining.started')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => markVideoCompletedAction(workspaceId, video.key))}
            className={`${actionBtn} bg-brand text-white hover:opacity-95 disabled:opacity-50`}
          >
            {t('videoTraining.completed')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowEmbed(v => !v)}
            className={`${actionBtn} border border-[var(--border)] text-brand dark:text-[var(--text-1)] hover:border-brand/40 dark:hover:border-[var(--border)]`}
          >
            {showEmbed ? t('videoTraining.hideVideo') : t('videoTraining.showVideo')}
          </button>
          {hasRelated ? (
            <Link
              href={relatedHref}
              className={`${actionBtn} border border-[var(--border)] text-brand dark:text-[var(--text-1)] hover:border-brand/40 dark:hover:border-[var(--border)]`}
            >
              {t('videoTraining.relatedTopic')}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled
              className={`${actionBtn} cursor-not-allowed border border-[var(--border)] text-[var(--text-3)] opacity-50`}
            >
              {t('videoTraining.relatedTopic')}
            </button>
          )}
        </div>

        {(isStarted || pct > 0) && !isCompleted && (
          <div className="mt-3 space-y-1">
            <label className="text-[10px] font-bold text-[var(--text-3)]">
              {t('videoTraining.watchProgress')}: {pct}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              disabled={busy}
              onChange={e => setLocalPct(Number(e.target.value))}
              onMouseUp={() => {
                const value = localPct ?? pct
                run(async () => {
                  await updateVideoWatchPercentAction(workspaceId, video.key, value)
                  setLocalPct(null)
                })
              }}
              onTouchEnd={() => {
                const value = localPct ?? pct
                run(async () => {
                  await updateVideoWatchPercentAction(workspaceId, video.key, value)
                  setLocalPct(null)
                })
              }}
              className="w-full accent-brand"
            />
          </div>
        )}
      </div>

      {showEmbed && (
        <div className="border-t border-[var(--border)] bg-black/5 dark:bg-black/20 p-2">
          <p className="px-2 pb-2 text-[9px] text-[var(--text-3)]">{t('videoTraining.embedPrivacy')}</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <iframe
              title={localizedVideoTitle(video, lang)}
              src={`${youtubeEmbedUrl(video.youtubeId)}?rel=0`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
    </article>
  )
}
