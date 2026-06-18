import type { BillingPeriod, PlanId } from '@/lib/domain/pricing'

/** Deneme sonu / Basic dönüşüm deep link — aylık plan karşılaştırma. */
export const ODEME_BASIC_DEEP_LINK = '/odeme?plan=basic&period=monthly' as const

/** Oturumlu kullanıcıyı Shopier ürününe yönlendirir (workspace note sunucuda). */
export function odemeShopierPath(plan: PlanId, period: BillingPeriod = 'monthly'): string {
  return period === 'monthly' ? `/odeme/shopier/${plan}` : `/odeme/shopier/${plan}?period=${period}`
}

/** Deneme / bildirim Basic CTA — aylık Shopier redirect. */
export const ODEME_SHOPIER_BASIC_PATH = '/odeme/shopier/basic' as const

export const ODEME_SHOPIER_PLUS_MONTHLY_PATH = '/odeme/shopier/plus' as const
export const ODEME_SHOPIER_PRO_MONTHLY_PATH = '/odeme/shopier/pro' as const

/** @deprecated Yıllık vurgulu eski link; yeni akışlarda ODEME_BASIC_DEEP_LINK kullanın. */
export const ODEME_BASIC_YEARLY_DEEP_LINK = '/odeme?plan=basic&period=yearly' as const
