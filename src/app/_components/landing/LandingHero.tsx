'use client'

import Link from 'next/link'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function LandingHero() {
  const { t, lang } = useTranslation()

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center space-y-8">
      {/* Glow badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-indigo-500/30 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/5 px-4.5 py-2 text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-indigo-300 animate-pulse shadow-md shadow-indigo-500/10 dark:shadow-indigo-500/5">
        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <span>{t('landingPage.heroBadge')}</span>
      </div>

      {/* Title */}
      <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
        {lang === 'en' ? (
          <>
            Build a <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">High-Performance</span> & Active Network Marketing Team!
          </>
        ) : (
          <>
            Aktif ve <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Yüksek Performanslı</span> Bir Network Marketing Ekibi İnşa Edin!
          </>
        )}
      </h1>

      {/* Subtitle */}
      <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
        {t('landingPage.heroSubtitle')}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link
          href="/kayit"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white px-6 py-3.5 text-sm font-bold shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition active:scale-95 cursor-pointer"
        >
          <span>{t('landingPage.startFreeTrial')}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="#nasil-calisir"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] text-slate-600 dark:text-zinc-300 px-6 py-3.5 text-sm font-bold transition cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 text-indigo-400" />
          <span>{t('landingPage.howItWorks')}</span>
        </a>
      </div>
    </section>
  )
}
