'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'

type CrownPageShellProps = {
  title: string
  emoji?: string
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}

export function CrownPageShell({ title, emoji, children, onRefresh, refreshing }: CrownPageShellProps) {
  const { t } = useTranslation()
  const router = useRouter()

  function handleRefresh() {
    if (onRefresh) onRefresh()
    else router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#eef1f6]">
      <header className="bg-[#1a365d] px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href="/bugun/ilgilen"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-white/90 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            {t('crown.back')}
          </Link>
          <h1 className="flex min-w-0 items-center justify-center gap-2 truncate text-center text-base font-semibold">
            {emoji ? <span className="shrink-0">{emoji}</span> : null}
            <span className="truncate">{title}</span>
          </h1>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 text-sm font-medium text-sky-300 transition hover:text-sky-100 disabled:opacity-60"
          >
            {refreshing ? '…' : t('crown.refresh')}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5 pb-28 md:pb-10">{children}</main>
    </div>
  )
}
