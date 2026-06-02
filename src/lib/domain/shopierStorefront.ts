import type { BillingPeriod, PlanId } from '@/lib/domain/pricing'

/**
 * Shopier "dükkan yönlendirme" (storefront-redirect) modeli.
 *
 * Shopier `api_pay4.php` (uygulama/API checkout) reddedildiği için ödemeyi BİZ
 * başlatmıyoruz; kullanıcıyı dükkandaki ürün linkine yönlendiriyoruz:
 *   https://www.shopier.com/<urun>?quantity=1&note=<orderRef>
 * Ödeme sonrası Shopier `order.created` webhook'unu `note` + `productId` ile gönderir
 * (bkz. shopierOrderWebhook.ts + /api/payment/shopier).
 *
 * GÜVENLİK: `note` serbest metin → ondan SADECE workspaceId ("kime") alınır.
 * Plan/süre (tier) note'tan DEĞİL, satın alınan ürünün `productId`'sinden çözülür
 * ({@link resolvePlanFromProductId}). Böylece kullanıcı note'u kurcalayıp
 * ucuz plana ödeyip pahalı plan kapamaz.
 *
 * İSİMLENDİRME: env'de görünür isimler **Basic/Plus/Pro** (planların görünen adı);
 * içeride DB `license_type` değerleri **leader/master/pro** (PlanId). Eşleme:
 * basic↔leader, plus↔master, pro↔pro. Env friendly, iç kimlik bozulmaz.
 *
 * AÇMAK İÇİN (cutover):
 *   SHOPIER_STOREFRONT_ENABLED=true
 *   SHOPIER_PRODUCTS={"basic_monthly":{"url":"https://www.shopier.com/...","productId":"123"}, ...}
 */

/** Env/görünür plan adı (Basic/Plus/Pro). */
export type PlanAlias = 'basic' | 'plus' | 'pro'
export type ProductKey = `${PlanAlias}_${BillingPeriod}`

/** Görünür ad → DB license_type (PlanId). */
const ALIAS_TO_PLAN: Record<PlanAlias, PlanId> = { basic: 'leader', plus: 'master', pro: 'pro' }
/** DB license_type (PlanId) → görünür ad. */
const PLAN_TO_ALIAS: Record<PlanId, PlanAlias> = { leader: 'basic', master: 'plus', pro: 'pro' }

export interface ShopierStorefrontProduct {
  /** Dükkandaki tam ürün linki (ör. https://www.shopier.com/networkmarketingmaster/47695583). */
  url: string
  /** Shopier ürün id'si — order.created webhook'unda plan eşlemesi için. */
  productId: string
}

/** SHOPIER_STOREFRONT_ENABLED=true iken yeni dükkan-yönlendirme akışı devrede. */
export function isShopierStorefrontEnabled(): boolean {
  return process.env.SHOPIER_STOREFRONT_ENABLED === 'true'
}

export function productKey(plan: PlanId, period: BillingPeriod): ProductKey {
  return `${PLAN_TO_ALIAS[plan]}_${period}`
}

/**
 * Env anahtarını normalize eder: `basic_monthly` / `plus_yearly` … döner.
 * Geriye dönük uyumluluk için eski `leader_*`/`master_*` de kabul edilir.
 */
function normalizeProductKey(key: string): ProductKey | null {
  const m = key.trim().toLowerCase().match(/^(basic|plus|pro|leader|master)_(monthly|yearly)$/)
  if (!m) return null
  const planPart =
    m[1] === 'leader' ? 'basic' : m[1] === 'master' ? 'plus' : (m[1] as PlanAlias)
  return `${planPart}_${m[2] as BillingPeriod}`
}

/**
 * Ürün haritasını env JSON'undan okur:
 *   SHOPIER_PRODUCTS={"basic_monthly":{"url":"...","productId":"123"},"pro_yearly":{...}}
 * Geçersiz/eksik kayıtlar sessizce atlanır; anahtarlar normalize edilir.
 */
export function loadShopierProductMap(
  raw: string | undefined = process.env.SHOPIER_PRODUCTS
): Partial<Record<ProductKey, ShopierStorefrontProduct>> {
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!parsed || typeof parsed !== 'object') return {}

  const out: Partial<Record<ProductKey, ShopierStorefrontProduct>> = {}
  for (const [rawKey, value] of Object.entries(parsed as Record<string, unknown>)) {
    const key = normalizeProductKey(rawKey)
    if (!key || !value || typeof value !== 'object') continue
    const { url, productId } = value as Record<string, unknown>
    if (typeof url === 'string' && url.trim() && (typeof productId === 'string' || typeof productId === 'number')) {
      out[key] = { url: url.trim(), productId: String(productId).trim() }
    }
  }
  return out
}

export function getStorefrontProduct(
  plan: PlanId,
  period: BillingPeriod,
  map: Partial<Record<ProductKey, ShopierStorefrontProduct>> = loadShopierProductMap()
): ShopierStorefrontProduct | null {
  return map[productKey(plan, period)] ?? null
}

/** Ürün linkine `quantity` + `note` parametrelerini ekler (mevcut query'yi korur). */
export function buildStorefrontRedirectUrl(productUrl: string, note: string): string {
  const url = new URL(productUrl)
  url.searchParams.set('quantity', '1')
  url.searchParams.set('note', note)
  return url.toString()
}

export interface ResolvedStorefrontPlan {
  /** DB license_type (leader/master/pro) — applyLicenseUpgrade buna yazar. */
  plan: PlanId
  period: BillingPeriod
  daysToAdd: number
}

/**
 * `productId` → plan/period/days. GÜVENLİ kaynak: kullanıcının yazdığı note değil,
 * gerçekten satın alınan ürün. Haritada yoksa null (bilinmeyen ürün → upgrade yok).
 */
export function resolvePlanFromProductId(
  productId: string,
  map: Partial<Record<ProductKey, ShopierStorefrontProduct>> = loadShopierProductMap()
): ResolvedStorefrontPlan | null {
  const target = String(productId).trim()
  if (!target) return null
  for (const [key, product] of Object.entries(map)) {
    if (product && product.productId === target) {
      const [alias, period] = key.split('_') as [PlanAlias, BillingPeriod]
      return { plan: ALIAS_TO_PLAN[alias], period, daysToAdd: period === 'yearly' ? 365 : 30 }
    }
  }
  return null
}

/**
 * `note` (`<workspaceId>_<plan>_<period>_<ts>`) → workspaceId (sadece "kime").
 * Plan/süre buradan ALINMAZ (bkz. dosya başı güvenlik notu).
 */
export function extractWorkspaceIdFromNote(note: string | null | undefined): string | null {
  if (!note) return null
  const id = note.split('_')[0]?.trim()
  return id && id.length >= 10 ? id : null
}
