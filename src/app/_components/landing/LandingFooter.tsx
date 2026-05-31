'use client'

import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { Mail, ShieldCheck, Activity, Terminal } from 'lucide-react'

export function LandingFooter() {
  const { lang, t } = useTranslation()
  const isEn = lang === 'en'

  return (
    <footer className="relative border-t border-slate-200/80 dark:border-white/[0.04] bg-slate-50 dark:bg-[#06070B] pt-16 pb-8 transition-colors duration-300 overflow-hidden">
      
      {/* Background Decorative Blur Orb */}
      <div className="absolute bottom-[-100px] left-[50%] -translate-x-[50%] h-[250px] w-[500px] rounded-full bg-[#534AB7]/5 blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-200/60 dark:border-white/[0.03]">
          
          {/* Brand and Description Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#534AB7] to-[#7B70F3] shadow-md shadow-[#534AB7]/20">
                <Terminal className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-zinc-200 dark:to-indigo-300 bg-clip-text text-transparent">
                Network Marketing Master
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed max-w-sm">
              {isEn
                ? 'Standardize candidate pipelines, simulate interactive AI roleplays, and track downline progress on autopilot with our next-generation MLM accelerator.'
                : 'Yeni nesil YZ destekli MLM hızlandırıcıyla aday hunilerini standartlaştırın, interaktif saha provaları yapın ve ekibinizin gelişimini otomatik pilotta izleyin.'}
            </p>
            
            {/* Status Pulse Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/[0.05] bg-white/60 dark:bg-white/[0.02] px-3.5 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-600 dark:text-zinc-400 uppercase">
                {isEn ? 'All Systems Operational' : 'Tüm Servisler Aktif'}
              </span>
            </div>
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
                  <Link href="/acilis#ozellikler" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
                    {isEn ? 'Features' : 'Özellikler'}
                  </Link>
                </li>
                <li>
                  <Link href="/acilis#nasil-calisir" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
                    {isEn ? 'How it Works' : 'Nasıl Çalışır?'}
                  </Link>
                </li>
                <li>
                  <Link href="/acilis#ucretlendirme" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
                    {isEn ? 'Pricing' : 'Fiyatlandırma'}
                  </Link>
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
                  <Link href="/kvkk" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.footerKvkk')}
                  </Link>
                </li>
                <li>
                  <Link href="/kullanim-kosullari" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.footerTerms')}
                  </Link>
                </li>
                <li>
                  <Link href="/guvenlik" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
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
                  <Link href="/giris" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
                    {t('landingPage.logIn')}
                  </Link>
                </li>
                <li>
                  <Link href="/kayit" className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200">
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
                    className="hover:text-[#534AB7] dark:hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#534AB7] dark:text-[#a09be8] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                    <span className="break-all md:break-normal text-[11px] sm:text-xs">info@suattayfuntopak.com</span>
                  </a>
                </li>
                <li className="text-[10px] text-slate-500 dark:text-zinc-500 italic">
                  {isEn ? 'Typically replies within 24 hours' : 'Genellikle 24 saat içinde yanıtlanır'}
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 font-medium">
            &copy; {new Date().getFullYear()} Network Marketing Master. {t('landingPage.footerRights')}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
              SECURE PLATFORM
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}

