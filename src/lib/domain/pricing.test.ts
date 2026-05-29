import { describe, expect, it } from 'vitest'
import {
  getDisplayPrice,
  getShopierAmount,
  getYearlyChargeAmount,
  getYearlyMonthlyDisplayPrice,
} from './pricing'

describe('pricing', () => {
  it('uses updated monthly list prices', () => {
    expect(getDisplayPrice('leader', 'monthly')).toBe(399)
    expect(getDisplayPrice('master', 'monthly')).toBe(999)
    expect(getDisplayPrice('pro', 'monthly')).toBe(1699)
  })

  it('shows 25% discounted monthly rate for yearly UI', () => {
    expect(getYearlyMonthlyDisplayPrice('leader')).toBe(299)
    expect(getYearlyMonthlyDisplayPrice('master')).toBe(749)
    expect(getYearlyMonthlyDisplayPrice('pro')).toBe(1274)
  })

  it('charges 12× discounted monthly for yearly checkout', () => {
    expect(getYearlyChargeAmount('leader')).toBe(3588)
    expect(getYearlyChargeAmount('master')).toBe(8988)
    expect(getYearlyChargeAmount('pro')).toBe(15288)
    expect(getShopierAmount('pro', 'yearly')).toBe('15288.0')
    expect(getShopierAmount('master', 'monthly')).toBe('999.0')
  })
})
