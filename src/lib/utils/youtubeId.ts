/** YouTube URL'sinden (veya ham id'den) 11 karakterlik video id'sini çıkarır. */
export function extractYoutubeId(input: string): string {
  const raw = input.trim()
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = raw.match(p)
    if (m) return m[1]
  }
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 11)
}
