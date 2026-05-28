'use server'

import { createClient } from '@/lib/supabase/server'
import { getShopierAmount } from '@/lib/domain/pricing'
import {
  buildShopierCheckoutForm,
  getShopierCallbackUrl,
} from '@/lib/domain/shopierCheckout'

export type ShopierFormData = Record<string, string>

export async function initiateShopierPayment(
  plan: 'leader' | 'master' | 'pro',
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<ShopierFormData> {
  if (process.env.PAYMENT_MAINTENANCE === 'true') {
    throw new Error('Ödeme sistemi şu anda bakımda, lütfen birkaç dakika sonra tekrar deneyin.')
  }

  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
  }

  const { data: membership, error: memError } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memError || !membership) {
    throw new Error('Çalışma alanı (Workspace) bulunamadı. Lütfen bir ekibe katılın veya yeni bir tane oluşturun.')
  }

  const amount = getShopierAmount(plan, period)
  let productName = 'Network Marketing Master - Basic Plan'

  if (period === 'yearly') {
    if (plan === 'pro') {
      productName = 'Network Marketing Master - Yıllık Pro Lider Planı'
    } else if (plan === 'master') {
      productName = 'Network Marketing Master - Yıllık Plus Lider Planı'
    } else {
      productName = 'Network Marketing Master - Yıllık Basic Planı'
    }
  } else if (plan === 'pro') {
    productName = 'Network Marketing Master - Pro Lider Planı'
  } else if (plan === 'master') {
    productName = 'Network Marketing Master - Plus Lider Planı'
  }

  const workspaceId = membership.workspace_id
  const platformOrderId = `${workspaceId}_${plan}_${period}_${Date.now()}`
  const randomNr = Math.floor(100000 + Math.random() * 900000).toString()

  const apiKey = process.env.SHOPIER_API_KEY
  const apiSecret = process.env.SHOPIER_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('Shopier credentials missing: SHOPIER_API_KEY and SHOPIER_API_SECRET must be set')
  }

  const fullName = membership.full_name || user.user_metadata?.full_name || 'Değerli Lider'
  const nameParts = fullName.trim().split(/\s+/)
  const buyerName = nameParts[0] || 'Değerli'
  const buyerSurname = nameParts.slice(1).join(' ') || 'Lider'
  const buyerEmail = user.email || 'nmm_buyer@example.com'
  const buyerPhone = user.phone || '5555555555'

  return buildShopierCheckoutForm({
    apiKey,
    apiSecret,
    callbackUrl: getShopierCallbackUrl(),
    buyer: {
      userId: user.id,
      buyerName,
      buyerSurname,
      buyerEmail,
      buyerPhone,
    },
    order: {
      platformOrderId,
      productName,
      totalOrderValue: amount,
      randomNr,
    },
  })
}
