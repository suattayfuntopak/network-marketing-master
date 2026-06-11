import { CANONICAL_VIDEO_COUNT } from '@/lib/domain/trainingVideos'

/**
 * Bir video yalnızca SONUNA kadar izlenince "tamamlandı" sayılır.
 * Otomatik takip (YouTube IFrame API) ENDED olayında %100 yazar; bu eşik,
 * oynatıcı sonu tam %100'e ulaşmadan bitirdiğinde de tamam kabul etmek içindir.
 */
export const VIDEO_COMPLETE_PERCENT = 98

export type VideoProgressRow = {
  video_key: string
  status: 'started' | 'completed'
  watch_percent: number
  position_sec?: number
  duration_sec?: number | null
  started_at?: string
  completed_at?: string | null
}

export type VideoProgressSummary = {
  completed: number
  startedIncomplete: number
  notStarted: number
  total: number
  pct: number
}

export function summarizeVideoProgress(
  catalogKeys: string[],
  byKey: Record<string, Pick<VideoProgressRow, 'status' | 'watch_percent'> | undefined>
): VideoProgressSummary {
  const total = catalogKeys.length || CANONICAL_VIDEO_COUNT
  let completed = 0
  let startedIncomplete = 0
  let notStarted = 0

  for (const key of catalogKeys) {
    const row = byKey[key]
    if (!row) {
      notStarted++
      continue
    }
    const done =
      row.status === 'completed' || row.watch_percent >= VIDEO_COMPLETE_PERCENT
    if (done) completed++
    else startedIncomplete++
  }

  return {
    completed,
    startedIncomplete,
    notStarted,
    total,
    pct: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
  }
}

/** Drop-off = started but not completed (coaching signal). */
export function videoDropoffCount(summary: VideoProgressSummary): number {
  return summary.startedIncomplete
}
