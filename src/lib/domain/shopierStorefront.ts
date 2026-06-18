import type { BillingPeriod, PlanId } from '@/lib/domain/pricing'
import { buildShopierPlatformOrderId } from '@/lib/domain/shopierCheckout'

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
 * AÇMAK İÇİN (cutover):
 *   SHOPIER_PRODUCTS={"basic_monthly":{"url":"https://www.shopier.com/...","productId":"123"}, ...}
 *   (SHOPIER_STOREFRONT_ENABLED=true zorunlu değil — ürün haritası doluysa otomatik açılır.)
 */

export type ProductKey = `${PlanId}_${BillingPeriod}`

export interface ShopierStorefrontProduct {
  /** Dükkandaki tam ürün linki (ör. https://www.shopier.com/networkmarketingmaster/47695583). */
  url: string
  /** Shopier ürün id'si — order.created webhook'unda plan eşlemesi için. */
  productId: string
}

/** SHOPIER_STOREFRONT_ENABLED=true veya SHOPIER_PRODUCTS doluysa dükkan yönlendirmesi. */
export function isShopierStorefrontEnabled(): boolean {
  if (process.env.SHOPIER_STOREFRONT_ENABLED === 'false') return false
  if (process.env.SHOPIER_STOREFRONT_ENABLED === 'true') return true
  return Object.keys(loadShopierProductMap()).length > 0
}

export function productKey(plan: PlanId, period: BillingPeriod): ProductKey {
  return `${plan}_${period}`
}

/** `basic_monthly` / `plus_yearly` … geçerli anahtar mı? Değilse null. */
function parseProductKey(key: string): ProductKey | null {
  const m = key.trim().toLowerCase().match(/^(basic|plus|pro)_(monthly|yearly)$/)
  if (!m) return null
  return `${m[1] as PlanId}_${m[2] as BillingPeriod}`
}

/**
 * Ürün haritasını env JSON'undan okur:
 *   SHOPIER_PRODUCTS={"basic_monthly":{"url":"...","productId":"123"},"pro_yearly":{...}}
 * Geçersiz/eksik kayıtlar sessizce atlanır.
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
    const key = parseProductKey(rawKey)
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

/** Cron/e-posta için workspace'e özel Shopier linki; ürün yoksa null. */
export function buildStorefrontUrl(
  workspaceId: string,
  plan: PlanId,
  period: BillingPeriod,
): string | null {
  const product = getStorefrontProduct(plan, period)
  if (!product) return null
  const note = buildShopierPlatformOrderId(workspaceId, plan, period)
  return buildStorefrontRedirectUrl(product.url, note)
}

/** Cron/e-posta için workspace'e özel Basic aylık Shopier linki; ürün yoksa null. */
export function buildBasicMonthlyStorefrontUrl(workspaceId: string): string | null {
  return buildStorefrontUrl(workspaceId, 'basic', 'monthly')
}

export interface ResolvedStorefrontPlan {
  /** DB license_type (basic/plus/pro) — applyLicenseUpgrade buna yazar. */
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
      const [plan, period] = key.split('_') as [PlanId, BillingPeriod]
      return { plan, period, daysToAdd: period === 'yearly' ? 365 : 30 }
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
