'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

const CYCLE = ['light', 'dark', 'system'] as const
type Theme = typeof CYCLE[number]

const ICONS: Record<Theme, React.ReactNode> = {
  light:  <Sun    className="h-4 w-4" strokeWidth={1.75} />,
  dark:   <Moon   className="h-4 w-4" strokeWidth={1.75} />,
  system: <Monitor className="h-4 w-4" strokeWidth={1.75} />,
}

const LABELS: Record<Theme, string> = {
  light:  'Açık tema',
  dark:   'Koyu tema',
  system: 'Sistem teması',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  const current = (CYCLE.includes(theme as Theme) ? theme : 'system') as Theme

  function cycle() {
    const idx = CYCLE.indexOf(current)
    setTheme(CYCLE[(idx + 1) % CYCLE.length])
  }

  return (
    <button
      onClick={cycle}
      title={LABELS[current]}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
    >
      {ICONS[current]}
    </button>
  )
}
