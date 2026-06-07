'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'

type HubPageShellProps = {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconClassName?: string
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  backHref?: string
  /** Sağ üst yenile butonu (varsayılan: true) */
  showRefresh?: boolean
  /** Tab içinde kullanıldığında true — shell başlığı/back butonu gizlenir */
  asTab?: boolean
}

export function HubPageShell({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'bg-[#EEEDFE] text-[#534AB7] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]',
  children,
  onRefresh,
  refreshing,
  backHref = '/pano',
  showRefresh = true,
  asTab = false,
}: HubPageShellProps) {
  const { t } = useTranslation()
  const router = useRouter()

  function handleRefresh() {
    if (onRefresh) onRefresh()
    else router.refresh()
  }

  if (asTab) {
    return (
      <div className="w-full space-y-5">
        {(onRefresh || refreshing !== undefined) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('crown.refresh')}
            </button>
          </div>
        )}
        {children}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-5">
        <header className={clsx('flex justify-between gap-3', subtitle ? 'items-start' : 'items-center')}>
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={backHref}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
              aria-label={t('crown.back')}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            {Icon ? (
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[var(--text-1)]">{title}</h1>
              {subtitle ? (
                <p className="text-sm text-[var(--text-3)]">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {showRefresh ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('crown.refresh')}
            </button>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  )
}
