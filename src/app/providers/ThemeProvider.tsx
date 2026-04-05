import { useEffect, type ReactNode } from 'react'
import type { Theme } from '@/types'

interface ThemeProviderProps {
  children: ReactNode
}

// Apply theme before first render to avoid flash
function applyTheme() {
  const stored = localStorage.getItem('nmm-theme') as Theme | null
  const theme = stored ?? 'system'
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

// Run immediately (outside component lifecycle)
applyTheme()

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const theme = localStorage.getItem('nmm-theme') as Theme | null
      if (!theme || theme === 'system') {
        applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return <>{children}</>
}
