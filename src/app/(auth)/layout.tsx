'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/providers/LanguageProvider'
import { TRFlag, USFlag } from '@/app/(dashboard)/_components/Header'
import { ThemeCycleButton } from '@/components/ui/ThemeCycleButton'
import { Z } from '@/lib/ui/zIndex'
import { authLogoRingClass, authShellClass, authTitleClass, authToolbarBtnClass } from './_components/authUi'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useTranslation()

  return (
    <div className={authShellClass}>

      {/* Top-right: theme (current icon) + single language flag (active locale) */}
      <div className={`fixed top-3 right-3 ${Z.bottomNav} flex items-center gap-1`}>
        <ThemeCycleButton buttonClassName={authToolbarBtnClass} />
        {lang === 'tr' ? (
          <button
            type="button"
            onClick={() => setLang('en')}
            title="Switch to English"
            aria-label="Switch to English"
            className={authToolbarBtnClass}
          >
            <TRFlag />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLang('tr')}
            title="Türkçe'ye geç"
            aria-label="Türkçe'ye geç"
            className={authToolbarBtnClass}
          >
            <USFlag />
          </button>
        )}
      </div>

      <div className="w-full max-w-sm">
        {/* Logo — tıklanınca landing page'e dön */}
        <Link
          href="/"
          className="mb-8 block text-center animate-in fade-in slide-in-from-top-4 duration-300 group outline-none"
        >
          <div className={authLogoRingClass}>
            <Image
              src="/logo.png"
              alt="NMM Logo"
              width={80}
              height={80}
              className="h-full w-full rounded-full object-cover shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            />
          </div>
          <h1 className={authTitleClass}>
            Network Marketing Master
          </h1>
        </Link>

        {children}
      </div>
    </div>
  )
}
