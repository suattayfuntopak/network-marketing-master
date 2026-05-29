import crypto from 'crypto'
import { parseShopierOrderId, type ParsedShopierOrder } from '@/lib/domain/shopierWebhook'

export interface ShopierOsbPayload {
  email?: string
  orderid?: string
  currency?: number
  price?: number | string
  buyername?: string
  buyersurname?: string
  productcount?: number
  productid?: string
  istest?: number
}

export interface ShopierOsbCredentials {
  username: string
  password: string
}

export function getShopierOsbCredentials(): ShopierOsbCredentials {
  const username = (
    process.env.SHOPIER_OS_USERNAME ??
    process.env.SHOPIER_API_KEY ??
    process.env.SHOPIER_API_USER ??
    ''
  ).trim()
  const password = (
    process.env.SHOPIER_OS_PASSWORD ?? process.env.SHOPIER_API_SECRET ?? ''
  ).trim()

  if (!username || !password) {
    throw new Error('Shopier OSB credentials missing')
  }

  return { username, password }
}

/** Shopier OSB: HMAC-SHA256(res + username, password) — raw binary compared to posted hash. */
export function verifyShopierOsbHash(
  res: string,
  hash: string,
  credentials: ShopierOsbCredentials
): boolean {
  const data = res + credentials.username
  const expectedRaw = crypto
    .createHmac('sha256', credentials.password)
    .update(data)
    .digest()

  const received = decodeShopierHash(hash)
  if (received && received.length === expectedRaw.length) {
    return crypto.timingSafeEqual(received, expectedRaw)
  }

  const expectedHex = expectedRaw.toString('hex')
  const normalized = hash.trim().toLowerCase()
  if (/^[0-9a-f]+$/.test(normalized) && normalized.length === expectedHex.length) {
    return crypto.timingSafeEqual(Buffer.from(normalized, 'hex'), expectedRaw)
  }

  return false
}

function decodeShopierHash(hash: string): Buffer | null {
  try {
    const trimmed = hash.trim()
    if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
      return Buffer.from(trimmed, 'hex')
    }
    return Buffer.from(trimmed, 'base64')
  } catch {
    try {
      return Buffer.from(hash, 'latin1')
    } catch {
      return null
    }
  }
}

export function parseShopierOsbPayload(res: string): ShopierOsbPayload | null {
  try {
    const json = Buffer.from(res, 'base64').toString('utf8')
    const data = JSON.parse(json) as ShopierOsbPayload
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export function resolveOrderFromOsb(
  payload: ShopierOsbPayload
): ParsedShopierOrder | null {
  if (!payload.orderid) return null
  return parseShopierOrderId(payload.orderid)
}
