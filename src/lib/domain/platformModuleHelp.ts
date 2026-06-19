/**
 * Süper Admin sayfası modül-yardımı — her modül başlığındaki (?) ikonuna basınca
 * çıkan popup içeriği. Süper admin'e özel, detaylı; "neye baktığımı niçin baktığımı"
 * anlatır. Çeviri sözlüğünü şişirmemek için içerik burada (TR + EN) tutulur.
 */

export type ModuleHelpItem = { label: string; desc: string }
export type ModuleHelpContent = { title: string; intro: string; items: ModuleHelpItem[] }
export type PlatformModuleKey = 'viral' | 'funnel' | 'aiUsage'

type Lang = 'tr' | 'en'

const HELP: Record<PlatformModuleKey, Record<Lang, ModuleHelpContent>> = {
  viral: {
    tr: {
      title: 'Büyüme & Yayılma',
      intro:
        'Son 30 günde uygulamanın kendi kendine büyüme (viralite) sağlığı: davet → görüntülenme → kayıt akışı ve aktif kullanım. Büyümenin organik mi yoksa zorlama mı olduğunu buradan görürsün.',
      items: [
        { label: 'K-Faktörü', desc: 'Davet eden kişi başına gelen yeni kayıt. 1’in üstü = sistem kendi kendine büyüyor (viral); altı = büyümek için sürekli yeni davet gerekiyor.' },
        { label: 'Davet Gönderildi', desc: 'Son 30 günde paylaşılan davet linki sayısı.' },
        { label: 'Görüntülendi', desc: 'Davet linki açılıp sponsor karşılama sayfasının görülme sayısı.' },
        { label: 'Kayıt', desc: 'Davet sonrası tamamlanan yeni üye kaydı.' },
        { label: 'Dönüşüm %', desc: 'Kayıt ÷ Davet Gönderildi. Davetlerin yüzde kaçı üyeye dönüşmüş.' },
        { label: 'Aktif Kullanıcı', desc: 'Son 30 günde en az 1 gün aktif olan kişi sayısı; “Bugün N” bugünkü aktif (DAU).' },
        { label: 'Paylaşım Kaynakları', desc: 'WhatsApp paylaşımlarının türe göre dağılımı: Davet, İçerik, Rozet, Duyuru, Doküman. Hangi paylaşım türü büyümeyi besliyor görürsün.' },
      ],
    },
    en: {
      title: 'Growth & Spread',
      intro:
        'Self-growth (virality) health over the last 30 days: invite → view → signup flow and active use. Shows whether growth is organic or forced.',
      items: [
        { label: 'K-Factor', desc: 'New signups per inviter. Above 1 = self-growing (viral); below = needs constant new invites.' },
        { label: 'Invites Sent', desc: 'Invite links shared in the last 30 days.' },
        { label: 'Viewed', desc: 'Times the invite landing/sponsor page was opened.' },
        { label: 'Signups', desc: 'New members completed after an invite.' },
        { label: 'Conversion %', desc: 'Signups ÷ Invites Sent. What share of invites became members.' },
        { label: 'Active Users', desc: 'People active at least 1 day in 30; “Today N” is today’s active (DAU).' },
        { label: 'Share Sources', desc: 'WhatsApp shares by type: Invite, Content, Badge, Announcement, Document.' },
      ],
    },
  },
  funnel: {
    tr: {
      title: 'Satış Hunisi',
      intro:
        'Ziyaretçinin ödemeye giden yolculuğu: Açılış sayfasında fiyatı görme → Planları Gör → /ödeme. Her adımda kaç kişi olduğunu, nerede döküldüğünü gösterir.',
      items: [
        { label: 'Fiyat Görüntülendi', desc: 'Açılış sayfasındaki fiyat/plan bölümünün görülme sayısı.' },
        { label: 'Planları Gör', desc: '“Planları Gör” tıklaması. Altındaki kırılım kaynağı: banner (hesap uyarısı) · gate (yükseltme kapısı) · bildirim.' },
        { label: 'Ödeme Görüntülendi', desc: '/ödeme sayfasının açılma sayısı.' },
        { label: 'Plan CTA (Deneme)', desc: 'Deneme sürerken yapılan Planları Gör tıklaması.' },
        { label: 'Plan CTA (Bitti)', desc: 'Deneme bittikten sonra yapılan Planları Gör tıklaması.' },
        { label: 'Eski (Legacy) metrikler', desc: '“Yükseltme Kapısı (Eski)” ve “Basic Derin Bağlantı (Eski)” geriye dönük karşılaştırma için tutulan, artık aktif kullanılmayan metriklerdir.' },
      ],
    },
    en: {
      title: 'Sales Funnel',
      intro:
        'The visitor’s path to payment: see pricing on landing → View Plans → /odeme. Shows how many reach each step and where they drop off.',
      items: [
        { label: 'Price Viewed', desc: 'Views of the pricing/plans section on the landing page.' },
        { label: 'View Plans', desc: '“View Plans” clicks. Source breakdown below: banner (account alert) · gate (upgrade gate) · notification.' },
        { label: 'Checkout Viewed', desc: 'Opens of the /odeme page.' },
        { label: 'Plan CTA (Trial)', desc: 'View Plans clicks during the trial.' },
        { label: 'Plan CTA (Ended)', desc: 'View Plans clicks after the trial ended.' },
        { label: 'Legacy metrics', desc: '“Upgrade Gate (Legacy)” and “Basic Deep Link (Legacy)” are kept for historical comparison and no longer actively used.' },
      ],
    },
  },
  aiUsage: {
    tr: {
      title: 'AI Kullanım Analitiği',
      intro:
        'Kullanıcıların yapay zeka üretim yoğunluğu — maliyet ve plan fiyatlama kararı için. Anonim: isim yok, yalnız sayısal yoğunluk. Günlük = kişinin 30 günlük toplam AI üretimi ÷ 30.',
      items: [
        { label: 'Ort./Gün', desc: 'Kişi başı günlük ortalama AI üretimi.' },
        { label: 'Medyan/Gün', desc: 'Ortanca kullanıcının günlük üretimi — uç (çok yüksek/düşük) değerlerden etkilenmez.' },
        { label: 'p90/Gün', desc: 'Kullanıcıların %90’ı bunun altında. Ağır kullanıcıyı ve kuyruk (en pahalı) maliyeti gösterir.' },
        { label: 'Aktif Kullanıcı', desc: 'Grupta en az 1 üretim yapan kişi / toplam kişi.' },
        { label: 'Kişi Başı 30g Ort.', desc: 'Kişi başı 30 günlük toplam üretim ortalaması — doğrudan maliyet vekili.' },
        { label: 'Kademe & Segment', desc: 'Aynı metrikler Ücretsiz/Basic/Plus/Pro ve “Kendi ekibim / Dış-kayıt” kırılımında. Hangi planın ne kadar AI tükettiğini görüp fiyatı ona göre ayarlayabilirsin.' },
      ],
    },
    en: {
      title: 'AI Usage Analytics',
      intro:
        'Users’ AI generation intensity — for cost and pricing decisions. Anonymous: no names, only numeric intensity. Daily = a user’s 30-day total AI generations ÷ 30.',
      items: [
        { label: 'Avg/Day', desc: 'Average daily AI generations per user.' },
        { label: 'Median/Day', desc: 'The median user’s daily generations — unaffected by outliers.' },
        { label: 'p90/Day', desc: '90% of users are below this. Shows heavy users and tail (most expensive) cost.' },
        { label: 'Active Users', desc: 'Users with at least 1 generation / total users in the group.' },
        { label: 'Avg 30d/User', desc: 'Average 30-day total generations per user — a direct cost proxy.' },
        { label: 'Tier & Segment', desc: 'Same metrics split by Free/Basic/Plus/Pro and “My team / Independent”. See which plan consumes how much AI and price accordingly.' },
      ],
    },
  },
}

export function getPlatformModuleHelp(key: PlatformModuleKey, lang: Lang): ModuleHelpContent {
  return HELP[key][lang]
}
