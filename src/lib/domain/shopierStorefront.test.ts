import { describe, it, expect } from 'vitest'
import {
  loadShopierProductMap,
  getStorefrontProduct,
  buildStorefrontRedirectUrl,
  resolvePlanFromProductId,
  extractWorkspaceIdFromNote,
  productKey,
} from './shopierStorefront'

// Env anahtarları basic/plus/pro (= PlanId; DB license_type ile birebir).
const MAP_JSON = JSON.stringify({
  basic_monthly: { url: 'https://www.shopier.com/networkmarketingmaster/47695583', productId: '47695583' },
  plus_yearly: { url: 'https://www.shopier.com/networkmarketingmaster/47695729', productId: 47695729 },
  pro_monthly: { url: 'https://www.shopier.com/networkmarketingmaster/47695997', productId: '47695997' },
})

describe('loadShopierProductMap', () => {
  it('parses valid env JSON and coerces numeric productId to string', () => {
    const map = loadShopierProductMap(MAP_JSON)
    expect(map.basic_monthly).toEqual({
      url: 'https://www.shopier.com/networkmarketingmaster/47695583',
      productId: '47695583',
    })
    expect(map.plus_yearly?.productId).toBe('47695729')
  })

  it('ignores legacy leader/master keys (only basic/plus/pro accepted)', () => {
    const map = loadShopierProductMap(
      JSON.stringify({ leader_monthly: { url: 'x', productId: '1' }, master_yearly: { url: 'y', productId: '2' } })
    )
    expect(map).toEqual({})
  })

  it('returns empty object for missing or invalid JSON', () => {
    expect(loadShopierProductMap(undefined)).toEqual({})
    expect(loadShopierProductMap('not json')).toEqual({})
    expect(loadShopierProductMap('123')).toEqual({})
  })

  it('skips entries missing url or productId or with unknown keys', () => {
    const map = loadShopierProductMap(
      JSON.stringify({ basic_monthly: { url: 'x' }, pro_yearly: { productId: '9' }, junk_key: { url: 'a', productId: 'b' } })
    )
    expect(map).toEqual({})
  })
})

describe('getStorefrontProduct', () => {
  it('looks up by plan (license_type) + period', () => {
    const map = loadShopierProductMap(MAP_JSON)
    expect(getStorefrontProduct('plus', 'yearly', map)?.productId).toBe('47695729')
    expect(getStorefrontProduct('pro', 'yearly', map)).toBeNull()
  })
})

describe('buildStorefrontRedirectUrl', () => {
  it('appends quantity=1 and note', () => {
    const note = 'abcdefghij_pro_monthly_1700000000'
    const url = buildStorefrontRedirectUrl('https://www.shopier.com/networkmarketingmaster/47695997', note)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('quantity')).toBe('1')
    expect(parsed.searchParams.get('note')).toBe(note)
  })

  it('preserves an existing query string', () => {
    const url = buildStorefrontRedirectUrl('https://www.shopier.com/nmm/x?ref=ad', 'ws_pro_monthly_1')
    const parsed = new URL(url)
    expect(parsed.searchParams.get('ref')).toBe('ad')
    expect(parsed.searchParams.get('note')).toBe('ws_pro_monthly_1')
  })
})

describe('resolvePlanFromProductId', () => {
  const map = loadShopierProductMap(MAP_JSON)

  it('reverse-maps productId to DB license_type/period/days', () => {
    expect(resolvePlanFromProductId('47695583', map)).toEqual({ plan: 'basic', period: 'monthly', daysToAdd: 30 })
    expect(resolvePlanFromProductId('47695729', map)).toEqual({ plan: 'plus', period: 'yearly', daysToAdd: 365 })
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
    expect(extractWorkspaceIdFromNote('0123456789abcdef_pro_yearly_1')).toBe('0123456789abcdef')
  })
})

describe('productKey', () => {
  it('builds the composite key from license_type + period', () => {
    expect(productKey('plus', 'monthly')).toBe('plus_monthly')
    expect(productKey('basic', 'yearly')).toBe('basic_yearly')
    expect(productKey('pro', 'monthly')).toBe('pro_monthly')
  })
})
