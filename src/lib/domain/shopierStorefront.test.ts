import { describe, it, expect } from 'vitest'
import {
  loadShopierProductMap,
  getStorefrontProduct,
  buildStorefrontRedirectUrl,
  resolvePlanFromProductId,
  extractWorkspaceIdFromNote,
  productKey,
} from './shopierStorefront'

const MAP_JSON = JSON.stringify({
  leader_monthly: { url: 'https://www.shopier.com/NMM/basic-aylik', productId: '111' },
  master_yearly: { url: 'https://www.shopier.com/NMM/plus-yillik', productId: 222 },
  pro_monthly: { url: 'https://www.shopier.com/NMM/pro-aylik', productId: '333' },
})

describe('loadShopierProductMap', () => {
  it('parses valid env JSON and coerces numeric productId to string', () => {
    const map = loadShopierProductMap(MAP_JSON)
    expect(map.leader_monthly).toEqual({ url: 'https://www.shopier.com/NMM/basic-aylik', productId: '111' })
    expect(map.master_yearly?.productId).toBe('222')
  })

  it('returns empty object for missing or invalid JSON', () => {
    expect(loadShopierProductMap(undefined)).toEqual({})
    expect(loadShopierProductMap('not json')).toEqual({})
    expect(loadShopierProductMap('123')).toEqual({})
  })

  it('skips entries missing url or productId', () => {
    const map = loadShopierProductMap(JSON.stringify({ leader_monthly: { url: 'x' }, pro_yearly: { productId: '9' } }))
    expect(map).toEqual({})
  })
})

describe('getStorefrontProduct', () => {
  it('looks up by plan + period', () => {
    const map = loadShopierProductMap(MAP_JSON)
    expect(getStorefrontProduct('master', 'yearly', map)?.productId).toBe('222')
    expect(getStorefrontProduct('pro', 'yearly', map)).toBeNull()
  })
})

describe('buildStorefrontRedirectUrl', () => {
  it('appends quantity=1 and note, encoding the note', () => {
    const note = 'abcdefghij_pro_monthly_1700000000'
    const url = buildStorefrontRedirectUrl('https://www.shopier.com/NMM/pro-aylik', note)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('quantity')).toBe('1')
    expect(parsed.searchParams.get('note')).toBe(note)
  })

  it('preserves an existing query string', () => {
    const url = buildStorefrontRedirectUrl('https://www.shopier.com/NMM/x?ref=ad', 'ws_pro_monthly_1')
    const parsed = new URL(url)
    expect(parsed.searchParams.get('ref')).toBe('ad')
    expect(parsed.searchParams.get('note')).toBe('ws_pro_monthly_1')
  })
})

describe('resolvePlanFromProductId', () => {
  const map = loadShopierProductMap(MAP_JSON)

  it('reverse-maps productId to plan/period/days', () => {
    expect(resolvePlanFromProductId('111', map)).toEqual({ plan: 'leader', period: 'monthly', daysToAdd: 30 })
    expect(resolvePlanFromProductId('222', map)).toEqual({ plan: 'master', period: 'yearly', daysToAdd: 365 })
  })

  it('returns null for unknown productId (no upgrade)', () => {
    expect(resolvePlanFromProductId('999', map)).toBeNull()
    expect(resolvePlanFromProductId('', map)).toBeNull()
  })
})

describe('extractWorkspaceIdFromNote', () => {
  it('takes only the first segment as workspaceId', () => {
    expect(extractWorkspaceIdFromNote('abcdefghij_pro_yearly_1700000000')).toBe('abcdefghij')
  })

  it('rejects short / empty notes', () => {
    expect(extractWorkspaceIdFromNote('short_pro_monthly_1')).toBeNull()
    expect(extractWorkspaceIdFromNote(null)).toBeNull()
    expect(extractWorkspaceIdFromNote('')).toBeNull()
  })

  it('ignores plan/period in the note (tier never comes from here)', () => {
    // note pro dese bile bu fonksiyon yalnız workspaceId verir
    expect(extractWorkspaceIdFromNote('0123456789abcdef_pro_yearly_1')).toBe('0123456789abcdef')
  })
})

describe('productKey', () => {
  it('builds the composite key', () => {
    expect(productKey('master', 'monthly')).toBe('master_monthly')
  })
})
