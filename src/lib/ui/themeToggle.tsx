'use client'

import { Monitor, Moon, Sun } from 'lucide-react'

export type ThemeMode = 'dark' | 'light' | 'system'

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
