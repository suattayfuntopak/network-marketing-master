// Pure, testable Shopier `order.created` webhook logic: HS256 signature
// verification + defensive note/productId extraction. Free of Next/Supabase
// imports so it can be unit-tested in isolation.
//
// NOT: Shopier dokümanı (developer.shopier.com) order.created payload alan
// adlarını ve imzanın TAM olarak neyi kapsadığını net vermiyor. Bu yüzden:
//   - extractOrderFields defensive (birden çok olası alanı recursive tarar)
//   - verifyShopierWebhookSignature iki imza adayını dener (ham body / ts.body)
// İlk gerçek webhook /api/payment/shopier'da ham haliyle loglanır; alanlar
// kesinleşince burası sıkılaştırılır.

import crypto from 'crypto'

/** İmzada kullanılmış olabilecek payload varyantları (içerik kesin değil). */
function signatureCandidates(rawBody: string, timestamp?: string | null): { name: string; payload: string }[] {
  const out = [{ name: 'body', payload: rawBody }]
  if (timestamp) {
    out.push({ name: 'ts.body', payload: `${timestamp}.${rawBody}` })
    out.push({ name: 'ts+body', payload: `${timestamp}${rawBody}` })
    out.push({ name: 'body+ts', payload: `${rawBody}${timestamp}` })
  }
  return out
}

function digestEquals(signature: string, mac: Buffer): boolean {
  const trimmed = signature.trim()
  for (const enc of ['base64', 'base64url'] as const) {
    try {
      const b = Buffer.from(trimmed, enc)
      if (b.length === mac.length && crypto.timingSafeEqual(b, mac)) return true
    } catch {
      /* ignore */
    }
  }
  const lower = trimmed.toLowerCase()
  if (/^[0-9a-f]+$/.test(lower) && lower.length === mac.length * 2) {
    if (crypto.timingSafeEqual(Buffer.from(lower, 'hex'), mac)) return true
  }
  return false
}

/**
 * Shopier-Signature: HS256 (HMAC-SHA256). İmzalanan içerik kesin değil → birkaç
 * aday (ham gövde, ts.body, ts+body, body+ts) × kodlama (base64/base64url/hex)
 * denenir. Karşılaştırma sabit-zamanlı.
 */
export function verifyShopierWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined,
  timestamp?: string | null
): boolean {
  if (!signature || !secret) return false
  for (const { payload } of signatureCandidates(rawBody, timestamp)) {
    const mac = crypto.createHmac('sha256', secret).update(payload).digest()
    if (digestEquals(signature, mac)) return true
  }
  return false
}

/** Teşhis: eşleşen imza şemasının adını ('body/base64' gibi) ya da 'none' döndürür. */
export function describeShopierSignatureScheme(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined,
  timestamp?: string | null
): string {
  if (!signature || !secret) return 'no-input'
  for (const { name, payload } of signatureCandidates(rawBody, timestamp)) {
    const mac = crypto.createHmac('sha256', secret).update(payload).digest()
    for (const enc of ['base64', 'base64url', 'hex'] as const) {
      const expected = enc === 'hex' ? mac.toString('hex') : mac.toString(enc)
      if (signature.trim() === expected) return `${name}/${enc}`
    }
  }
  return 'none'
}

export interface ExtractedOrder {
  /** Müşteri notu — `<workspaceId>_<plan>_<period>_<ts>` (biz üretmiştik). */
  note: string | null
  /** Satın alınan ürünün Shopier id'si — tier'ın güvenli kaynağı. */
  productId: string | null
}

const NOTE_KEYS = ['note', 'customernote', 'customer_note', 'buyernote', 'buyer_note', 'ordernote']
const PRODUCT_ID_KEYS = ['productid', 'product_id']

/**
 * Payload'dan `note` + `productId`'yi defensive çıkarır (alan adları kesinleşene
 * dek). note için bilinen anahtarlar recursive aranır; productId için önce
 * bilinen anahtarlar, sonra `products[]`/`items[]` dizisinin ilk elemanının `id`'si.
 */
export function extractOrderFields(payload: unknown): ExtractedOrder {
  return {
    note: findStringByKeys(payload, NOTE_KEYS),
    productId: findStringByKeys(payload, PRODUCT_ID_KEYS) ?? findFirstProductId(payload),
  }
}

/** İç içe objelerde verilen anahtar adlarının ilk string/number eşleşmesini döndürür. */
function findStringByKeys(node: unknown, keys: string[], depth = 0): string | null {
  if (node == null || depth > 6) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findStringByKeys(item, keys, depth + 1)
      if (found) return found
    }
    return null
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (keys.includes(k.toLowerCase()) && (typeof v === 'string' || typeof v === 'number')) {
        const s = String(v).trim()
        if (s) return s
      }
    }
    // anahtar eşleşmediyse derine in
    for (const v of Object.values(node as Record<string, unknown>)) {
      const found = findStringByKeys(v, keys, depth + 1)
      if (found) return found
    }
  }
  return null
}

/** `products`/`items`/`lineItems` dizisinin ilk elemanının id'sini arar. */
function findFirstProductId(node: unknown, depth = 0): string | null {
  if (node == null || depth > 6) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const id = findFirstProductId(item, depth + 1)
      if (id) return id
    }
    return null
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    for (const containerKey of ['products', 'items', 'lineitems', 'line_items']) {
      const container = obj[containerKey] ?? obj[Object.keys(obj).find(k => k.toLowerCase() === containerKey) ?? '']
      if (Array.isArray(container) && container.length > 0) {
        const first = container[0] as Record<string, unknown>
        const id = first?.id ?? first?.productId ?? first?.product_id
        if (typeof id === 'string' || typeof id === 'number') {
          const s = String(id).trim()
          if (s) return s
        }
      }
    }
    for (const v of Object.values(obj)) {
      const id = findFirstProductId(v, depth + 1)
      if (id) return id
    }
  }
  return null
}
