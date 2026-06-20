/**
 * Süper Admin sayfası — KART/KUTU bazlı yardım. Her stat kutusunun sağ üstündeki (?)
 * butonuna basınca SADECE o kutunun ne ölçtüğünü sade dille anlatır. Çeviri sözlüğünü
 * şişirmemek için içerik burada (TR + EN) tutulur; dil istemciden seçilir.
 */

export type CardHelp = { title: string; desc: string }
type Lang = 'tr' | 'en'

export type PlatformCardKey =
  // Büyüme & Yayılma
  | 'viralKFactor'
  | 'viralInvitesSent'
  | 'viralLandingViews'
  | 'viralAccepted'
  | 'viralConversion'
  | 'viralActiveUsers'
  | 'viralShares'
  // Satış Hunisi
  | 'funnelLandingViews'
  | 'funnelSeePlans'
  | 'funnelOdemeViews'
  | 'funnelProUpgradeCta'
  | 'funnelUpgradeGateLegacy'
  | 'funnelSeePlansTrial'
  | 'funnelSeePlansEnded'
  | 'funnelPlusDeepLink'
  | 'funnelBasicDeepLinkLegacy'
  | 'funnelRateSeePlans'
  | 'funnelRateOdeme'
  | 'funnelDeepLinkCompare'
  // AI Kullanım Analitiği
  | 'aiOverall'
  | 'aiByTier'
  | 'aiBySegment'

const HELP: Record<PlatformCardKey, Record<Lang, CardHelp>> = {
  // ── Büyüme & Yayılma ──────────────────────────────────────────────
  viralKFactor: {
    tr: { title: 'Davet Etkisi (K-Faktörü)', desc: 'Davet eden kişi başına gelen yeni kayıt. 1’in ÜSTÜ = sistem kendi kendine büyüyor (viral); ALTI = büyümek için sürekli yeni davet gerekiyor.' },
    en: { title: 'Invite Impact (K-Factor)', desc: 'New signups per inviter. Above 1 = self-growing (viral); below = needs constant new invites.' },
  },
  viralInvitesSent: {
    tr: { title: 'Davet Gönderildi', desc: 'Son 30 günde paylaşılan davet linki sayısı.' },
    en: { title: 'Invites Sent', desc: 'Invite links shared in the last 30 days.' },
  },
  viralLandingViews: {
    tr: { title: 'Görüntülendi', desc: 'Davet linki açılıp sponsor karşılama sayfasının görülme sayısı.' },
    en: { title: 'Viewed', desc: 'Times the invite landing/sponsor page was opened.' },
  },
  viralAccepted: {
    tr: { title: 'Kayıt', desc: 'Davet sonrası tamamlanan yeni üye kaydı sayısı.' },
    en: { title: 'Signups', desc: 'New members completed after an invite.' },
  },
  viralConversion: {
    tr: { title: 'Dönüşüm %', desc: 'Kayıt ÷ Davet Gönderildi. Gönderilen davetlerin yüzde kaçı üyeye dönüşmüş.' },
    en: { title: 'Conversion %', desc: 'Signups ÷ Invites Sent. What share of invites became members.' },
  },
  viralActiveUsers: {
    tr: { title: 'Aktif Kullanıcı', desc: 'Son 30 günde en az 1 gün aktif olan kişi sayısı. “Bugün N” bugün aktif olan (günlük aktif / DAU).' },
    en: { title: 'Active Users', desc: 'People active at least 1 day in 30. “Today N” is today’s active (DAU).' },
  },
  viralShares: {
    tr: { title: 'Paylaşım Kaynakları', desc: 'WhatsApp paylaşımlarının türe göre dağılımı: Davet, İçerik, Rozet, Duyuru, Doküman. Hangi paylaşım türünün büyümeyi beslediğini görürsün.' },
    en: { title: 'Share Sources', desc: 'WhatsApp shares by type: Invite, Content, Badge, Announcement, Document. Shows which share type drives growth.' },
  },

  // ── Satış Hunisi ──────────────────────────────────────────────────
  funnelLandingViews: {
    tr: { title: 'Fiyat Görüntülendi', desc: 'Açılış sayfasındaki fiyat/plan bölümünün görülme sayısı. Huninin en üst basamağı.' },
    en: { title: 'Price Viewed', desc: 'Views of the pricing/plans section on the landing page. The top of the funnel.' },
  },
  funnelSeePlans: {
    tr: { title: 'Planları Gör', desc: '“Planları Gör” butonuna tıklama sayısı. Altındaki kırılım nereden tıklandığını gösterir: banner (hesap uyarısı) · gate (yükseltme kapısı) · bildirim.' },
    en: { title: 'View Plans', desc: '“View Plans” clicks. The breakdown shows the source: banner (account alert) · gate (upgrade gate) · notification.' },
  },
  funnelOdemeViews: {
    tr: { title: 'Ödeme Görüntülendi', desc: '/ödeme (ödeme) sayfasının açılma sayısı. Satın almaya en yakın adım.' },
    en: { title: 'Checkout Viewed', desc: 'Opens of the /odeme checkout page. Closest step to purchase.' },
  },
  funnelProUpgradeCta: {
    tr: { title: 'Pro Yükseltme CTA', desc: 'Pro plana yükseltme çağrısına tıklama sayısı. Kırılım hangi ekrandan geldiğini gösterir: gate · saha · eğitim · istatistik.' },
    en: { title: 'Pro Upgrade CTA', desc: 'Clicks on the Pro upgrade call-to-action. The breakdown shows which screen it came from.' },
  },
  funnelUpgradeGateLegacy: {
    tr: { title: 'Yükseltme Kapısı (Eski)', desc: 'Geriye dönük karşılaştırma için tutulan ESKİ metrik; artık aktif kullanılmıyor.' },
    en: { title: 'Upgrade Gate (Legacy)', desc: 'A legacy metric kept for historical comparison; no longer actively used.' },
  },
  funnelSeePlansTrial: {
    tr: { title: 'Plan CTA (Deneme)', desc: 'Deneme süresi DEVAM EDERKEN yapılan “Planları Gör” tıklaması.' },
    en: { title: 'Plan CTA (Trial)', desc: '“View Plans” clicks made WHILE the trial is active.' },
  },
  funnelSeePlansEnded: {
    tr: { title: 'Plan CTA (Bitti)', desc: 'Deneme BİTTİKTEN SONRA yapılan “Planları Gör” tıklaması.' },
    en: { title: 'Plan CTA (Ended)', desc: '“View Plans” clicks made AFTER the trial ended.' },
  },
  funnelPlusDeepLink: {
    tr: { title: 'Plus Derin Bağlantı', desc: 'Doğrudan Plus planı ödeme sayfasına götüren bağlantının kullanım sayısı.' },
    en: { title: 'Plus Deep Link', desc: 'Uses of the direct deep link to the Plus plan checkout.' },
  },
  funnelBasicDeepLinkLegacy: {
    tr: { title: 'Basic Derin Bağlantı (Eski)', desc: 'Eski Basic plan derin bağlantısı; geriye dönük karşılaştırma için tutuluyor, artık kullanılmıyor.' },
    en: { title: 'Basic Deep Link (Legacy)', desc: 'Legacy Basic plan deep link, kept for comparison; no longer used.' },
  },
  funnelRateSeePlans: {
    tr: { title: 'Plan CTA / Fiyat Görüntüleme', desc: 'Fiyatı GÖRENLERİN yüzde kaçı “Planları Gör”e tıkladı. Açılıştan ilgiye geçiş oranı — yüksekse açılış ikna ediyor.' },
    en: { title: 'Plan CTA / Price View', desc: 'Of those who saw pricing, what % clicked “View Plans”. Landing→interest rate.' },
  },
  funnelRateOdeme: {
    tr: { title: 'Ödeme / Plan CTA', desc: '“Planları Gör”e tıklayanların yüzde kaçı ödeme sayfasına ulaştı. İlgiden satın almaya geçiş oranı.' },
    en: { title: 'Checkout / Plan CTA', desc: 'Of those who clicked “View Plans”, what % reached checkout. Interest→purchase rate.' },
  },
  funnelDeepLinkCompare: {
    tr: { title: 'Plus / Pro Karşılaştırma', desc: 'Plus derin bağlantı kullanımı ile Pro CTA tıklaması yan yana — kullanıcılar hangi üst plana daha çok yöneliyor.' },
    en: { title: 'Plus / Pro Compare', desc: 'Plus deep-link uses vs Pro CTA clicks side by side — which upper plan attracts more.' },
  },

  // ── AI Kullanım Analitiği ─────────────────────────────────────────
  aiOverall: {
    tr: { title: 'Genel AI Yoğunluğu', desc: 'Tüm kullanıcıların günlük AI üretim yoğunluğu (anonim, isim yok). Ort./Gün = kişi başı ortalama. Medyan/Gün = ortanca kullanıcı (uç değerlerden etkilenmez). p90/Gün = kullanıcıların %90’ı bunun altında — en ağır, en pahalı kullanıcıyı gösterir. Maliyet ve fiyatlama kararı için.' },
    en: { title: 'Overall AI Intensity', desc: 'All users’ daily AI generation intensity (anonymous). Avg/Day = mean per user. Median/Day = the median user (unaffected by outliers). p90/Day = 90% of users are below this — the heaviest, most expensive user. For cost & pricing.' },
  },
  aiByTier: {
    tr: { title: 'Lisans Kademesine Göre', desc: 'Aynı 3 sayı (Ort./Medyan/p90) lisans planına göre ayrılır: hangi plan ne kadar AI tüketiyor. Fiyatı buna göre ayarlayabilirsin.' },
    en: { title: 'By License Tier', desc: 'The same 3 numbers (Avg/Median/p90) split by license plan: which plan consumes how much AI. Price accordingly.' },
  },
  aiBySegment: {
    tr: { title: 'Segmente Göre', desc: 'Aynı 3 sayı “Kendi ekibim” (senin davet ettiklerin) ile “Dış-kayıt” (bağımsız kaydolanlar) kırılımında.' },
    en: { title: 'By Segment', desc: 'The same 3 numbers split by “My team” (people you invited) vs “Independent” signups.' },
  },
}

export function getPlatformCardHelp(key: PlatformCardKey, lang: Lang): CardHelp {
  return HELP[key][lang]
}
