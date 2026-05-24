'use client'

import Link from 'next/link'

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 pr-[90px] md:hidden">
      <Link href="/pano" className="flex items-center gap-3 transition hover:opacity-85">
        {/* Logo */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#534AB7]">
          <span className="text-[9px] font-black tracking-tight text-white">NMM</span>
        </div>
        <span className="truncate text-[10px] font-black uppercase tracking-widest text-[var(--text-1)]">
          Network Marketing Master
        </span>
      </Link>
    </header>
  )
}
