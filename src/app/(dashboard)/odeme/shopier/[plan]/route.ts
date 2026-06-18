import { NextResponse } from 'next/server'
import { createShopierStorefrontRedirect } from '@/lib/domain/shopierPaymentSession'
import type { BillingPeriod, PlanId } from '@/lib/domain/pricing'

const VALID_PLANS: PlanId[] = ['basic', 'plus', 'pro']
const VALID_PERIODS: BillingPeriod[] = ['monthly', 'yearly']

/** Oturumlu kullanıcı → Shopier ürün linki (workspace note ile). Başarısızsa /odeme fallback. */
export async function GET(
  request: Request,
  context: { params: Promise<{ plan: string }> },
) {
  const { plan: rawPlan } = await context.params
  const plan = VALID_PLANS.includes(rawPlan as PlanId) ? (rawPlan as PlanId) : null
  if (!plan) {
    return NextResponse.redirect(new URL('/odeme', request.url))
  }

  const periodParam = new URL(request.url).searchParams.get('period')
  const period =
    periodParam && VALID_PERIODS.includes(periodParam as BillingPeriod)
      ? (periodParam as BillingPeriod)
      : 'monthly'

  const fallback = new URL(`/odeme?plan=${plan}&period=${period}`, request.url)
  try {
    const url = await createShopierStorefrontRedirect(plan, period)
    return NextResponse.redirect(url)
  } catch (err) {
    console.error(`[odeme/shopier/${plan}]`, err)
    return NextResponse.redirect(fallback)
  }
}
