'use server'

import { createShopierPaymentSession } from '@/lib/domain/shopierPaymentSession'

export type ShopierFormData = Record<string, string>

/** @deprecated Prefer POST /odeme/launch server HTML redirect. Kept for diagnostics. */
export async function initiateShopierPayment(
  plan: 'leader' | 'master' | 'pro',
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<ShopierFormData> {
  return createShopierPaymentSession(plan, period)
}
