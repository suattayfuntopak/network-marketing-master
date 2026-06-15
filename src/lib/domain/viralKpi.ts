import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'

/** Bir gün anahtarı (İstanbul) ile etiketlenmiş tek ürün olayı satırı. */
export interface ViralEventRow {
  eventName: string
  userId: string | null
  /** İstanbul takvim günü (YYYY-MM-DD) — DAU/WAU için. */
  day: string
}

export interface ViralKpi {
  /** Pencere boyu (gün). */
  windowDays: number
  /** Paylaşılan davet linki sayısı. */
  invitesSent: number
  /** Davet linki açılıp sponsor karşılaması görülen sayısı. */
  landingViews: number
  /** Davet koduyla tamamlanan kayıt sayısı. */
  accepted: number
  /** Davet gönderen ayrı kullanıcı sayısı (K-faktör paydası). */
  distinctInviters: number
  /** accepted / invitesSent (%) — davet→kayıt dönüşümü. */
  conversionPct: number
  /** accepted / distinctInviters — davet eden başına yeni kayıt (K-faktör proxy'si). */
  kFactor: number
  /** Pencerede en az 1 gün aktif olan ayrı kullanıcı (aktif taban). */
  activeUsers: number
  /** Bugün aktif ayrı kullanıcı (DAU). */
  dau: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Ürün olaylarından viralite KPI'larını türetir (SAF — DB'siz, test edilebilir).
 * Tüm sayımlar verilen pencere içindeki satırlardan; gün anahtarları İstanbul.
 */
export function aggregateViralKpi(
  rows: ViralEventRow[],
  todayKey: string,
  windowDays = 30,
): ViralKpi {
  let invitesSent = 0
  let landingViews = 0
  let accepted = 0
  const inviters = new Set<string>()
  const activeUserSet = new Set<string>()
  const dauSet = new Set<string>()

  for (const r of rows) {
    switch (r.eventName) {
      case PRODUCT_EVENTS.inviteSent:
        invitesSent++
        if (r.userId) inviters.add(r.userId)
        break
      case PRODUCT_EVENTS.inviteLandingView:
        landingViews++
        break
      case PRODUCT_EVENTS.inviteAccepted:
        accepted++
        break
      case PRODUCT_EVENTS.dailyActive:
        if (r.userId) {
          activeUserSet.add(r.userId)
          if (r.day === todayKey) dauSet.add(r.userId)
        }
        break
    }
  }

  const distinctInviters = inviters.size
  return {
    windowDays,
    invitesSent,
    landingViews,
    accepted,
    distinctInviters,
    conversionPct: invitesSent > 0 ? Math.round((accepted / invitesSent) * 100) : 0,
    kFactor: distinctInviters > 0 ? round2(accepted / distinctInviters) : 0,
    activeUsers: activeUserSet.size,
    dau: dauSet.size,
  }
}
