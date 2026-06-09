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
    ).toBe('/saha-ozetim?tab=daily')
  })

  it('routes calendar without candidate to takvim', () => {
    expect(notificationTargetHref({ type: 'calendar', candidate_id: null })).toBe('/takvim')
  })

  it('routes trial upgrade notifications to odeme basic deep link', () => {
    expect(
      notificationTargetHref({
        type: 'alert',
        candidate_id: null,
        title_tr: 'Deneme bitti — Basic ile devam et',
      }),
    ).toBe('/odeme?plan=basic')
    expect(
      notificationTargetHref({
        type: 'info',
        candidate_id: null,
        title_en: '3 days left on your trial',
      }),
    ).toBe('/odeme?plan=basic')
  })
})
