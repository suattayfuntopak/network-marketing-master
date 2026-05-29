'use client'

import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'

export function LandingFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-slate-200 dark:border-white/[0.04] py-8 mt-12 bg-slate-50 dark:bg-[#06070B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} Network Marketing Master. {t('landingPage.footerRights')}
        </p>
        <div className="flex gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500">
          <Link href="/giris" className="hover:text-white transition">{t('landingPage.logIn')}</Link>
          <Link href="/kayit" className="hover:text-white transition">{t('landingPage.footerSignUp')}</Link>
        </div>
      </div>
    </footer>
  )
}
