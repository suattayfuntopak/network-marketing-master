import type { VideoCatalogPayload } from '@/app/(dashboard)/egitim/videoActions'
import { VIDEO_COMPLETE_PERCENT } from '@/lib/domain/videoProgress'

export type VideoContinueHighlight = {
  key: string
  titleTr: string
  titleEn: string
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
    const done = p?.status === 'completed' || (p?.watch_percent ?? 0) >= VIDEO_COMPLETE_PERCENT
    const at = p?.completed_at ?? p?.started_at ?? ''
    if (done && at >= lastCompletedAt) {
      lastCompletedAt = at
      lastWatched = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
    }
  }

  let nextVideo: VideoContinueHighlight | null = null
  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    const done = p?.status === 'completed' || (p?.watch_percent ?? 0) >= VIDEO_COMPLETE_PERCENT
    if (!done) {
      nextVideo = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
      break
    }
  }

  return { lastWatched, nextVideo }
}
