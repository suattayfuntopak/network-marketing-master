import { describe, it, expect } from 'vitest'
import { getPageHelp, resolvePageHelpContext } from './pageHelp'
import { NAV_ROUTES, NAV_ADMIN } from './navigation'

/**
 * Konvansiyon kalkanı: her ana dashboard rotası PageHelp'te kendi (generic
 * olmayan) girdisine sahip olmalı. Yeni sayfa eklenip pageHelp.ts unutulursa
 * bu test kırmızı yanar (AGENTS.md → "Sayfa yardımı (PageHelp)").
 */
const GENERIC_TITLES = { tr: 'Yardım', en: 'Help' } as const

const ROUTES = [...NAV_ROUTES, NAV_ADMIN.href, '/musteriler', '/duyurular']

describe('pageHelp coverage', () => {
  for (const route of ROUTES) {
    it(`'${route}' için TR + EN özel yardım girdisi var`, () => {
      const tr = getPageHelp(route, 'tr')
      const en = getPageHelp(route, 'en')
      expect(tr.title, `${route} TR generic'e düşüyor`).not.toBe(GENERIC_TITLES.tr)
      expect(en.title, `${route} EN generic'e düşüyor`).not.toBe(GENERIC_TITLES.en)
      expect(tr.steps.length).toBeGreaterThan(0)
      expect(en.steps.length).toBeGreaterThan(0)
    })
  }

  it('Ekibim sekmeleri farklı yardım metni döner', () => {
    const members = getPageHelp('/ekip', 'tr', 'members')
    const summary = getPageHelp('/ekip', 'tr', 'summary')
    expect(members.title).not.toBe(summary.title)
  })

  it('resolvePageHelpContext varsayılan sekmeleri döner', () => {
    expect(resolvePageHelpContext('/ekip', null)).toBe('members')
    expect(resolvePageHelpContext('/saha-radar', null)).toBe('takipler')
    expect(resolvePageHelpContext('/saha-radar', 'aktivite')).toBe('aktivite')
  })
})
