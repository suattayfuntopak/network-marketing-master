'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { NEXT_THEME, resolveThemeMode, ThemeIcon } from '@/lib/ui/themeToggle'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  const current = resolveThemeMode(theme)

  const NEXT_LABEL: Record<string, string> = {
    dark: t('common.themeLight'),
    light: t('common.themeSystem'),
    system: t('common.themeDark'),
  }

  return (
    <button
      onClick={() => setTheme(NEXT_THEME[current])}
      title={NEXT_LABEL[current]}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
    >
      <ThemeIcon mode={current} />
    </button>
  )
}
