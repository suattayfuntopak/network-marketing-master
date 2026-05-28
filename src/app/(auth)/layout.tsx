'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { TRFlag, USFlag } from '@/app/(dashboard)/_components/Header'
import { Z } from '@/lib/ui/zIndex'

const NEXT_THEME: Record<string, string> = { dark: 'light', light: 'system', system: 'dark' }
const THEME_ICON: Record<string, React.ReactNode> = {
  dark:   <Sun     className="h-4 w-4" strokeWidth={1.75} />,
  light:  <Monitor className="h-4 w-4" strokeWidth={1.75} />,
  system: <Moon    className="h-4 w-4" strokeWidth={1.75} />,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const currentTheme = mounted && theme && theme in NEXT_THEME ? theme : 'system'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0b10] bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-[#1a1c2e] via-[#0a0b10] to-[#050508] px-4 text-white">

      {/* Top-right controls: theme + language flags */}
      <div className={`fixed top-3 right-3 ${Z.bottomNav} flex items-center gap-1`}>
        {mounted && (
          <button
            onClick={() => setTheme(NEXT_THEME[currentTheme])}
            title="Change theme"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            {THEME_ICON[currentTheme]}
          </button>
        )}
        <button
          onClick={() => setLang('tr')}
          title="Türkçe"
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-white/10 ${
            lang === 'tr' ? 'bg-white/10 ring-1 ring-indigo-500/40' : 'opacity-40 hover:opacity-100'
          }`}
        >
          <TRFlag />
        </button>
        <button
          onClick={() => setLang('en')}
          title="English"
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-white/10 ${
            lang === 'en' ? 'bg-white/10 ring-1 ring-indigo-500/40' : 'opacity-40 hover:opacity-100'
          }`}
        >
          <USFlag />
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo — tıklanınca landing page'e dön */}
        <Link
          href="/"
          className="mb-8 block text-center animate-in fade-in slide-in-from-top-4 duration-300 group outline-none"
        >
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900/50 p-1 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all group-hover:border-cyan-400/50 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.35)] group-hover:scale-105">
            <img
              src="/logo.png"
              alt="NMM Logo"
              className="h-full w-full rounded-full object-cover shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
            Network Marketing Master
          </h1>
        </Link>

        {children}
      </div>
    </div>
  )
}
