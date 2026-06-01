/**
 * Third-party YouTube training videos (F3 prep).
 * No creator API key required for basic embed; progress via events (F2/F3).
 */

/** Privacy-enhanced embed — no youtube.com cookies on first load. */
export function youtubeEmbedUrl(videoId: string): string {
  const id = videoId.trim().replace(/^.*(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11}).*$/, '$1')
  return `https://www.youtube-nocookie.com/embed/${id}`
}

export function extractYouTubeVideoId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? null
}

/**
 * F3 tracking without creator API:
 * 1) User taps "İzlemeye başladım" / "Tamamladım" → nmm_learning_events
 * 2) Optional: Google IFrame Player API (app-owned key) for approximate %
 */
