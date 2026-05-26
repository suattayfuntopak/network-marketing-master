'use client'

import { useTranslation } from '@/providers/LanguageProvider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0b10] bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-[#1a1c2e] via-[#0a0b10] to-[#050508] px-4 text-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900/50 p-1 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <img
              src="/logo.png"
              alt="NMM Neon Logo"
              className="h-full w-full rounded-full object-cover shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
            Network Marketing Master
          </h1>
        </div>

        {children}
      </div>
    </div>
  )
}


