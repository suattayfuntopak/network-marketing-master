import crypto from 'crypto'

/** Shopier currency enum: 0 = TRY, 1 = USD, 2 = EUR */
export const SHOPIER_CURRENCY_TRY = '0'

/** Digital / virtual subscription product */
export const SHOPIER_PRODUCT_TYPE_VIRTUAL = '1'

export function formatShopierOrderValue(amount: number): string {
  return amount.toFixed(2)
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
    buyer_id_nr: input.buyer.userId,
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
    modul_version: '1.0.4',
    random_nr: input.order.randomNr,
    signature,
    callback: input.callbackUrl,
  }
}
