'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Play, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Z } from '@/lib/ui/zIndex'
import { extractYouTubeVideoId } from '@/lib/domain/videoTraining'
import {
  localizedVideoDescription,
  localizedVideoTitle,
  type TrainingVideoDef,
} from '@/lib/domain/trainingVideos'
import { VIDEO_COMPLETE_PERCENT, type VideoProgressRow } from '@/lib/domain/videoProgress'
import { WhatsAppShareButton } from '@/components/ui/WhatsAppShareButton'
import { reportVideoWatchAction } from '@/app/(dashboard)/egitim/videoActions'

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
  'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-bold transition min-w-0'

// ───────────────────────── YouTube IFrame API ─────────────────────────
interface YTPlayer {
  getDuration?: () => number
  getCurrentTime?: () => number
  destroy?: () => void
}
interface YTStateEvent {
  data: number
}
interface YTPlayerOptions {
  videoId: string
  host?: string
  playerVars?: Record<string, number>
  events?: { onStateChange?: (e: YTStateEvent) => void }
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer
  PlayerState: { PLAYING: number; ENDED: number }
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise<YTNamespace>(resolve => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      if (window.YT) resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return ytApiPromise
}

export function TrainingVideoCard({ video, workspaceId, progress, onProgressChange, isAdmin, onEdit, onDelete }: Props) {
  const { lang, t } = useTranslation()
  const [showEmbed, setShowEmbed] = useState(false)
  const [localPct, setLocalPct] = useState(0)
  const playerHostRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(showEmbed)

  const savedPct = progress?.watch_percent ?? 0
  const isCompleted = progress?.status === 'completed' || savedPct >= VIDEO_COMPLETE_PERCENT
  const displayPct = isCompleted ? 100 : Math.max(localPct, savedPct)
  const hasRelated = !!video.relatedTrainingId
  const cleanId = extractYouTubeVideoId(video.youtubeId) ?? video.youtubeId

  const relatedHref = hasRelated
    ? /^\d+$/.test(video.relatedTrainingId!)
      ? `/egitim?tab=objections&id=${video.relatedTrainingId}`
      : `/egitim?id=${video.relatedTrainingId}`
    : '#'

  // YouTube oynatıcısını kur ve gerçek izleme yüzdesini takip et.
  useEffect(() => {
    if (!showEmbed) return
    const host = playerHostRef.current
    if (!host) return

    let player: YTPlayer | null = null
    let timer: ReturnType<typeof setInterval> | null = null
    let maxPct = savedPct
    let cancelled = false

    const sample = () => {
      if (!player?.getDuration) return
      const dur = player.getDuration() ?? 0
      const cur = player.getCurrentTime?.() ?? 0
      if (dur > 0) {
        const pct = Math.min(100, Math.round((cur / dur) * 100))
        if (pct > maxPct) {
          maxPct = pct
          setLocalPct(maxPct)
        }
      }
    }

    const persist = (ended: boolean) => {
      if (!ended && maxPct <= savedPct) return
      reportVideoWatchAction(workspaceId, video.key, maxPct, ended)
        .then(() => onProgressChange())
        .catch(() => {})
    }

    loadYouTubeApi()
      .then(YT => {
        if (cancelled || !playerHostRef.current) return
        player = new YT.Player(playerHostRef.current, {
          videoId: cleanId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onStateChange: e => {
              if (e.data === YT.PlayerState.PLAYING) {
                if (!timer) timer = setInterval(sample, 1000)
              } else {
                if (timer) {
                  clearInterval(timer)
                  timer = null
                }
                sample()
                persist(e.data === YT.PlayerState.ENDED)
              }
            },
          },
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      sample()
      persist(false)
      try {
        player?.destroy?.()
      } catch {
        /* oynatıcı zaten yok edilmiş olabilir */
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [showEmbed, cleanId, video.key, workspaceId])

  return (
    <>
      <article className="relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className={`absolute right-2.5 top-2.5 ${Z.cardControls} flex items-center gap-1`}>
          {/* Herkese açık: bu videoyu bir kişiye WhatsApp ile öner (en solda) */}
          <WhatsAppShareButton
            text={t('videoTraining.waRecommend', {
              title: localizedVideoTitle(video, lang),
              url: `https://youtu.be/${cleanId}`,
            })}
            title={t('videoTraining.waShareTitle')}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm transition hover:bg-[#E7FBF0] hover:text-[#1a9e4f] dark:hover:bg-[#0d2e1a]/40 dark:hover:text-[#4ade80]"
          />
          {isAdmin && (
            <>
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
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 pr-4">
          <p className="pr-14 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {lang === 'en' ? video.categoryEn : video.categoryTr}
          </p>
          <h3 className="mt-1 line-clamp-2 pr-14 text-base font-bold text-[var(--text-1)]">
            {localizedVideoTitle(video, lang)}
          </h3>
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-[var(--text-3)]">
            {localizedVideoDescription(video, lang)} · ~{video.durationMin} {lang === 'en' ? 'min' : 'dk'}
          </p>

          {/* Video ve İlgili Konu — kutuyu eşit ikiye böler */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmbed(true)}
              className={`${actionBtn} bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white shadow-sm shadow-pink-500/15 transition active:scale-95 cursor-pointer`}
            >
              <Play className="h-4 w-4" />
              {t('videoTraining.watchVideoBtn')}
            </button>
            {hasRelated ? (
              <Link
                href={relatedHref}
                className={`${actionBtn} border border-[var(--border)] text-rose-600 dark:text-rose-400 hover:border-rose-500/40 dark:hover:border-rose-400/40`}
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

          {displayPct > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    {t('videoTraining.finishedLabel')}
                  </span>
                ) : (
                  <span className="text-[var(--text-3)]">
                    {t('videoTraining.watchedLabel')} · {t('videoTraining.notFinished')}
                  </span>
                )}
                <span className="tabular-nums text-[var(--text-2)]">{displayPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-rose-500 dark:bg-rose-500'}`}
                  style={{ width: `${displayPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </article>

      {showEmbed && (
        <div
          className={`fixed inset-0 ${Z.fullscreen} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}
          onClick={() => setShowEmbed(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-base font-bold text-[var(--text-1)] line-clamp-1 pr-2">
                {t('videoTraining.watchVideoTitle')} — {localizedVideoTitle(video, lang)}
              </h3>
              <button
                type="button"
                onClick={() => setShowEmbed(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="px-4 pt-2 text-xs text-[var(--text-3)]">{t('videoTraining.embedPrivacy')}</p>
            <div className="p-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <div ref={playerHostRef} className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
