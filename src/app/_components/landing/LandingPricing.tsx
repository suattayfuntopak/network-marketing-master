'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  formatTryPrice,
  getDisplayPrice,
  YEARLY_MONTHS_FREE,
  type BillingPeriod,
} from '@/lib/domain/pricing'
import { BANK_TRANSFER_ENABLED } from '@/lib/domain/bankTransfer'
import { BankTransferCard } from '@/components/payment/BankTransferCard'
import { DAILY_AI_LIMITS } from '@/lib/domain/planLimits'

export function LandingPricing() {
  const { t } = useTranslation()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  return (
    <section id="ucretlendirme" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('landingPage.pricingTitle')}
        </h2>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('landingPage.pricingSubtitle')}
        </p>

        {/* Monthly / Yearly Toggler */}
        <div className="flex flex-col items-center pt-4">
          <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-1 rounded-2xl relative shadow-inner backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-brand to-brand-accent text-white shadow-md'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('landingPage.pricingMonthly')}
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-brand to-brand-accent text-white shadow-md'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{t('landingPage.pricingYearly')}</span>
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 animate-pulse">
                {t('landingPage.pricingYearlyBadge')}
              </span>
            </button>
          </div>
          {billingPeriod === 'yearly' && (
            <p className="text-center text-[11px] text-slate-500 dark:text-zinc-400 max-w-lg mx-auto mt-3 leading-relaxed">
              {t('landingPage.yearlyBillingDisclaimer')}
            </p>
          )}
        </div>
      </div>

      {/* Three Pricing Cards */}
      <div className="grid grid-cols-1 gap-8 max-w-6xl mx-auto lg:grid-cols-3 items-stretch">
        
        {/* Plan A: Basic Plan */}
        <div className="rounded-3xl border border-brand/40 bg-indigo-50 dark:bg-[#12111E]/40 p-8 flex flex-col justify-between relative ring-2 ring-[#534AB7]/30 shadow-[0_20px_50px_rgba(83,74,183,0.15)] hover:border-brand/60 transition duration-300">
          <div className="absolute right-6 top-6">
            <span className="text-[9px] font-black text-indigo-900 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/30">
              {t('landingPage.planPopularBadge')}
            </span>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-800 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('landingPage.planBasicTag')}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t('landingPage.planBasicName')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {t('landingPage.planBasicDesc')}
              </p>
            </div>

            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {formatTryPrice(getDisplayPrice('basic', billingPeriod))}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-500">
                  / {t('landingPage.priceMonth')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                  {t('landingPage.planBasicYearlyNote', { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </div>

            {/* Bullet Features */}
            <ul className="space-y-3 border-t border-slate-200 dark:border-white/[0.05] pt-5 text-xs text-slate-500 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t('landingPage.planBasicFeat1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t('landingPage.planBasicFeat2', { limit: DAILY_AI_LIMITS.basic })}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t('landingPage.planBasicFeat3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t('landingPage.planBasicFeat4')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/kayit"
              className="block text-center rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.03] text-slate-700 dark:text-white py-3 text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {t('landingPage.planBasicCta')}
            </Link>
          </div>
        </div>

        {/* Plan B: Plus Plan */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-8 flex flex-col justify-between hover:border-zinc-700 transition duration-300 relative">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('landingPage.planPlusTag')}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                {t('landingPage.planPlusName')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {t('landingPage.planPlusDesc')}
              </p>
            </div>

            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {formatTryPrice(getDisplayPrice('plus', billingPeriod))}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-500">
                  / {t('landingPage.priceMonth')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit animate-pulse">
                  {t('landingPage.planPlusYearlyNote', { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </div>

            {/* Bullet Features */}
            <ul className="space-y-3 border-t border-slate-200 dark:border-white/[0.05] pt-5 text-xs text-slate-500 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">{t('landingPage.planPlusFeat1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t('landingPage.planPlusFeat2', { limit: DAILY_AI_LIMITS.plus })}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t('landingPage.planPlusFeat3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t('landingPage.planPlusFeat4')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/kayit"
              className="block text-center rounded-xl bg-gradient-to-r from-brand to-brand-accent text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition active:scale-95 cursor-pointer"
            >
              {t('landingPage.planPlusCta')}
            </Link>
          </div>
        </div>

        {/* Plan C: Pro Plan */}
        <div className="rounded-3xl border border-pink-500/30 bg-pink-50 dark:bg-gradient-to-b dark:from-[#1c0f1e] dark:to-[#0A0B10] p-8 flex flex-col justify-between hover:border-pink-500/60 transition duration-300 relative shadow-[0_20px_50px_rgba(219,39,119,0.1)]">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <span className="text-[9px] font-black text-pink-900 dark:text-pink-400 bg-pink-100 dark:bg-pink-500/20 border border-pink-200 dark:border-pink-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              👑 {t('landingPage.planProBadge')}
            </span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-pink-800 dark:text-pink-400 bg-pink-100 dark:bg-pink-500/15 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {t('landingPage.planProTag')}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                {t('landingPage.planProName')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {t('landingPage.planProDesc')}
              </p>
            </div>

            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {formatTryPrice(getDisplayPrice('pro', billingPeriod))}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-500">
                  / {t('landingPage.priceMonth')}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                  {t('landingPage.planProYearlyNote', { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </div>

            {/* Bullet Features */}
            <ul className="space-y-3 border-t border-slate-200 dark:border-white/[0.05] pt-5 text-xs text-slate-500 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">{t('landingPage.planProFeat1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span className="font-bold text-pink-700 dark:text-pink-300">
                  {t('landingPage.planProFeat2', { limit: DAILY_AI_LIMITS.pro })}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span>{t('landingPage.planProFeat3')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span>{t('landingPage.planProFeat4')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span>{t('landingPage.planProFeat5')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/kayit"
              className="block text-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-pink-500/10 transition active:scale-95 cursor-pointer"
            >
              {t('landingPage.planProCta')}
            </Link>
          </div>
        </div>

      </div>

      {BANK_TRANSFER_ENABLED && <BankTransferCard variant="landing" />}
    </section>
  )
}
