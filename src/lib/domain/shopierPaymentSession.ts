import { createClient } from '@/lib/supabase/server'
import { getShopierAmount, type BillingPeriod, type PlanId } from '@/lib/domain/pricing'
import {
  buildShopierCheckoutForm,
  buildShopierPlatformOrderId,
  getShopierCallbackUrl,
  getShopierCredentials,
  normalizeShopierPhone,
  toShopierBuyerId,
} from '@/lib/domain/shopierCheckout'

function productNameForPlan(plan: PlanId, period: BillingPeriod): string {
  if (period === 'yearly') {
    if (plan === 'pro') return 'Network Marketing Master - Annual Pro Leader Plan'
    if (plan === 'master') return 'Network Marketing Master - Annual Plus Leader Plan'
    return 'Network Marketing Master - Annual Basic Plan'
  }
  if (plan === 'pro') return 'Network Marketing Master - Pro Leader Plan'
  if (plan === 'master') return 'Network Marketing Master - Plus Leader Plan'
  return 'Network Marketing Master - Basic Plan'
}

/** Builds a signed Shopier checkout form for the current authenticated user. */
export async function createShopierPaymentSession(
  plan: PlanId,
  period: BillingPeriod = 'monthly'
): Promise<Record<string, string>> {
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

  const { apiKey, apiSecret, websiteIndex } = getShopierCredentials()
  const amount = getShopierAmount(plan, period)
  const workspaceId = membership.workspace_id
  const platformOrderId = buildShopierPlatformOrderId(workspaceId, plan, period)
  const randomNr = Math.floor(100000 + Math.random() * 900000).toString()

  const fullName = membership.full_name || user.user_metadata?.full_name || 'Degerli Lider'
  const nameParts = fullName.trim().split(/\s+/)
  const buyerName = nameParts[0] || 'Degerli'
  const buyerSurname = nameParts.slice(1).join(' ') || 'Lider'
  const buyerEmail = user.email || 'nmm_buyer@example.com'

  return buildShopierCheckoutForm({
    apiKey,
    apiSecret,
    websiteIndex,
    callbackUrl: getShopierCallbackUrl(),
    buyer: {
      userId: toShopierBuyerId(user.id),
      buyerName,
      buyerSurname,
      buyerEmail,
      buyerPhone: normalizeShopierPhone(user.phone),
    },
    order: {
      platformOrderId,
      productName: productNameForPlan(plan, period),
      totalOrderValue: amount,
      randomNr,
    },
  })
}
