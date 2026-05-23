'use client'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function MobileHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 md:hidden">
      {/* Logo */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#534AB7]">
        <span className="text-[9px] font-black tracking-tight text-white">NMM</span>
      </div>
      <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-1)]">
        Network Marketing Master
      </span>
      <ThemeToggle />
    </header>
  )
}
