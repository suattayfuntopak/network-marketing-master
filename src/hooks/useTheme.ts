import { useEffect, useState } from 'react'
import type { Theme } from '@/types'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('nmm-theme') as Theme | null
    return stored ?? 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    root.classList.toggle('dark', isDark)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('nmm-theme', newTheme)
    setThemeState(newTheme)
  }

  return { theme, setTheme }
}
