import { describe, expect, it } from 'vitest'
import { deriveVideoContinueFromCatalog } from '@/lib/domain/videoContinue'
import type { VideoCatalogPayload } from '@/app/(dashboard)/egitim/videoActions'

function catalog(
  videos: { key: string; sortOrder: number; titleTr: string; titleEn: string }[],
  progress: VideoCatalogPayload['progressByKey'],
): VideoCatalogPayload {
  return {
    videos: videos.map(v => ({
      ...v,
      id: v.key,
      categoryTr: 'K',
      categoryEn: 'K',
      descriptionTr: '',
      descriptionEn: '',
      youtubeId: 'abc',
      durationMin: 10,
    })),
    progressByKey: progress,
    summary: { total: videos.length, completed: 0, pct: 0, startedIncomplete: 0, notStarted: videos.length },
  }
}

describe('deriveVideoContinueFromCatalog', () => {
  it('prefers in-progress video over first untouched in catalog order', () => {
    const data = catalog(
      [
        { key: 'v1', sortOrder: 1, titleTr: '1 · Hayaller', titleEn: '1 · Dreams' },
        { key: 'v3', sortOrder: 3, titleTr: '3 · Gelişim', titleEn: '3 · Growth' },
      ],
      {
        v3: { video_key: 'v3', status: 'started', watch_percent: 2, started_at: '2026-06-01', completed_at: null },
      },
    )
    const { nextVideo } = deriveVideoContinueFromCatalog(data)
    expect(nextVideo?.key).toBe('v3')
  })

  it('falls back to first incomplete when nothing in progress', () => {
    const data = catalog(
      [
        { key: 'v1', sortOrder: 1, titleTr: '1 · Hayaller', titleEn: '1 · Dreams' },
        { key: 'v2', sortOrder: 2, titleTr: '2 · Liste', titleEn: '2 · List' },
      ],
      {},
    )
    const { nextVideo } = deriveVideoContinueFromCatalog(data)
    expect(nextVideo?.key).toBe('v1')
  })
})
