'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { NAV_MORE_ITEMS, NAV_ADMIN, type NavItem } from '@/lib/domain/navigation'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface NavMoreSheetProps {
  open: boolean
  onClose: () => void
}

export function NavMoreSheet({ open, onClose }: NavMoreSheetProps) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false
  useBodyScrollLock(open)

  if (!open) return null

  function renderLink({ href, translationKey, icon: Icon }: NavItem) {
    const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
    const label = t(translationKey.replace('nav.', 'navMobile.'))
    const isCrown = href === '/platform-yonetim'
    return (
      <Link
        key={href}
        href={href}
        prefetch
        onClick={onClose}
        onMouseEnter={() => prefetchRouteData(queryClient, href, ws?.workspaceId, ws)}
        className={clsx(
          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
          isCrown
            ? active
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'text-amber-600/90 dark:text-amber-400/90 hover:bg-amber-500/10'
            : active
              ? 'bg-brand-subtle text-brand dark:bg-[#2d2a5e] dark:text-[#a09be8]'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate">{label}</span>
        </span>
      </Link>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/35 backdrop-blur-sm`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`fixed inset-x-0 bottom-0 ${Z.sheet} mx-auto max-h-[min(72dvh,520px)] w-full max-w-lg overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl pb-safe`}
        role="dialog"
        aria-labelledby="nav-more-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 id="nav-more-title" className="text-sm font-bold text-[var(--text-1)]">
            {t('nav.more')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)]"
            aria-label={t('shellUi.accountAlertClose')}
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        <nav className="space-y-0.5 overflow-y-auto p-2 pb-4">
          {NAV_MORE_ITEMS.map(renderLink)}
          {isSuperAdmin && (
            <>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">
                {t('nav.groupAdmin')}
              </p>
              {renderLink(NAV_ADMIN)}
            </>
          )}
        </nav>
      </div>
    </>
  )
}
