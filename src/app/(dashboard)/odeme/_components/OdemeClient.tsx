'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Sparkles, Loader2, Calendar, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import {
  formatTryPrice,
  getDisplayPrice,
  YEARLY_MONTHS_FREE,
  type BillingPeriod,
} from '@/lib/domain/pricing'
import { BANK_TRANSFER_ENABLED } from '@/lib/domain/bankTransfer'
import { BankTransferCard } from '@/components/payment/BankTransferCard'
import { notifyBankTransferAction } from '../actions'
import { DAILY_AI_LIMITS } from '@/lib/domain/planLimits'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'

const ACTIVE_PLAN_BTN =
  'opacity-100 cursor-not-allowed !bg-neutral-100 dark:!bg-neutral-900 !text-black dark:!text-white hover:shadow-none border border-[var(--border)]'

/** Gradient plan cards — keep brand colors + white label when active */
const GRADIENT_ACTIVE_PLAN_BTN =
  'opacity-100 cursor-not-allowed !text-white hover:shadow-none brightness-[0.92]'

const YEARLY_DISCOUNT_BADGE =
  'text-[9px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full border border-emerald-700 shadow-sm shrink-0'

export function OdemeClient() {
  const { t, lang } = useTranslation()
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const searchParams = useSearchParams()
  const basicPlanRef = useRef<HTMLDivElement>(null)
  const highlightBasic = searchParams.get('plan') === 'basic'
  const highlightYearly = searchParams.get('period') === 'yearly'

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    highlightYearly ? 'yearly' : 'monthly',
  )
  const [loading, setLoading] = useState(false)

  useBodyScrollLock(loading)

  const basicDeepLinkLogged = useRef(false)
  const odemeViewLogged = useRef(false)

  useEffect(() => {
    if (!odemeViewLogged.current) {
      odemeViewLogged.current = true
      void logProductEventAction(PRODUCT_EVENTS.odemePageView, {})
    }
  }, [])

  useEffect(() => {
    if (highlightBasic && basicPlanRef.current) {
      basicPlanRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (highlightBasic && !basicDeepLinkLogged.current) {
      basicDeepLinkLogged.current = true
      void logProductEventAction(PRODUCT_EVENTS.odemeBasicDeepLink, {
        source: 'query',
        period: highlightYearly ? 'yearly' : 'monthly',
      })
    }
  }, [highlightBasic, highlightYearly])

  const handlePayment = async (plan: 'basic' | 'plus' | 'pro') => {
    setLoading(true)
    toast.info(t('paymentPage.preparingCheckout'))

    try {
      const body = new FormData()
      body.set('plan', plan)
      body.set('period', billingPeriod)

      const res = await fetch('/odeme/launch', {
        method: 'POST',
        body,
        credentials: 'include',
      })

      const contentType = res.headers.get('content-type') ?? ''

      const bodyText = await res.text()

      if (!res.ok) {
        let message = t('paymentPage.unknownError')
        try {
          const data = JSON.parse(bodyText) as { error?: string }
          if (data.error) message = data.error
        } catch {
          if (bodyText) message = bodyText.slice(0, 200)
        }
        throw new Error(message)
      }

      // Yeni Shopier akışı (dükkan yönlendirme): JSON { redirectUrl } → tarayıcıyı yönlendir.
      if (contentType.includes('application/json')) {
        const data = JSON.parse(bodyText) as { redirectUrl?: string; error?: string }
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }
        throw new Error(data.error || t('paymentPage.unknownError'))
      }

      // Eski api_pay4 akışı: otomatik gönderilen HTML formu.
      if (contentType.includes('text/html')) {
        document.open()
        document.write(bodyText)
        document.close()
        return
      }

      throw new Error(t('paymentPage.unknownError'))
    } catch (err: unknown) {
      console.error('[OdemeClient] checkout launch failed:', err)
      toast.error(
        t('paymentPage.checkoutError', {
          message: err instanceof Error ? err.message : t('paymentPage.unknownError'),
        })
      )
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-[var(--text-3)]">
          {t('paymentPage.loadingPlans')}
        </p>
      </div>
    )
  }

  const isProActive = workspace?.licenseType === 'pro'
  const isPlusActive = workspace?.licenseType === 'plus'
  const isBasicActive = workspace?.licenseType === 'basic'

  return (
    <div className="mx-auto max-w-7xl space-y-12 py-4">
      {loading && (
        <div className={`fixed inset-0 ${Z.fullscreen} flex flex-col items-center justify-center bg-[var(--bg)]/95 backdrop-blur-md`}>
          <div className="relative flex flex-col items-center max-w-md p-8 text-center space-y-6">
            <div className="absolute -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[var(--text-1)]">
                {t('paymentPage.redirectingShopier')}
              </h3>
              <p className="text-xs text-[var(--text-2)]">
                {t('paymentPage.establishingGateway')}
              </p>
            </div>
          </div>
        </div>
      )}

      {workspace && (isProActive || isPlusActive || isBasicActive) && (
        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-1)]">
                {t('paymentPage.activeLicenseFound')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1">
                {t('paymentPage.currentPlanPrefix')}
                <span className="font-extrabold text-indigo-600 dark:text-indigo-300">
                  {workspace.licenseType === 'pro'
                    ? t('paymentPage.planPro')
                    : workspace.licenseType === 'plus'
                      ? t('paymentPage.planPlus')
                      : t('paymentPage.planBasic')}
                </span>
                {t('paymentPage.currentPlanSuffix')}
              </p>
            </div>
          </div>

          {workspace.licenseExpiresAt && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-2)]">
              <Calendar className="h-4 w-4 text-[var(--text-3)] shrink-0" />
              <span>
                {t('paymentPage.expiresOn')}
                <span className="text-[var(--text-1)] font-bold">{formatDate(workspace.licenseExpiresAt)}</span>
              </span>
            </div>
          )}

          {!workspace.licenseExpiresAt && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{t('paymentPage.unlimitedAdminLicense')}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center pt-2">
        <div className="inline-flex items-center gap-1 bg-[var(--bg-subtle)] border border-[var(--border)] p-1 rounded-2xl relative shadow-inner">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              billingPeriod === 'monthly'
                ? 'brand-cta text-white shadow-md'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
          >
            {t('paymentPage.monthlyBilling')}
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer ${
              billingPeriod === 'yearly'
                ? 'brand-cta text-white shadow-md'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
          >
            <span>{t('paymentPage.yearlyBilling')}</span>
            <span className={YEARLY_DISCOUNT_BADGE}>
              {t('paymentPage.bestValue')}
            </span>
          </button>
        </div>
        {billingPeriod === 'yearly' && (
          <p className="text-center text-[11px] text-[var(--text-3)] max-w-3xl mx-auto mt-3 whitespace-nowrap overflow-x-auto scrollbar-none px-2">
            {t('paymentPage.yearlyBillingDisclaimer')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
        
        {/* Basic Plan */}
        <div
          ref={basicPlanRef}
          id="plan-basic"
          className={`rounded-3xl border bg-[var(--bg-card)] p-8 flex flex-col justify-between relative transition duration-300 ${
            highlightBasic
              ? 'border-brand/50 ring-2 ring-[#534AB7]/30 shadow-lg shadow-indigo-500/10'
              : 'border-brand/35 ring-2 ring-[#534AB7]/20 shadow-lg shadow-indigo-500/5 hover:border-brand/50'
          }`}
        >
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {isBasicActive && (
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('paymentPage.active')}
              </span>
            )}
            <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t('paymentPage.popular')}
            </span>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('paymentPage.soloBuilderTag')}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[var(--text-1)]">
                {t('paymentPage.basicPlanName')}
              </h3>
              {t('paymentPage.basicPlanDesc') ? (
                <p className="text-xs text-[var(--text-2)] mt-1">
                  {t('paymentPage.basicPlanDesc')}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--text-1)]">
                  {formatTryPrice(getDisplayPrice('basic', billingPeriod))}
                </span>
                <span className="text-xs text-[var(--text-3)]">
                  / {t('paymentPage.monthUnit')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                  {t('paymentPage.basicYearlyEquivalent', { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </div>

            <ul className="space-y-3 border-t border-[var(--border)] pt-5 text-xs text-[var(--text-2)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature2', { limit: DAILY_AI_LIMITS.basic })}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature4')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature5')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handlePayment('basic')}
              disabled={loading || (billingPeriod === 'monthly' ? isBasicActive : false)}
              className={`w-full text-center rounded-xl border border-[var(--border)] hover:bg-[var(--bg-subtle)] text-[var(--text-1)] py-3 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                isBasicActive && billingPeriod === 'monthly' ? ACTIVE_PLAN_BTN : 'cursor-pointer'
              }`}
            >
              {isBasicActive && billingPeriod === 'monthly' ? (
                t('paymentPage.currentActivePlan')
              ) : (
                <>
                  <span>
                    {billingPeriod === 'monthly'
                      ? t('paymentPage.basicBuyMonthly')
                      : t('paymentPage.basicBuyYearly')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plus Plan */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 flex flex-col justify-between relative hover:border-indigo-300/60 dark:hover:border-zinc-600/50 transition duration-300 shadow-sm">
          {isPlusActive && (
            <div className="absolute right-6 top-6">
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('paymentPage.active')}
              </span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('paymentPage.growingTeamsTag')}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[var(--text-1)]">
                {t('paymentPage.plusPlanName')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1">
                {t('paymentPage.plusPlanDesc')}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--text-1)]">
                  {formatTryPrice(getDisplayPrice('plus', billingPeriod))}
                </span>
                <span className="text-xs text-[var(--text-3)]">
                  / {t('paymentPage.monthUnit')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit animate-pulse">
                  {t('paymentPage.plusYearlyEquivalent', { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </div>

            <ul className="space-y-3 border-t border-[var(--border)] pt-5 text-xs text-[var(--text-2)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature1', { limit: DAILY_AI_LIMITS.plus })}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature4')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handlePayment('plus')}
              disabled={loading || (billingPeriod === 'monthly' ? isPlusActive : false)}
              className={`w-full text-center rounded-xl brand-cta text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                isPlusActive && billingPeriod === 'monthly' ? GRADIENT_ACTIVE_PLAN_BTN : 'cursor-pointer'
              }`}
            >
              {isPlusActive && billingPeriod === 'monthly' ? (
                t('paymentPage.currentActivePlan')
              ) : (
                <>
                  <span>
                    {billingPeriod === 'monthly'
                      ? t('paymentPage.plusBuyMonthly')
                      : t('paymentPage.plusBuyYearly')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="rounded-3xl border border-pink-400/35 dark:border-pink-500/30 bg-gradient-to-b from-pink-50/80 to-[var(--bg-card)] dark:from-[#1c0f1e] dark:to-[#0A0B10] p-8 flex flex-col justify-between hover:border-pink-400/55 dark:hover:border-pink-500/60 transition duration-300 relative shadow-lg shadow-pink-500/5 dark:shadow-[0_20px_50px_rgba(219,39,119,0.1)]">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {isProActive && (
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('paymentPage.active')}
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('paymentPage.topOrgsTag')}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[var(--text-1)]">
                {t('paymentPage.proPlanName')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1">
                {t('paymentPage.proPlanDesc')}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--text-1)]">
                  {formatTryPrice(getDisplayPrice('pro', billingPeriod))}
                </span>
                <span className="text-xs text-[var(--text-3)]">
                  / {t('paymentPage.monthUnit')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                  {t('paymentPage.proYearlyEquivalent', { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </div>

            <ul className="space-y-3 border-t border-[var(--border)] pt-5 text-xs text-[var(--text-2)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-500 dark:text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature1', { limit: DAILY_AI_LIMITS.pro })}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-500 dark:text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-500 dark:text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-500 dark:text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature4')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handlePayment('pro')}
              disabled={loading || (billingPeriod === 'monthly' ? isProActive : false)}
              className={`w-full text-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-pink-500/10 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                isProActive && billingPeriod === 'monthly' ? GRADIENT_ACTIVE_PLAN_BTN : 'cursor-pointer'
              }`}
            >
              {isProActive && billingPeriod === 'monthly' ? (
                t('paymentPage.currentActivePlan')
              ) : (
                <>
                  <span>
                    {billingPeriod === 'monthly'
                      ? t('paymentPage.proBuyMonthly')
                      : t('paymentPage.proBuyYearly')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {BANK_TRANSFER_ENABLED && (
        <BankTransferCard variant="dashboard" onNotify={notifyBankTransferAction} />
      )}

      <div className="max-w-2xl mx-auto text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-2 shadow-sm">
        <h4 className="text-xs font-bold text-[var(--text-1)]">
          {t('paymentPage.securePaymentTitle')}
        </h4>
        <p className="text-[10px] leading-relaxed text-[var(--text-3)]">
          {t('paymentPage.securePaymentDesc')}
        </p>
      </div>
    </div>
  )
}
