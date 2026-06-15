/** Ürün hunisi olay adları — SQL / raporlarda sabit string. */
export const PRODUCT_EVENTS = {
  pricingSectionView: 'pricing_section_view',
  upgradeGateCtaClick: 'upgrade_gate_cta_click',
  odemeBasicDeepLink: 'odeme_basic_deep_link',

  // ── Dalga 0: Viralite & alışkanlık KPI ölçüm zemini ──
  // (Şema değişmez; nmm_product_events serbest event_name kabul eder.)
  /** Kullanıcı bir davet linki paylaştı (WhatsApp vb.) → K-faktör payı. */
  inviteSent: 'invite_sent',
  /** Davet linki açıldı, sponsor karşılaması görüntülendi → huni: gönderildi→görüntülendi→kayıt. */
  inviteLandingView: 'invite_landing_view',
  /** Davet koduyla kayıt tamamlandı → davet→kayıt dönüşümü, ekip-içi yayılma. */
  inviteAccepted: 'invite_accepted',
  /** Kullanıcı o gün uygulamayı açtı (gün başına 1) → D1/D7/D30 retention, DAU/MAU, streak. */
  dailyActive: 'daily_active',
  /** Sabah Brief'i kartı görüntülendi. */
  morningBriefView: 'morning_brief_view',
  /** Sabah Brief'i içindeki bir aksiyon satırına dokunuldu. */
  morningBriefActionClick: 'morning_brief_action_click',
} as const

export type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS]
