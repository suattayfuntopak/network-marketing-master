'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

// Mevcut tema → basınca geçilecek tema
const NEXT: Record<string, string> = {
  dark:   'light',
  light:  'system',
  system: 'dark',
}

// Mevcut tema → gösterilecek ikon (ne olacağını göster)
const NEXT_ICON: Record<string, React.ReactNode> = {
  dark:   <Sun     className="h-4 w-4" strokeWidth={1.75} />,   // dark'tayken güneş görün
  light:  <Monitor className="h-4 w-4" strokeWidth={1.75} />,   // light'tayken monitör görün
  system: <Moon    className="h-4 w-4" strokeWidth={1.75} />,   // system'dayken ay görün
}

const NEXT_LABEL: Record<string, string> = {
  dark:   'Light moduna geç',
  light:  'System moduna geç',
  system: 'Dark moduna geç',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  const current = theme && theme in NEXT ? theme : 'system'

  return (
    <button
      onClick={() => setTheme(NEXT[current])}
      title={NEXT_LABEL[current]}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
    >
      {NEXT_ICON[current]}
    </button>
  )
}
