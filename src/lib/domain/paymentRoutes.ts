/** Deneme sonu / Basic dönüşüm deep link — aylık plan karşılaştırma. */
export const ODEME_BASIC_DEEP_LINK = '/odeme?plan=basic&period=monthly' as const

/** Oturumlu kullanıcıyı Shopier Basic aylık ürününe yönlendirir (workspace note sunucuda). */
export const ODEME_SHOPIER_BASIC_PATH = '/odeme/shopier/basic' as const

/** @deprecated Yıllık vurgulu eski link; yeni akışlarda ODEME_BASIC_DEEP_LINK kullanın. */
export const ODEME_BASIC_YEARLY_DEEP_LINK = '/odeme?plan=basic&period=yearly' as const
