/** Ürün hunisi olay adları — SQL / raporlarda sabit string. */
export const PRODUCT_EVENTS = {
  pricingSectionView: 'pricing_section_view',
  upgradeGateCtaClick: 'upgrade_gate_cta_click',
  odemeBasicDeepLink: 'odeme_basic_deep_link',
} as const

export type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS]
