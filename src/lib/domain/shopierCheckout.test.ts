import { describe, it, expect } from 'vitest'
import {
  SHOPIER_CURRENCY_TRY,
  buildShopierCheckoutForm,
  buildShopierSignaturePayload,
  formatShopierOrderValue,
  signShopierCheckout,
} from './shopierCheckout'

describe('shopierCheckout', () => {
  it('formats order value with two decimals', () => {
    expect(formatShopierOrderValue(1699)).toBe('1699.00')
    expect(formatShopierOrderValue(399)).toBe('399.00')
  })

  it('builds signature payload with TRY currency code 0', () => {
    expect(
      buildShopierSignaturePayload({
        randomNr: '123456',
        platformOrderId: 'ws-abc_pro_monthly_1',
        totalOrderValue: '1699.00',
      })
    ).toBe('123456ws-abc_pro_monthly_11699.000')
  })

  it('signs checkout payload deterministically', () => {
    const payload = '123456order-1100.000'
    const sig1 = signShopierCheckout(payload, 'test_secret')
    const sig2 = signShopierCheckout(payload, 'test_secret')
    expect(sig1).toBe(sig2)
    expect(sig1.length).toBeGreaterThan(10)
  })

  it('includes all required Shopier form fields', () => {
    const form = buildShopierCheckoutForm({
      apiKey: 'key',
      apiSecret: 'secret',
      callbackUrl: 'https://nmm.suattayfuntopak.com/api/payment/shopier',
      buyer: {
        userId: 'user-uuid',
        buyerName: 'Suat',
        buyerSurname: 'Topak',
        buyerEmail: 'test@example.com',
        buyerPhone: '5555555555',
      },
      order: {
        platformOrderId: 'ws-abc_pro_monthly_1',
        productName: 'Pro Plan',
        totalOrderValue: '1699.00',
        randomNr: '654321',
      },
    })

    expect(form.currency).toBe(SHOPIER_CURRENCY_TRY)
    expect(form.product_type).toBe('1')
    expect(form.callback).toContain('/api/payment/shopier')
    expect(form.billing_address).toBeTruthy()
    expect(form.shipping_address).toBeTruthy()
    expect(form.signature).toBeTruthy()
    expect(form.total_order_value).toBe('1699.00')
  })
})
