import type { VideoCatalogPayload } from '@/app/(dashboard)/egitim/videoActions'
import { VIDEO_COMPLETE_PERCENT } from '@/lib/domain/videoProgress'

export type VideoContinueHighlight = {
  key: string
  titleTr: string
  titleEn: string
}

function isVideoComplete(
  progress: VideoCatalogPayload['progressByKey'][string] | undefined,
): boolean {
  if (!progress) return false
  return progress.status === 'completed' || (progress.watch_percent ?? 0) >= VIDEO_COMPLETE_PERCENT
}

export function deriveVideoContinueFromCatalog(
  catalog: VideoCatalogPayload | undefined,
): { lastWatched: VideoContinueHighlight | null; nextVideo: VideoContinueHighlight | null } {
  if (!catalog?.videos?.length) {
    return { lastWatched: null, nextVideo: null }
  }

  const sorted = [...catalog.videos].sort((a, b) => a.sortOrder - b.sortOrder)
  let lastWatched: VideoContinueHighlight | null = null
  let lastCompletedAt = ''

  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    const done = isVideoComplete(p)
    const at = p?.completed_at ?? p?.started_at ?? ''
    if (done && at >= lastCompletedAt) {
      lastCompletedAt = at
      lastWatched = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
    }
  }

  // Yarım kalan video: en yüksek izleme yüzdesi, eşitlikte sıradaki (sortOrder).
  let resumeVideo: (typeof sorted)[number] | null = null
  let resumePct = 0
  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    if (isVideoComplete(p)) continue
    const pct = p?.watch_percent ?? 0
    if (pct <= 0) continue
    if (pct > resumePct || (pct === resumePct && v.sortOrder < (resumeVideo?.sortOrder ?? Infinity))) {
      resumePct = pct
      resumeVideo = v
    }
  }

  let nextVideo: VideoContinueHighlight | null = null
  if (resumeVideo) {
    nextVideo = { key: resumeVideo.key, titleTr: resumeVideo.titleTr, titleEn: resumeVideo.titleEn }
  } else {
    for (const v of sorted) {
      if (!isVideoComplete(catalog.progressByKey[v.key])) {
        nextVideo = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
        break
      }
    }
  }

  return { lastWatched, nextVideo }
}
