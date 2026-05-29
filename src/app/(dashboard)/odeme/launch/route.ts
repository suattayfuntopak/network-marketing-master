import { NextRequest, NextResponse } from 'next/server'
import { buildShopierLaunchHtml } from '@/lib/domain/shopierCheckout'
import { createShopierPaymentSession } from '@/lib/domain/shopierPaymentSession'
import type { BillingPeriod, PlanId } from '@/lib/domain/pricing'

const VALID_PLANS: PlanId[] = ['leader', 'master', 'pro']
const VALID_PERIODS: BillingPeriod[] = ['monthly', 'yearly']

function parsePlan(value: FormDataEntryValue | null): PlanId | null {
  const plan = value?.toString()
  return plan && VALID_PLANS.includes(plan as PlanId) ? (plan as PlanId) : null
}

function parsePeriod(value: FormDataEntryValue | null): BillingPeriod {
  const period = value?.toString()
  return period && VALID_PERIODS.includes(period as BillingPeriod)
    ? (period as BillingPeriod)
    : 'monthly'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const plan = parsePlan(formData.get('plan'))
    const period = parsePeriod(formData.get('period'))

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const checkoutForm = await createShopierPaymentSession(plan, period)
    console.info('[Shopier Launch] ok', {
      plan,
      period,
      platform_order_id: checkoutForm.platform_order_id,
      total_order_value: checkoutForm.total_order_value,
      website_index: checkoutForm.website_index,
    })
    const html = buildShopierLaunchHtml(checkoutForm)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment launch failed'
    console.error('[Shopier Launch]', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
