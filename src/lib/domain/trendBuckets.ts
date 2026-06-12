import type { PulsePeriod } from '@/lib/domain/pulse'

/**
 * Aday Kazanım İvmesi (kayıt trendi) barları — saf, test edilebilir mantık.
 * İstatistikler sayfasındaki dönem→kova hesabı buraya taşındı; tüm tarih
 * işlemleri İstanbul saatine (UTC+3) hizalanır.
 *
 * Dönem davranışı:
 * - today : günün 7 eşit dilimi (saat etiketleri)
 * - 7d    : son 7 gün (gün kısaltmaları)
 * - 30d   : son 30 gün (günlük barlar)
 * - ytd   : yılbaşından bu aya kadar aylık barlar
 * - all   : ilk adaydan bugüne TAKVİM ayı bazlı kovalar (her bar ayrı ay);
 *           18 aydan uzun aralıkta yıllık kovalara düşer.
 */
export type TrendBar = { label: string; count: number }

const ISTANBUL_OFFSET = 3 * 60 * 60 * 1000
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

type CandidateLike = { created_at: string }

export function buildCandidateTrendBars(
  candidates: ReadonlyArray<CandidateLike>,
  period: PulsePeriod,
  now: number,
): TrendBar[] {
  const todayIst = new Date(now + ISTANBUL_OFFSET)
  const todayYear = todayIst.getUTCFullYear()
  const todayMonth = todayIst.getUTCMonth()
  const todayDate = todayIst.getUTCDate()

  const istMs = (iso: string) => new Date(iso).getTime() + ISTANBUL_OFFSET
  const countOnDay = (date: Date) =>
    candidates.filter(c => {
      const cd = new Date(istMs(c.created_at))
      return (
        cd.getUTCFullYear() === date.getUTCFullYear() &&
        cd.getUTCMonth() === date.getUTCMonth() &&
        cd.getUTCDate() === date.getUTCDate()
      )
    }).length

  if (period === '30d') {
    const startDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDate))
    const endDate = new Date(Date.UTC(todayYear, todayMonth, todayDate))
    const dates: Date[] = []
    const curr = new Date(startDate)
    while (curr <= endDate) {
      dates.push(new Date(curr))
      curr.setUTCDate(curr.getUTCDate() + 1)
    }
    return dates.map(date => ({
      label: `${date.getUTCDate()} ${MONTHS_TR[date.getUTCMonth()]}`,
      count: countOnDay(date),
    }))
  }

  if (period === 'ytd') {
    const bars: TrendBar[] = []
    for (let m = 0; m <= todayMonth; m++) {
      const count = candidates.filter(c => {
        const cd = new Date(istMs(c.created_at))
        return cd.getUTCFullYear() === todayYear && cd.getUTCMonth() === m
      }).length
      bars.push({ label: MONTHS_TR[m], count })
    }
    return bars
  }

  if (period === 'all') {
    if (candidates.length === 0) return []
    const earliest = candidates.reduce(
      (min, c) => Math.min(min, new Date(c.created_at).getTime()),
      now,
    )
    const eIst = new Date(earliest + ISTANBUL_OFFSET)
    const startY = eIst.getUTCFullYear()
    const startM = eIst.getUTCMonth()
    const monthsSpan = (todayYear - startY) * 12 + (todayMonth - startM) + 1

    if (monthsSpan <= 18) {
      return Array.from({ length: monthsSpan }, (_, i) => {
        const y = startY + Math.floor((startM + i) / 12)
        const m = (startM + i) % 12
        const count = candidates.filter(c => {
          const cd = new Date(istMs(c.created_at))
          return cd.getUTCFullYear() === y && cd.getUTCMonth() === m
        }).length
        return { label: `${MONTHS_TR[m]} ${String(y).slice(2)}`, count }
      })
    }

    // 18 aydan uzun geçmiş → yıllık kovalar
    return Array.from({ length: todayYear - startY + 1 }, (_, i) => {
      const y = startY + i
      const count = candidates.filter(c => new Date(istMs(c.created_at)).getUTCFullYear() === y).length
      return { label: String(y), count }
    })
  }

  if (period === '7d') {
    const dates7d: Date[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(todayYear, todayMonth, todayDate))
      d.setUTCDate(d.getUTCDate() - i)
      dates7d.push(d)
    }
    return dates7d.map(date => {
      const dayIdx = (date.getUTCDay() + 6) % 7
      return { label: DAYS_TR[dayIdx], count: countOnDay(date) }
    })
  }

  // today: günün 7 eşit zaman dilimi
  const BUCKETS = 7
  const d = new Date(now + ISTANBUL_OFFSET)
  const startOfDayIst = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
  const start = startOfDayIst.getTime() - ISTANBUL_OFFSET

  const span = Math.max(now - start, 3_600_000)
  const step = span / BUCKETS

  return Array.from({ length: BUCKETS }, (_, idx) => {
    const bStart = start + idx * step
    const bEnd = idx === BUCKETS - 1 ? now + 1 : start + (idx + 1) * step
    const count = candidates.filter(c => {
      const t = new Date(c.created_at).getTime()
      return t >= bStart && t < bEnd
    }).length
    const dRef = new Date(bStart + ISTANBUL_OFFSET)
    const label = dRef.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    return { label, count }
  })
}
