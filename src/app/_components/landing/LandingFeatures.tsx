'use client'

import {
  TrendingUp, Users, Bot, Shield, BarChart2, Sparkles,
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function LandingFeatures() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('landingPage.featuresTitle')}
        </h2>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('landingPage.featuresSubtitle')}
        </p>
      </div>

      {/* 6 Features Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Card 1: Pipeline */}
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 hover:border-indigo-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition duration-300">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {t('landingPage.feature1Title')}
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('landingPage.feature1Desc')}
          </p>
        </div>

        {/* Card 2: AI Coach */}
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 hover:border-purple-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition duration-300">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {t('landingPage.feature2Title')}
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('landingPage.feature2Desc')}
          </p>
        </div>

        {/* Card 3: Quick Start */}
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 hover:border-pink-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition duration-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {t('landingPage.feature3Title')}
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('landingPage.feature3Desc')}
          </p>
        </div>

        {/* Card 4: Field Rehearsal */}
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 hover:border-amber-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition duration-300">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {t('landingPage.feature4Title')}
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('landingPage.feature4Desc')}
          </p>
        </div>

        {/* Card 5: Compliance */}
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 hover:border-teal-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition duration-300">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {t('landingPage.feature5Title')}
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('landingPage.feature5Desc')}
          </p>
        </div>

        {/* Card 6: Team Analaytics */}
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 hover:border-blue-500/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition duration-300">
            <BarChart2 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {t('landingPage.feature6Title')}
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('landingPage.feature6Desc')}
          </p>
        </div>

      </div>
    </section>
  )
}
