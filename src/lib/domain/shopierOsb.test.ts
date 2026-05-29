import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  parseShopierOsbPayload,
  verifyShopierOsbHash,
} from './shopierOsb'

describe('shopierOsb', () => {
  it('parses base64 order payload', () => {
    const payload = {
      email: 'test@example.com',
      orderid: '999311ea-4e69-4b84-97b5-a1468ffd083e_master_monthly_123',
      price: 399,
    }
    const res = Buffer.from(JSON.stringify(payload)).toString('base64')
    const parsed = parseShopierOsbPayload(res)
    expect(parsed?.orderid).toBe(payload.orderid)
    expect(parsed?.email).toBe(payload.email)
  })

  it('verifies OSB hash when Shopier sends hex digest', () => {
    const username = '806b8c21b50603a9386f80926a8c10b0'
    const password = 'db736131a1d9a73af1cbe7b505cb7c43'
    const res = Buffer.from(JSON.stringify({ orderid: 'order-hex' })).toString('base64')
    const hex = crypto
      .createHmac('sha256', password)
      .update(res + username)
      .digest('hex')

    expect(verifyShopierOsbHash(res, hex, { username, password })).toBe(true)
  })

  it('verifies OSB hash (res + username, secret as key)', () => {
    const username = '806b8c21b50603a9386f80926a8c10b0'
    const password = 'db736131a1d9a73af1cbe7b505cb7c43'
    const res = Buffer.from(JSON.stringify({ orderid: 'order-1' })).toString('base64')
    const expected = crypto.createHmac('sha256', password).update(res + username).digest()
    const hash = expected.toString('base64')

    expect(
      verifyShopierOsbHash(res, hash, { username, password })
    ).toBe(true)
    expect(
      verifyShopierOsbHash(res, 'invalid', { username, password })
    ).toBe(false)
  })
})
