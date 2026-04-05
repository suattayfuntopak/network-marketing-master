import { useEffect, useState } from 'react'
import type { Theme } from '@/types'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('nmm-theme') as Theme | null
    // Only accept 'light' | 'dark'; default to 'dark'
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('nmm-theme', newTheme)
    setThemeState(newTheme)
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggleTheme }
}
