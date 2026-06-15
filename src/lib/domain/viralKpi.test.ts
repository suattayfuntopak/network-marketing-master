import { describe, it, expect } from 'vitest'
import { aggregateViralKpi, type ViralEventRow } from '@/lib/domain/viralKpi'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'

const TODAY = '2026-06-15'

function row(eventName: string, userId: string | null, day = TODAY): ViralEventRow {
  return { eventName, userId, day }
}

describe('aggregateViralKpi', () => {
  it('boş giriş → tüm metrikler 0', () => {
    const k = aggregateViralKpi([], TODAY)
    expect(k).toMatchObject({
      invitesSent: 0,
      landingViews: 0,
      accepted: 0,
      distinctInviters: 0,
      conversionPct: 0,
      kFactor: 0,
      activeUsers: 0,
      dau: 0,
    })
  })

  it('davet hunisini sayar (gönderildi/görüntülendi/kabul)', () => {
    const rows = [
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteSent, 'u2'),
      row(PRODUCT_EVENTS.inviteLandingView, null),
      row(PRODUCT_EVENTS.inviteLandingView, null),
      row(PRODUCT_EVENTS.inviteAccepted, null),
    ]
    const k = aggregateViralKpi(rows, TODAY)
    expect(k.invitesSent).toBe(3)
    expect(k.landingViews).toBe(2)
    expect(k.accepted).toBe(1)
    expect(k.distinctInviters).toBe(2)
  })

  it('dönüşüm % = kabul/gönderilen', () => {
    const rows = [
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteAccepted, null),
    ]
    expect(aggregateViralKpi(rows, TODAY).conversionPct).toBe(25)
  })

  it('K-faktör = kabul/ayrı davet eden (2 ondalık)', () => {
    const rows = [
      row(PRODUCT_EVENTS.inviteSent, 'u1'),
      row(PRODUCT_EVENTS.inviteSent, 'u2'),
      row(PRODUCT_EVENTS.inviteAccepted, null),
      row(PRODUCT_EVENTS.inviteAccepted, null),
      row(PRODUCT_EVENTS.inviteAccepted, null),
    ]
    // 3 kabul / 2 davet eden = 1.5
    expect(aggregateViralKpi(rows, TODAY).kFactor).toBe(1.5)
  })

  it('DAU bugünkü ayrı aktif kullanıcı; activeUsers tüm pencere', () => {
    const rows = [
      row(PRODUCT_EVENTS.dailyActive, 'u1', TODAY),
      row(PRODUCT_EVENTS.dailyActive, 'u2', TODAY),
      row(PRODUCT_EVENTS.dailyActive, 'u2', '2026-06-14'),
      row(PRODUCT_EVENTS.dailyActive, 'u3', '2026-06-10'),
    ]
    const k = aggregateViralKpi(rows, TODAY)
    expect(k.activeUsers).toBe(3)
    expect(k.dau).toBe(2)
  })

  it('davet eden yoksa K-faktör 0 (sıfıra bölme yok)', () => {
    const rows = [row(PRODUCT_EVENTS.inviteAccepted, null)]
    expect(aggregateViralKpi(rows, TODAY).kFactor).toBe(0)
  })

  it('windowDays parametresi yansıtılır', () => {
    expect(aggregateViralKpi([], TODAY, 7).windowDays).toBe(7)
  })
})
