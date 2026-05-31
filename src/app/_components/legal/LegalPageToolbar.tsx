'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { TRFlag, USFlag } from '@/app/(dashboard)/_components/Header'
import { NEXT_THEME, NEXT_THEME_LABEL } from '@/app/_components/landing/constants'

const THEME_ICON: Record<string, ReactNode> = {
  dark: <Sun className="h-3.5 w-3.5" strokeWidth={1.75} />,
  light: <Monitor className="h-3.5 w-3.5" strokeWidth={1.75} />,
  system: <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />,
}

export function LegalPageToolbar() {
  const { lang, setLang } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)

  useEffect(() => setThemeMounted(true), [])

  const currentTheme = themeMounted && theme && theme in NEXT_THEME ? theme : 'system'

  return (
    <div className="flex shrink-0 items-center gap-1">
      {themeMounted && (
        <button
          type="button"
          onClick={() => setTheme(NEXT_THEME[currentTheme])}
          title={NEXT_THEME_LABEL[currentTheme]}
          aria-label={NEXT_THEME_LABEL[currentTheme]}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white sm:h-9 sm:w-9 sm:rounded-xl"
        >
          {THEME_ICON[currentTheme]}
        </button>
      )}

      {lang === 'tr' ? (
        <button
          type="button"
          onClick={() => setLang('en')}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/10 sm:h-9 sm:w-9 sm:rounded-xl"
          title="Switch to English"
          aria-label="Switch to English"
        >
          <TRFlag />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setLang('tr')}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/10 sm:h-9 sm:w-9 sm:rounded-xl"
          title="Türkçe'ye geç"
          aria-label="Türkçe'ye geç"
        >
          <USFlag />
        </button>
      )}
    </div>
  )
}
