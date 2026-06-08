import { describe, expect, it } from 'vitest'
import {
  resolveIlgilenRedirect,
  resolveLegacySummaryRedirect,
} from './legacyRouteRedirects'

describe('legacyRouteRedirects', () => {
  it('maps ilgilen tabs', () => {
    expect(resolveIlgilenRedirect(null)).toBe('/hedefim')
    expect(resolveIlgilenRedirect('daily')).toBe('/saha-ozetim?tab=daily')
    expect(resolveIlgilenRedirect('weekly')).toBe('/saha-ozetim?tab=weekly')
    expect(resolveIlgilenRedirect('unknown')).toBe('/hedefim')
  })

  it('maps legacy summary paths with offset', () => {
    expect(resolveLegacySummaryRedirect('/bugunku-takibim', null)).toBe(
      '/saha-ozetim?tab=daily',
    )
    expect(resolveLegacySummaryRedirect('/haftalik-ozet', '2')).toBe(
      '/saha-ozetim?tab=weekly&offset=2',
    )
    expect(resolveLegacySummaryRedirect('/pano', null)).toBeNull()
  })
})
