import crypto from 'crypto'

/** Shopier currency enum: 0 = TRY, 1 = USD, 2 = EUR */
export const SHOPIER_CURRENCY_TRY = '0'

/** Digital / virtual subscription product (ProductType::DOWNLOADABLE_VIRTUAL) */
export const SHOPIER_PRODUCT_TYPE_VIRTUAL = '1'

export const SHOPIER_PAYMENT_ENDPOINT = 'https://www.shopier.com/ShowProduct/api_pay4.php'

export const SHOPIER_MODULE_VERSION = '1.0.4'

export interface ShopierCredentials {
  apiKey: string
  apiSecret: string
  websiteIndex: string
}

/** Reads trimmed Shopier credentials — supports SHOPIER_API_KEY or legacy SHOPIER_API_USER. */
export function getShopierCredentials(): ShopierCredentials {
  const apiKey = (
    process.env.SHOPIER_CHECKOUT_API_KEY ??
    process.env.SHOPIER_API_KEY ??
    process.env.SHOPIER_API_USER ??
    ''
  ).trim()
  const apiSecret = (process.env.SHOPIER_API_SECRET ?? '').trim()
  const websiteIndex = (process.env.SHOPIER_WEBSITE_INDEX ?? '1').trim()

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Shopier credentials missing: set SHOPIER_API_KEY (or SHOPIER_API_USER) and SHOPIER_API_SECRET'
    )
  }

  return { apiKey, apiSecret, websiteIndex }
}

/** Matches official PHP SDK (`10.0`, `999.0`) — signature must use the exact submitted string. */
export function formatShopierOrderValue(amount: number): string {
  const rounded = Math.round(amount * 100) / 100
  return Number.isInteger(rounded) ? `${rounded}.0` : rounded.toFixed(2)
}

/** Shopier expects a numeric buyer id — derive a stable positive int from UUID. */
export function toShopierBuyerId(userId: string): string {
  const hex = userId.replace(/-/g, '').slice(0, 12)
  const numeric = parseInt(hex, 16)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return String(Date.now() % 2147483647)
  }
  return String(numeric % 2147483647)
}

/** 10-digit local phone (no country code) as required by Shopier examples. */
export function normalizeShopierPhone(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length >= 10) {
    const local = digits.startsWith('90') ? digits.slice(2) : digits
    return local.slice(-10)
  }
  return '5555555555'
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Auto-submit HTML page — multipart avoids base64 `+` corruption in urlencoded POST bodies. */
export function buildShopierLaunchHtml(
  formFields: Record<string, string>,
  options?: { title?: string; message?: string }
): string {
  const inputs = Object.entries(formFields)
    .map(
      ([key, val]) =>
        `<input type="hidden" name="${escapeHtmlAttr(key)}" value="${escapeHtmlAttr(val)}" />`
    )
    .join('\n')

  const title = options?.title ?? "Shopier'e yonlendiriliyorsunuz"
  const message = options?.message ?? 'Guvenli odeme gecidi aciliyor. Lutfen pencereyi kapatmayin.'

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtmlAttr(title)}</title>
</head>
<body>
  <p style="font-family:system-ui,sans-serif;text-align:center;margin-top:2rem;color:#444">${escapeHtmlAttr(message)}</p>
  <form id="shopier_payment_form" method="post" action="${SHOPIER_PAYMENT_ENDPOINT}" enctype="multipart/form-data">
${inputs}
  </form>
  <script>document.getElementById('shopier_payment_form').submit();</script>
</body>
</html>`
}

export function buildShopierSignaturePayload(input: {
  randomNr: string
  platformOrderId: string
  totalOrderValue: string
  currency?: string
}): string {
  const currency = input.currency ?? SHOPIER_CURRENCY_TRY
  return input.randomNr + input.platformOrderId + input.totalOrderValue + currency
}

export function signShopierCheckout(
  payload: string,
  apiSecret: string
): string {
  return crypto.createHmac('sha256', apiSecret).update(payload).digest('base64')
}

export function getShopierCallbackUrl(appOrigin?: string | null): string {
  const base = (appOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://nmm.suattayfuntopak.com')
    .replace(/\/$/, '')
  return `${base}/api/payment/shopier`
}

export interface ShopierCheckoutBuyer {
  /** Numeric string — use {@link toShopierBuyerId} for Supabase UUIDs */
  userId: string
  buyerName: string
  buyerSurname: string
  buyerEmail: string
  buyerPhone: string
}

export interface ShopierCheckoutOrder {
  platformOrderId: string
  productName: string
  totalOrderValue: string
  randomNr: string
}

/** All fields required by Shopier api_pay4.php (see official/community integrations). */
export function buildShopierCheckoutForm(input: {
  apiKey: string
  apiSecret: string
  buyer: ShopierCheckoutBuyer
  order: ShopierCheckoutOrder
  callbackUrl: string
  websiteIndex?: string
}): Record<string, string> {
  const currency = SHOPIER_CURRENCY_TRY
  const signaturePayload = buildShopierSignaturePayload({
    randomNr: input.order.randomNr,
    platformOrderId: input.order.platformOrderId,
    totalOrderValue: input.order.totalOrderValue,
    currency,
  })
  const signature = signShopierCheckout(signaturePayload, input.apiSecret)

  const addressLine = 'Dijital abonelik'
  const city = 'Istanbul'
  const country = 'Turkey'
  const postcode = '34000'

  return {
    API_key: input.apiKey,
    website_index: input.websiteIndex ?? '1',
    platform_order_id: input.order.platformOrderId,
    product_name: input.order.productName,
    product_type: SHOPIER_PRODUCT_TYPE_VIRTUAL,
    buyer_name: input.buyer.buyerName,
    buyer_surname: input.buyer.buyerSurname,
    buyer_email: input.buyer.buyerEmail,
    buyer_account_age: '0',
    buyer_id_nr: input.buyer.userId.replace(/\D/g, '').slice(0, 15) || '0',
    buyer_phone: input.buyer.buyerPhone,
    billing_address: addressLine,
    billing_city: city,
    billing_country: country,
    billing_postcode: postcode,
    shipping_address: addressLine,
    shipping_city: city,
    shipping_country: country,
    shipping_postcode: postcode,
    total_order_value: input.order.totalOrderValue,
    currency,
    platform: '0',
    is_in_frame: '0',
    current_language: '0',
    modul_version: SHOPIER_MODULE_VERSION,
    random_nr: input.order.randomNr,
    signature,
    callback: input.callbackUrl,
  }
}
