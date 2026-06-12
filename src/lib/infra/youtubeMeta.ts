/**
 * YouTube video meta verisi (sunucu tarafı, best-effort).
 *
 * `fetchYoutubeDurationMin` — watch sayfasındaki `lengthSeconds` alanından
 * gerçek süreyi (dakika) okur. Resmi Data API anahtarı GEREKTİRMEZ. Başarısız
 * olursa `null` döner; çağıran elle/tahminî değeri kullanmaya devam eder.
 * Yalnızca super admin video ekleme/düzenleme akışında çağrılır.
 */
export async function fetchYoutubeDurationMin(youtubeId: string): Promise<number | null> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'tr,en;q=0.8',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/"lengthSeconds":"(\d+)"/)
    if (!match) return null
    const sec = parseInt(match[1], 10)
    if (!Number.isFinite(sec) || sec <= 0) return null
    return Math.max(1, Math.round(sec / 60))
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
