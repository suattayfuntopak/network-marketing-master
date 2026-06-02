import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifyShopierWebhookSignature, extractOrderFields } from './shopierOrderWebhook'

const SECRET = 'webhook_signing_secret'

function hmac(payload: string, encoding: 'base64' | 'hex', secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(payload).digest(encoding)
}

describe('verifyShopierWebhookSignature', () => {
  const body = '{"order":{"id":"o1"}}'

  it('accepts a valid base64 HS256 over the raw body', () => {
    expect(verifyShopierWebhookSignature(body, hmac(body, 'base64'), SECRET)).toBe(true)
  })

  it('accepts a valid hex HS256 over the raw body', () => {
    expect(verifyShopierWebhookSignature(body, hmac(body, 'hex'), SECRET)).toBe(true)
  })

  it('accepts the timestamp.body signing variant', () => {
    const ts = '1700000000'
    const sig = hmac(`${ts}.${body}`, 'base64')
    expect(verifyShopierWebhookSignature(body, sig, SECRET, ts)).toBe(true)
  })

  it('rejects a wrong signature / secret', () => {
    expect(verifyShopierWebhookSignature(body, hmac(body, 'base64', 'other'), SECRET)).toBe(false)
    expect(verifyShopierWebhookSignature(body, 'deadbeef', SECRET)).toBe(false)
  })

  it('rejects when signature or secret is missing', () => {
    expect(verifyShopierWebhookSignature(body, null, SECRET)).toBe(false)
    expect(verifyShopierWebhookSignature(body, hmac(body, 'base64'), '')).toBe(false)
  })
})

describe('extractOrderFields', () => {
  it('finds note and productId in a nested order payload', () => {
    const payload = {
      order: {
        id: 'ord_1',
        note: 'abcdefghij_pro_yearly_1700000000',
        products: [{ id: '333', name: 'Pro' }],
      },
    }
    expect(extractOrderFields(payload)).toEqual({
      note: 'abcdefghij_pro_yearly_1700000000',
      productId: '333',
    })
  })

  it('supports snake_case and direct productId keys', () => {
    const payload = { customer_note: 'ws0123456789_master_monthly_1', product_id: 222 }
    expect(extractOrderFields(payload)).toEqual({
      note: 'ws0123456789_master_monthly_1',
      productId: '222',
    })
  })

  it('returns nulls when fields are absent', () => {
    expect(extractOrderFields({ order: { id: 'x' } })).toEqual({ note: null, productId: null })
    expect(extractOrderFields(null)).toEqual({ note: null, productId: null })
  })
})
