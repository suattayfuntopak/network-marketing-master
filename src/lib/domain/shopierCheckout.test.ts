import { describe, it, expect } from 'vitest'
import {
  SHOPIER_CURRENCY_TRY,
  buildShopierCheckoutForm,
  buildShopierLaunchHtml,
  buildShopierSignaturePayload,
  formatShopierOrderValue,
  normalizeShopierPhone,
  signShopierCheckout,
  toShopierBuyerId,
} from './shopierCheckout'

describe('shopierCheckout', () => {
  it('formats order value like official SDK (integer → .0)', () => {
    expect(formatShopierOrderValue(1699)).toBe('1699.0')
    expect(formatShopierOrderValue(399)).toBe('399.0')
    expect(formatShopierOrderValue(8991)).toBe('8991.0')
  })

  it('builds signature payload with TRY currency code 0', () => {
    expect(
      buildShopierSignaturePayload({
        randomNr: '123456',
        platformOrderId: 'ws-abc_pro_monthly_1',
        totalOrderValue: '1699.0',
      })
    ).toBe('123456ws-abc_pro_monthly_11699.00')
  })

  it('signs checkout payload deterministically', () => {
    const payload = '123456order-1100.00'
    const sig1 = signShopierCheckout(payload, 'test_secret')
    const sig2 = signShopierCheckout(payload, 'test_secret')
    expect(sig1).toBe(sig2)
    expect(sig1.length).toBeGreaterThan(10)
  })

  it('derives numeric buyer id from uuid', () => {
    const id = toShopierBuyerId('999311ea-4e69-4b84-97b5-a1468ffd083e')
    expect(id).toMatch(/^\d+$/)
    expect(id).not.toContain('-')
  })

  it('normalizes phone to 10 local digits', () => {
    expect(normalizeShopierPhone('+90 532 123 45 67')).toBe('5321234567')
    expect(normalizeShopierPhone('')).toBe('5555555555')
  })

  it('includes all required Shopier form fields', () => {
    const form = buildShopierCheckoutForm({
      apiKey: 'key',
      apiSecret: 'secret',
      callbackUrl: 'https://nmm.suattayfuntopak.com/api/payment/shopier',
      buyer: {
        userId: '123456789',
        buyerName: 'Suat',
        buyerSurname: 'Topak',
        buyerEmail: 'test@example.com',
        buyerPhone: '5555555555',
      },
      order: {
        platformOrderId: 'ws-abc_pro_monthly_1',
        productName: 'Pro Plan',
        totalOrderValue: '1699.0',
        randomNr: '654321',
      },
    })

    expect(form.currency).toBe(SHOPIER_CURRENCY_TRY)
    expect(form.product_type).toBe('1')
    expect(form.callback).toContain('/api/payment/shopier')
    expect(form.billing_address).toBeTruthy()
    expect(form.shipping_address).toBeTruthy()
    expect(form.signature).toBeTruthy()
    expect(form.total_order_value).toBe('1699.0')
    expect(form.buyer_id_nr).toMatch(/^\d+$/)
  })

  it('builds multipart auto-submit launch html', () => {
    const html = buildShopierLaunchHtml({
      API_key: 'k',
      signature: 'abc+def/ghi=',
    })
    expect(html).toContain('enctype="multipart/form-data"')
    expect(html).toContain('api_pay4.php')
    expect(html).toContain('value="abc+def/ghi="')
  })
})
