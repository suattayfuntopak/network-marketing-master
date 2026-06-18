import { describe, it, expect } from 'vitest'
import {
  odemeShopierPath,
  ODEME_SHOPIER_BASIC_PATH,
  ODEME_SHOPIER_PLUS_MONTHLY_PATH,
  ODEME_SHOPIER_PRO_MONTHLY_PATH,
} from './paymentRoutes'

describe('odemeShopierPath', () => {
  it('builds monthly paths without query', () => {
    expect(odemeShopierPath('basic', 'monthly')).toBe('/odeme/shopier/basic')
    expect(ODEME_SHOPIER_BASIC_PATH).toBe('/odeme/shopier/basic')
    expect(ODEME_SHOPIER_PLUS_MONTHLY_PATH).toBe('/odeme/shopier/plus')
    expect(ODEME_SHOPIER_PRO_MONTHLY_PATH).toBe('/odeme/shopier/pro')
  })

  it('appends period query for yearly', () => {
    expect(odemeShopierPath('plus', 'yearly')).toBe('/odeme/shopier/plus?period=yearly')
  })
})
