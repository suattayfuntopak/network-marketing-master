import { describe, it, expect } from 'vitest'
import { notificationTargetHref } from './notificationRoutes'

describe('notificationTargetHref', () => {
  it('opens pipeline detail when candidate_id is set', () => {
    expect(notificationTargetHref({ type: 'calendar', candidate_id: 'abc' })).toBe(
      '/pipeline/abc',
    )
  })

  it('falls back to ekip for team alerts without candidate_id', () => {
    expect(notificationTargetHref({ type: 'user', candidate_id: null })).toBe('/ekip')
    expect(notificationTargetHref({ type: 'alert', candidate_id: null })).toBe('/ekip')
  })

  it('routes new partner join to daily summary', () => {
    expect(
      notificationTargetHref({
        type: 'user',
        candidate_id: null,
        title_tr: 'Ekibinize yeni ortak katıldı!',
      }),
    ).toBe('/bugunku-takibim')
  })

  it('routes calendar without candidate to takvim', () => {
    expect(notificationTargetHref({ type: 'calendar', candidate_id: null })).toBe('/takvim')
  })
})
