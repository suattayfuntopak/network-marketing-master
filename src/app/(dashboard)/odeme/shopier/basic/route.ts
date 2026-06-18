import { NextResponse } from 'next/server'
import { createShopierStorefrontRedirect } from '@/lib/domain/shopierPaymentSession'
import { ODEME_BASIC_DEEP_LINK } from '@/lib/domain/paymentRoutes'

/** Oturumlu kullanıcı → Shopier Basic aylık (workspace note ile). Başarısızsa /odeme fallback. */
export async function GET(request: Request) {
  const fallback = new URL(ODEME_BASIC_DEEP_LINK, request.url)
  try {
    const url = await createShopierStorefrontRedirect('basic', 'monthly')
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[odeme/shopier/basic]', err)
    return NextResponse.redirect(fallback)
  }
}
