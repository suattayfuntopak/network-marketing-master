'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/providers/LanguageProvider'
import { Mail } from 'lucide-react'
import { scrollToLandingSection, scrollToTop } from './smoothScroll'

export function LandingFooter() {
  const { lang, t } = useTranslation()
  const isEn = lang === 'en'

  return (
    <footer className="relative border-t border-slate-200/80 dark:border-white/[0.04] bg-slate-50 dark:bg-[#06070B] pt-16 pb-8 transition-colors duration-300 overflow-hidden">
      
      {/* Background Decorative Blur Orb */}
      <div className="absolute bottom-[-100px] left-[50%] -translate-x-[50%] h-[250px] w-[500px] rounded-full bg-brand/5 blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-200/60 dark:border-white/[0.03]">
          
          {/* Brand and Description Column */}
          <div className="md:col-span-4 space-y-4">
            <button
              type="button"
              onClick={scrollToTop}
              aria-label={isEn ? 'Back to top' : 'Sayfa başına dön'}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/80 p-0.5 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Image src="/logo.png" alt="NMM Logo" width={32} height={32} className="h-full w-full rounded-full object-cover" />
              </div>
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-zinc-200 dark:to-indigo-300 bg-clip-text text-transparent">
                Network Marketing Master
              </span>
            </button>
          </div>

          {/* Links Grid Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            
            {/* Column 1: Product */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                {isEn ? 'PRODUCT' : 'ÜRÜN'}
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li>
                  <a href="#ozellikler" onClick={e => scrollToLandingSection(e, 'ozellikler')} className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.navFeatures')}
                  </a>
                </li>
                <li>
                  <a href="#nasil-calisir" onClick={e => scrollToLandingSection(e, 'nasil-calisir')} className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.navHowItWorks')}
                  </a>
                </li>
                <li>
                  <a href="#ucretlendirme" onClick={e => scrollToLandingSection(e, 'ucretlendirme')} className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.navPricing')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Legal */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                {isEn ? 'LEGAL' : 'YASAL BİLGİLER'}
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li>
                  <Link href="/kvkk" className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.footerKvkk')}
                  </Link>
                </li>
                <li>
                  <Link href="/kullanim-kosullari" className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.footerTerms')}
                  </Link>
                </li>
                <li>
                  <Link href="/guvenlik" className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.footerSecurity')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Membership */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                {isEn ? 'MEMBERSHIP' : 'ÜYELİK'}
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li>
                  <Link href="/giris" className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.logIn')}
                  </Link>
                </li>
                <li>
                  <Link href="/kayit" className="hover:text-brand dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.footerSignUp')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Support & Contact */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                {isEn ? 'CONTACT' : 'İLETİŞİM'}
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li>
                  <a
                    href="mailto:info@suattayfuntopak.com"
                    className="hover:text-brand dark:hover:text-white transition-colors duration-200 flex items-center gap-1.5 group min-w-0"
                  >
                    <Mail className="h-3.5 w-3.5 text-brand dark:text-[#a09be8] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                    <span className="whitespace-nowrap text-[10px] sm:text-xs">info@suattayfuntopak.com</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="pt-8 flex items-center justify-center text-center">
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 font-medium">
            &copy; {new Date().getFullYear()} Network Marketing Master. {t('landingPage.footerRights')}
          </p>
        </div>

      </div>
    </footer>
  )
}

