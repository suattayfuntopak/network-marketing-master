'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Sparkles, Loader2, Coins, Calendar, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { toast } from 'sonner'
import { initiateShopierPayment, ShopierFormData } from '../actions'
import { Z } from '@/lib/ui/zIndex'

export function OdemeClient() {
  const { t, lang } = useTranslation()
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace()
  
  const [selectedPlan, setSelectedPlan] = useState<'leader' | 'master' | 'pro' | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ShopierFormData | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-submit the hidden form once parameters are compiled by the server action
  useEffect(() => {
    if (formData && formRef.current) {
      formRef.current.submit()
    }
  }, [formData])

  const handlePayment = async (plan: 'leader' | 'master' | 'pro') => {
    try {
      setLoading(true)
      setSelectedPlan(plan)
      toast.info(t('paymentPage.preparingCheckout'))

      // Fetch the verified parameters & HMAC-SHA256 signature from our server action with chosen period
      const data = await initiateShopierPayment(plan, billingPeriod)
      setFormData(data)
    } catch (err: any) {
      console.error('[OdemeClient] error initiating payment:', err)
      toast.error(
        t('paymentPage.checkoutError', {
          message: err?.message || t('paymentPage.unknownError'),
        })
      )
      setLoading(false)
      setSelectedPlan(null)
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

  // Determine active plan indicators
  const isProActive = workspace?.licenseType === 'pro'
  const isMasterActive = workspace?.licenseType === 'master' // Plus
  const isLeaderActive = workspace?.licenseType === 'leader' // Basic

  return (
    <div className="mx-auto max-w-7xl space-y-12 py-4">
      {/* ── Dynamic Loader Page / Redirecting Overlay ── */}
      {loading && formData && (
        <div className={`fixed inset-0 ${Z.fullscreen} flex flex-col items-center justify-center bg-[#0A0B10]/95 backdrop-blur-md`}>
          <div className="relative flex flex-col items-center max-w-md p-8 text-center space-y-6">
            <div className="absolute -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl animate-pulse"></div>
            
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                {t('paymentPage.redirectingShopier')}
              </h3>
              <p className="text-xs text-zinc-400">
                {t('paymentPage.establishingGateway')}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-[10px] text-zinc-500 font-mono text-left w-full space-y-1.5">
              <div>OrderID: {formData.platform_order_id}</div>
              <div>Plan: {selectedPlan === 'pro' ? 'Pro Lider' : selectedPlan === 'master' ? 'Plus Lider' : 'Basic Partner'} ({billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'})</div>
              <div>Amount: {formData.total_order_value} TRY</div>
            </div>
          </div>

          {/* Hidden HTML POST Form to auto-redirect */}
          <form
            ref={formRef}
            method="post"
            action="https://www.shopier.com/ShowProduct/api_pay4.php"
            className="hidden"
          >
            {Object.entries(formData).map(([key, val]) => (
              <input key={key} type="hidden" name={key} value={val} />
            ))}
          </form>
        </div>
      )}

      {/* ── Active License Info Widget ── */}
      {workspace && (isProActive || isMasterActive || isLeaderActive) && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t('paymentPage.activeLicenseFound')}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {t('paymentPage.currentPlanPrefix')}
                <span className="font-extrabold text-indigo-300">
                  {workspace.licenseType === 'pro'
                    ? t('paymentPage.planPro')
                    : workspace.licenseType === 'master'
                      ? t('paymentPage.planPlus')
                      : t('paymentPage.planBasic')}
                </span>
                {t('paymentPage.currentPlanSuffix')}
              </p>
            </div>
          </div>

          {workspace.licenseExpiresAt && (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-800/40 border border-zinc-700/50 px-4 py-2 text-xs font-semibold text-zinc-300">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>
                {t('paymentPage.expiresOn')}
                <span className="text-white font-bold">{formatDate(workspace.licenseExpiresAt)}</span>
              </span>
            </div>
          )}

          {!workspace.licenseExpiresAt && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-400 animate-pulse">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{t('paymentPage.unlimitedAdminLicense')}</span>
            </div>
          )}
        </div>
      )}

      {/* Monthly / Yearly Toggler */}
      <div className="flex flex-col items-center pt-2">
        <div className="inline-flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] p-1 rounded-2xl relative shadow-inner backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('paymentPage.monthlyBilling')}
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer ${
              billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>{t('paymentPage.yearlyBilling')}</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
              {t('paymentPage.bestValue')}
            </span>
          </button>
        </div>
      </div>

      {/* ── Three Pricing Cards ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
        
        {/* Plan A: Basic Plan */}
        <div className="rounded-3xl border border-white/[0.04] bg-white/[0.01] p-8 flex flex-col justify-between hover:border-zinc-700/50 transition duration-300 relative">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('paymentPage.soloBuilderTag')}
              </span>
              {isLeaderActive && (
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('paymentPage.active')}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">
                {t('paymentPage.basicPlanName')}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {t('paymentPage.basicPlanDesc')}
              </p>
            </div>

            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {billingPeriod === 'monthly' ? '₺399' : '₺3,499'}
                </span>
                <span className="text-xs text-zinc-500">
                  / {billingPeriod === 'monthly'
                    ? t('paymentPage.monthUnit')
                    : t('paymentPage.yearUnit')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                  {t('paymentPage.basicYearlyEquivalent')}
                </span>
              )}
            </div>

            {/* Bullet Features */}
            <ul className="space-y-3 border-t border-white/[0.05] pt-5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature4')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{t('paymentPage.basicFeature5')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handlePayment('leader')}
              disabled={loading || (billingPeriod === 'monthly' ? isLeaderActive : false)}
              className={`w-full text-center rounded-xl border border-white/[0.08] hover:bg-white/[0.03] text-white py-3 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                isLeaderActive && billingPeriod === 'monthly' ? 'opacity-50 cursor-not-allowed border-emerald-500/20 text-emerald-400 hover:bg-transparent' : 'cursor-pointer'
              }`}
            >
              {isLeaderActive && billingPeriod === 'monthly' ? (
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

        {/* Plan B: Plus Plan */}
        <div className="rounded-3xl border border-[#534AB7]/40 bg-[#12111E]/40 p-8 flex flex-col justify-between relative ring-2 ring-[#534AB7]/30 shadow-[0_20px_50px_rgba(83,74,183,0.15)] hover:border-[#534AB7]/60 transition duration-300">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {isMasterActive && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('paymentPage.active')}
              </span>
            )}
            <span className="text-[9px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t('paymentPage.popular')}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('paymentPage.growingTeamsTag')}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-white">
                {t('paymentPage.plusPlanName')}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {t('paymentPage.plusPlanDesc')}
              </p>
            </div>

            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {billingPeriod === 'monthly' ? '₺1,199' : '₺9,999'}
                </span>
                <span className="text-xs text-zinc-500">
                  / {billingPeriod === 'monthly'
                    ? t('paymentPage.monthUnit')
                    : t('paymentPage.yearUnit')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit animate-pulse">
                  {t('paymentPage.plusYearlyEquivalent')}
                </span>
              )}
            </div>

            {/* Bullet Features */}
            <ul className="space-y-3 border-t border-white/[0.05] pt-5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">{t('paymentPage.plusFeature1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature4')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature5')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature6')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t('paymentPage.plusFeature7')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handlePayment('master')}
              disabled={loading || (billingPeriod === 'monthly' ? isMasterActive : false)}
              className={`w-full text-center rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                isMasterActive && billingPeriod === 'monthly' ? 'opacity-50 cursor-not-allowed bg-none bg-zinc-800 text-zinc-500 hover:shadow-none' : 'cursor-pointer'
              }`}
            >
              {isMasterActive && billingPeriod === 'monthly' ? (
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

        {/* Plan C: Pro Plan */}
        <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-b from-[#1c0f1e] to-[#0A0B10] p-8 flex flex-col justify-between hover:border-pink-500/60 transition duration-300 relative shadow-[0_20px_50px_rgba(219,39,119,0.1)]">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {isProActive && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('paymentPage.active')}
              </span>
            )}
            <span className="text-[9px] font-black text-pink-400 bg-pink-500/20 border border-pink-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              👑 {t('paymentPage.diamondPro')}
            </span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('paymentPage.topOrgsTag')}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-white">
                {t('paymentPage.proPlanName')}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {t('paymentPage.proPlanDesc')}
              </p>
            </div>

            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {billingPeriod === 'monthly' ? '₺2,499' : '₺19,999'}
                </span>
                <span className="text-xs text-zinc-500">
                  / {billingPeriod === 'monthly'
                    ? t('paymentPage.monthUnit')
                    : t('paymentPage.yearUnit')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                  {t('paymentPage.proYearlyEquivalent')}
                </span>
              )}
            </div>

            {/* Bullet Features */}
            <ul className="space-y-3 border-t border-white/[0.05] pt-5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span className="font-bold text-white">{t('paymentPage.proFeature1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span className="font-bold text-pink-300">{t('paymentPage.proFeature2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature4')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature5')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature6')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                <span>{t('paymentPage.proFeature7')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handlePayment('pro')}
              disabled={loading || (billingPeriod === 'monthly' ? isProActive : false)}
              className={`w-full text-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-pink-500/10 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                isProActive && billingPeriod === 'monthly' ? 'opacity-50 cursor-not-allowed bg-none bg-zinc-800 text-zinc-500 hover:shadow-none' : 'cursor-pointer'
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

      {/* ── Extra Disclaimers ── */}
      <div className="max-w-2xl mx-auto text-center rounded-2xl border border-white/[0.03] bg-white/[0.01] p-6 space-y-2">
        <h4 className="text-xs font-bold text-zinc-300">
          {t('paymentPage.securePaymentTitle')}
        </h4>
        <p className="text-[10px] leading-relaxed text-zinc-500">
          {t('paymentPage.securePaymentDesc')}
        </p>
      </div>
    </div>
  )
}

