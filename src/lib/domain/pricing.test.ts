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
    expect(getDisplayPrice('plus', 'monthly')).toBe(899)
    expect(getDisplayPrice('pro', 'monthly')).toBe(1699)
  })

  it('shows 25% discounted monthly rate for yearly UI', () => {
    expect(getYearlyMonthlyDisplayPrice('basic')).toBe(374)
    expect(getYearlyMonthlyDisplayPrice('plus')).toBe(674)
    expect(getYearlyMonthlyDisplayPrice('pro')).toBe(1274)
  })

  it('charges 12× discounted monthly for yearly checkout', () => {
    expect(getYearlyChargeAmount('basic')).toBe(4488)
    expect(getYearlyChargeAmount('plus')).toBe(8088)
    expect(getYearlyChargeAmount('pro')).toBe(15288)
    expect(getShopierAmount('pro', 'yearly')).toBe('15288')
    expect(getShopierAmount('plus', 'monthly')).toBe('899')
  })
})
