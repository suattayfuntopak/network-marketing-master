import { describe, expect, it } from 'vitest'
import {
  getDisplayPrice,
  getShopierAmount,
  getYearlyChargeAmount,
  getYearlyMonthlyDisplayPrice,
} from './pricing'

describe('pricing', () => {
  it('uses updated monthly list prices', () => {
    expect(getDisplayPrice('basic', 'monthly')).toBe(499)
    expect(getDisplayPrice('plus', 'monthly')).toBe(1099)
    expect(getDisplayPrice('pro', 'monthly')).toBe(1999)
  })

  it('shows 25% discounted monthly rate for yearly UI', () => {
    expect(getYearlyMonthlyDisplayPrice('basic')).toBe(374)
    expect(getYearlyMonthlyDisplayPrice('plus')).toBe(824)
    expect(getYearlyMonthlyDisplayPrice('pro')).toBe(1499)
  })

  it('charges 12× discounted monthly for yearly checkout', () => {
    expect(getYearlyChargeAmount('basic')).toBe(4488)
    expect(getYearlyChargeAmount('plus')).toBe(9888)
    expect(getYearlyChargeAmount('pro')).toBe(17988)
    expect(getShopierAmount('pro', 'yearly')).toBe('17988')
    expect(getShopierAmount('plus', 'monthly')).toBe('1099')
  })
})
