// Pure, testable Shopier webhook logic: signature verification + order_id parsing.
// Kept free of Next/Supabase imports so it can be unit-tested in isolation.

import crypto from 'crypto'

export const VALID_PLANS = ['basic', 'plus', 'pro'] as const
export const VALID_PERIODS = ['monthly', 'yearly'] as const
export type Plan = (typeof VALID_PLANS)[number]
export type Period = (typeof VALID_PERIODS)[number]

export interface ShopierSignatureParams {
  platform_order_id: string
  random_number: string
  total_amount: string
  status: string
  signature: string
}

/** Recomputes the Shopier HMAC-SHA256 (base64) and compares it in constant time. */
export function verifyShopierSignature(
  params: ShopierSignatureParams,
  apiSecret: string
): boolean {
  const signatureData =
    params.platform_order_id + params.random_number + params.total_amount + params.status
  const expected = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureData)
    .digest('base64')

  const received = Buffer.from(params.signature)
  const expectedBuf = Buffer.from(expected)
  if (received.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(received, expectedBuf)
}

export interface ParsedShopierOrder {
  workspaceId: string
  plan: Plan
  period: Period
  daysToAdd: number
}

/**
 * Parses `<workspaceId>_<plan>_<period>_<timestamp>`. License tier and duration
 * come from the (signed) order_id, never from total_amount. Returns null when invalid.
 */
export function parseShopierOrderId(orderId: string): ParsedShopierOrder | null {
  const parts = orderId.split('_')
  if (parts.length < 4) return null

  const workspaceId = parts[0]
  const plan = parts[1]
  const period = parts[2]

  if (!workspaceId || workspaceId.length < 10) return null
  if (!VALID_PLANS.includes(plan as Plan) || !VALID_PERIODS.includes(period as Period)) {
    return null
  }

  return {
    workspaceId,
    plan: plan as Plan,
    period: period as Period,
    daysToAdd: (period as Period) === 'yearly' ? 365 : 30,
  }
}
