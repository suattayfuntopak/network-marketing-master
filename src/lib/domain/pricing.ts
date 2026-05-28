export type PlanId = 'leader' | 'master' | 'pro'
export type BillingPeriod = 'monthly' | 'yearly'

/** 25% annual discount — equivalent to 3 months free on a 12-month plan. */
export const YEARLY_DISCOUNT_RATE = 0.25
export const YEARLY_MONTHS_FREE = 3

const MONTHLY_PRICES: Record<PlanId, number> = {
  leader: 399,
  master: 999,
  pro: 1699,
}

export function getMonthlyPrice(plan: PlanId): number {
  return MONTHLY_PRICES[plan]
}

/** Per-month price shown when yearly billing is selected (25% off list monthly). */
export function getYearlyMonthlyDisplayPrice(plan: PlanId): number {
  return Math.round(MONTHLY_PRICES[plan] * (1 - YEARLY_DISCOUNT_RATE))
}

export function getDisplayPrice(plan: PlanId, period: BillingPeriod): number {
  return period === 'yearly' ? getYearlyMonthlyDisplayPrice(plan) : getMonthlyPrice(plan)
}

/** Actual Shopier charge for annual plans (12 × discounted monthly rate). */
export function getYearlyChargeAmount(plan: PlanId): number {
  return getYearlyMonthlyDisplayPrice(plan) * 12
}

export function getShopierAmount(plan: PlanId, period: BillingPeriod): string {
  const amount = period === 'yearly' ? getYearlyChargeAmount(plan) : getMonthlyPrice(plan)
  return String(amount)
}

export function formatTryPrice(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR')}`
}
