import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  verifyShopierSignature,
  parseShopierOrderId,
  type ShopierSignatureParams,
} from './shopierWebhook'

const SECRET = 'super_secret_test_key'

function sign(p: Omit<ShopierSignatureParams, 'signature'>, secret = SECRET): string {
  return crypto
    .createHmac('sha256', secret)
    .update(p.platform_order_id + p.random_number + p.total_amount + p.status)
    .digest('base64')
}

describe('verifyShopierSignature', () => {
  const base = {
    platform_order_id: 'abcdefghij_pro_yearly_1700000000',
    random_number: '12345',
    total_amount: '499.00',
    status: 'success',
  }

  it('accepts a correctly signed payload', () => {
    const signature = sign(base)
    expect(verifyShopierSignature({ ...base, signature }, SECRET)).toBe(true)
  })

  it('rejects a tampered amount', () => {
    const signature = sign(base)
    expect(
      verifyShopierSignature({ ...base, total_amount: '1.00', signature }, SECRET)
    ).toBe(false)
  })

  it('rejects a signature made with a different secret', () => {
    const signature = sign(base, 'attacker_secret')
    expect(verifyShopierSignature({ ...base, signature }, SECRET)).toBe(false)
  })

  it('rejects an empty / malformed signature without throwing', () => {
    expect(verifyShopierSignature({ ...base, signature: '' }, SECRET)).toBe(false)
    expect(verifyShopierSignature({ ...base, signature: 'not-base64!!' }, SECRET)).toBe(false)
  })
})

describe('parseShopierOrderId', () => {
  it('parses a valid yearly order into 365 days', () => {
    const parsed = parseShopierOrderId('ws-1234567890_pro_yearly_1700000000')
    expect(parsed).toEqual({
      workspaceId: 'ws-1234567890',
      plan: 'pro',
      period: 'yearly',
      daysToAdd: 365,
    })
  })

  it('parses a valid monthly order into 30 days', () => {
    const parsed = parseShopierOrderId('ws-1234567890_basic_monthly_1700000000')
    expect(parsed?.daysToAdd).toBe(30)
    expect(parsed?.plan).toBe('basic')
  })

  it('rejects too-few segments', () => {
    expect(parseShopierOrderId('ws_pro_yearly')).toBeNull()
  })

  it('rejects an invalid plan', () => {
    expect(parseShopierOrderId('ws-1234567890_enterprise_yearly_1')).toBeNull()
  })

  it('rejects an invalid period', () => {
    expect(parseShopierOrderId('ws-1234567890_pro_weekly_1')).toBeNull()
  })

  it('rejects a too-short workspace id', () => {
    expect(parseShopierOrderId('short_pro_yearly_1')).toBeNull()
  })
})
