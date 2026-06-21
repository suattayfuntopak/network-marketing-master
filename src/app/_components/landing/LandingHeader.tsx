'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { TRFlag, USFlag } from '@/app/(dashboard)/_components/Header'
import { ThemeCycleButton } from '@/components/ui/ThemeCycleButton'
import { Z } from '@/lib/ui/zIndex'
import { LANDING_PRIMARY_CTA, LANDING_PRIMARY_CTA_SHADOW, NEXT_THEME_LABEL } from './constants'
import { scrollToLandingSection, scrollToTop } from './smoothScroll'
import type { ThemeMode } from '@/lib/ui/themeToggle'

export function LandingHeader() {
  const { t, lang, setLang } = useTranslation()

  return (
    <header className={`sticky top-0 ${Z.header} w-full backdrop-blur-md bg-white/80 dark:bg-[#0A0B10]/70 border-b border-slate-200 dark:border-white/[0.04]`}>
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4 lg:px-8">
        {/* Logo — tıklanınca sayfa başına dön */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={lang === 'en' ? 'Back to top' : 'Sayfa başına dön'}
          className="flex flex-1 min-w-0 items-center gap-2 text-left cursor-pointer"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900/80 p-0.5 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] sm:h-9 sm:w-9">
            <Image src="/logo.png" alt="NMM Logo" width={36} height={36} className="h-full w-full rounded-full object-cover" />
          </div>
          <span className="truncate text-xs font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-700 dark:from-white dark:to-indigo-100 bg-clip-text text-transparent sm:text-base">
            Network Marketing Master
          </span>
        </button>

        {/* Ortalı bölüm menüsü — yalnız masaüstü; smooth-scroll */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex">
          <a
            href="#ozellikler"
            onClick={e => scrollToLandingSection(e, 'ozellikler')}
            className="text-sm font-semibold text-slate-600 transition hover:text-brand dark:text-white/70 dark:hover:text-white"
          >
            {t('landingPage.navFeatures')}
          </a>
          <a
            href="#nasil-calisir"
            onClick={e => scrollToLandingSection(e, 'nasil-calisir')}
            className="text-sm font-semibold text-slate-600 transition hover:text-brand dark:text-white/70 dark:hover:text-white"
          >
            {t('landingPage.navHowItWorks')}
          </a>
          <a
            href="#ucretlendirme"
            onClick={e => scrollToLandingSection(e, 'ucretlendirme')}
            className="text-sm font-semibold text-slate-600 transition hover:text-brand dark:text-white/70 dark:hover:text-white"
          >
            {t('landingPage.navPricing')}
          </a>
        </nav>

        {/* Navigation & Auth */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeCycleButton
            buttonClassName="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white sm:h-9 sm:w-9 sm:rounded-xl"
            iconClassName="h-3.5 w-3.5"
            titleForMode={(mode: ThemeMode) => NEXT_THEME_LABEL[mode]}
          />

          {/* Language Switch: active language's flag — clicking switches to other language */}
          <div className="flex shrink-0 items-center justify-center">
            {lang === 'tr' ? (
              <button
                type="button"
                onClick={() => setLang('en')}
                className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl text-slate-400 dark:text-white/50 transition hover:bg-slate-100 dark:hover:bg-white/10"
                title="Switch to English"
                aria-label="Switch to English"
              >
                <TRFlag />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLang('tr')}
                className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl text-slate-400 dark:text-white/50 transition hover:bg-slate-100 dark:hover:bg-white/10"
                title="Türkçe'ye geç"
                aria-label="Türkçe'ye geç"
              >
                <USFlag />
              </button>
            )}
          </div>

          {/* Login — icon only on mobile, text on sm+ */}
          <Link
            href="/giris"
            title={t('landingPage.logIn')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 dark:text-white/60 transition hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white sm:h-auto sm:w-auto sm:rounded-lg sm:px-3.5 sm:py-1.5"
          >
            <LogIn className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden text-xs font-bold sm:inline">{t('landingPage.logIn')}</span>
          </Link>

          {/* Register — icon only on mobile, text+arrow on sm+ */}
          <Link
            href="/kayit"
            title={t('landingPage.getStarted')}
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${LANDING_PRIMARY_CTA} ${LANDING_PRIMARY_CTA_SHADOW} transition hover:opacity-90 active:scale-95 sm:h-auto sm:w-auto sm:gap-1 sm:rounded-lg sm:px-3.5 sm:py-1.5`}
          >
            <UserPlus className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden text-xs font-bold sm:inline">{t('landingPage.getStarted')}</span>
            <ArrowRight className="hidden h-3 w-3 sm:inline" />
          </Link>
        </div>
      </div>
    </header>
  )
}
