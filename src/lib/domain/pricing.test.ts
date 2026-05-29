import { describe, expect, it } from 'vitest'
import {
  getDisplayPrice,
  getShopierAmount,
  getYearlyChargeAmount,
  getYearlyMonthlyDisplayPrice,
} from './pricing'

describe('pricing', () => {
  it('uses updated monthly list prices', () => {
    expect(getDisplayPrice('leader', 'monthly')).toBe(499)
    expect(getDisplayPrice('master', 'monthly')).toBe(999)
    expect(getDisplayPrice('pro', 'monthly')).toBe(1799)
  })

  it('shows 25% discounted monthly rate for yearly UI', () => {
    expect(getYearlyMonthlyDisplayPrice('leader')).toBe(374)
    expect(getYearlyMonthlyDisplayPrice('master')).toBe(749)
    expect(getYearlyMonthlyDisplayPrice('pro')).toBe(1349)
  })

  it('charges 12× discounted monthly for yearly checkout', () => {
    expect(getYearlyChargeAmount('leader')).toBe(4488)
    expect(getYearlyChargeAmount('master')).toBe(8988)
    expect(getYearlyChargeAmount('pro')).toBe(16188)
    expect(getShopierAmount('pro', 'yearly')).toBe('16188')
    expect(getShopierAmount('master', 'monthly')).toBe('999')
  })
})
