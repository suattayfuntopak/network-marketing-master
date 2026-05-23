'use client'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 md:hidden">
      <span className="text-xs font-bold text-[var(--text-1)]">
        Network Marketing Master
      </span>
      <ThemeToggle />
    </header>
  )
}
