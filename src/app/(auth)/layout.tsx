'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useTranslation } from '@/providers/LanguageProvider'
import { TRFlag, USFlag } from '@/app/(dashboard)/_components/Header'
import { Z } from '@/lib/ui/zIndex'
import { NEXT_THEME, resolveThemeMode, ThemeIcon, type ThemeMode } from '@/lib/ui/themeToggle'
import { authLogoRingClass, authShellClass, authTitleClass, authToolbarBtnClass } from './_components/authUi'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const currentTheme = mounted ? resolveThemeMode(theme) : 'system'

  const nextThemeLabel: Record<ThemeMode, string> = {
    dark: t('common.themeLight'),
    light: t('common.themeSystem'),
    system: t('common.themeDark'),
  }

  return (
    <div className={authShellClass}>

      {/* Top-right: theme (current icon) + single language flag (active locale) */}
      <div className={`fixed top-3 right-3 ${Z.bottomNav} flex items-center gap-1`}>
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(NEXT_THEME[currentTheme])}
            title={nextThemeLabel[currentTheme]}
            aria-label={nextThemeLabel[currentTheme]}
            className={authToolbarBtnClass}
          >
            <ThemeIcon mode={currentTheme} />
          </button>
        )}
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
            <img
              src="/logo.png"
              alt="NMM Logo"
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
