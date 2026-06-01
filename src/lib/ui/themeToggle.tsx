'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

export type ThemeMode = 'dark' | 'light' | 'system'

/** Apply `dark` class immediately — before next-themes / React re-render (removes perceived lag). */
export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

export function useThemeCycle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pendingMode, setPendingMode] = useState<ThemeMode | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setPendingMode(null)
  }, [theme])

  const displayMode = pendingMode ?? resolveThemeMode(theme)

  const cycle = useCallback(() => {
    const current = pendingMode ?? resolveThemeMode(theme)
    const next = NEXT_THEME[current]
    applyThemeToDocument(next)
    setPendingMode(next)
    setTheme(next)
  }, [theme, pendingMode, setTheme])

  return { mounted, displayMode, cycle }
}

export const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  dark: 'light',
  light: 'system',
  system: 'dark',
}

export function resolveThemeMode(theme: string | undefined): ThemeMode {
  if (theme === 'dark' || theme === 'light' || theme === 'system') return theme
  return 'system'
}

type ThemeIconProps = {
  mode: ThemeMode
  className?: string
}

/** Aktif tema modunun ikonu: light → güneş, dark → ay, system → monitör */
export function ThemeIcon({ mode, className = 'h-4 w-4' }: ThemeIconProps) {
  const props = { className, strokeWidth: 1.75 as const }
  switch (mode) {
    case 'dark':
      return <Moon {...props} />
    case 'light':
      return <Sun {...props} />
    case 'system':
      return <Monitor {...props} />
  }
}
