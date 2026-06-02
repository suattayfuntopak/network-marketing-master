'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Play, Pencil, Trash2 } from 'lucide-react'
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
  /** Super admin: yazısız düzenle/sil ikon butonları gösterilir. */
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function TrainingVideoCard({ video, workspaceId, progress, onProgressChange, isAdmin, onEdit, onDelete }: Props) {
  const { lang, t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [localPct, setLocalPct] = useState<number | null>(null)

  const isCompleted = progress?.status === 'completed' || (progress?.watch_percent ?? 0) >= 90
  const isStarted = !!progress && !isCompleted
  const pct = localPct ?? progress?.watch_percent ?? 0

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
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
              {lang === 'en' ? video.categoryEn : video.categoryTr}
            </p>
            <h3 className="text-sm font-bold text-[var(--text-1)]">
              {localizedVideoTitle(video, lang)}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              {localizedVideoDescription(video, lang)} · ~{video.durationMin} min
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  title="Düzenle"
                  aria-label="Videoyu düzenle"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-brand transition"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  title="Sil"
                  aria-label="Videoyu sil"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-red-500/10 hover:text-red-500 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : isStarted ? (
              <Play className="h-5 w-5 text-brand" />
            ) : (
              <Circle className="h-5 w-5 text-[var(--text-3)]" />
            )}
          </div>
        </div>

        {video.relatedTrainingId && (
          <Link
            href={`/egitim?id=${video.relatedTrainingId}`}
            className="text-[11px] font-semibold text-brand hover:underline"
          >
            {t('videoTraining.relatedTopic')} →
          </Link>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || isCompleted}
            onClick={() => run(() => markVideoStartedAction(workspaceId, video.key))}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--text-2)] hover:border-brand/40 disabled:opacity-50"
          >
            {t('videoTraining.started')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => markVideoCompletedAction(workspaceId, video.key))}
            className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
          >
            {t('videoTraining.completed')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowEmbed(v => !v)}
            className="rounded-xl border border-brand/30 px-3 py-1.5 text-xs font-bold text-brand"
          >
            {showEmbed ? '−' : '+'} Video
          </button>
        </div>

        {(isStarted || pct > 0) && !isCompleted && (
          <div className="space-y-1">
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
          <div className="relative w-full overflow-hidden rounded-xl aspect-video">
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
