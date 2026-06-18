import type { BillingPeriod, PlanId } from '@/lib/domain/pricing'

/** Plan karşılaştırma sayfası — deneme/bildirim/modal CTA varsayılanı. */
export const ODEME_PLANS_PATH = '/odeme' as const

/** @deprecated Query deep link; yeni akışlarda ODEME_PLANS_PATH kullanın. */
export const ODEME_BASIC_DEEP_LINK = '/odeme?plan=basic&period=monthly' as const

/** Oturumlu kullanıcıyı Shopier ürününe yönlendirir (workspace note sunucuda). */
export function odemeShopierPath(plan: PlanId, period: BillingPeriod = 'monthly'): string {
  return period === 'monthly' ? `/odeme/shopier/${plan}` : `/odeme/shopier/${plan}?period=${period}`
}

/** Shopier aylık Basic redirect — yalnızca /odeme/shopier/[plan] rotasında. */
export const ODEME_SHOPIER_BASIC_PATH = '/odeme/shopier/basic' as const

export const ODEME_SHOPIER_PLUS_MONTHLY_PATH = '/odeme/shopier/plus' as const
export const ODEME_SHOPIER_PRO_MONTHLY_PATH = '/odeme/shopier/pro' as const

/** @deprecated Yıllık vurgulu eski link; yeni akışlarda ODEME_PLANS_PATH kullanın. */
export const ODEME_BASIC_YEARLY_DEEP_LINK = '/odeme?plan=basic&period=yearly' as const
