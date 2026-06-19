'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  NAV_SIDEBAR_MODULES,
  NAV_ADMIN,
  getPanoLauncherColor,
  type NavItem,
} from '@/lib/domain/navigation'
import { crownSolidMap } from '@/components/ui/SquareButton'
import { EKIP_MODULE_ACCENT_CLASS } from '@/lib/ui/brandGradients'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'
import { NavItemIcon } from '@/components/ui/NavItemIcon'
import { Z } from '@/lib/ui/zIndex'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false

  const sidebarItems: NavItem[] = [
    ...NAV_SIDEBAR_MODULES,
    ...(isSuperAdmin ? [NAV_ADMIN] : []),
  ]

  function renderLink(item: NavItem) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const ekipActive = item.href === '/ekip' && isActive
    const panoColor = isActive && !ekipActive ? getPanoLauncherColor(item.href) : undefined

    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? t(item.translationKey) : undefined}
        onMouseEnter={() => prefetchRouteData(queryClient, item.href, ws?.workspaceId, ws)}
        className={clsx(
          'flex items-center rounded-xl text-sm font-medium transition-colors',
          collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2.5',
          ekipActive
            ? clsx(EKIP_MODULE_ACCENT_CLASS, 'hover:brightness-105')
            : panoColor
            ? clsx(crownSolidMap[panoColor], 'text-white shadow-sm hover:brightness-105')
            : isActive
              ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
        )}
      >
        <NavItemIcon item={item} className={ekipActive || panoColor ? 'h-5 w-5 text-white' : 'h-5 w-5'} />
        {!collapsed && (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">{t(item.translationKey)}</span>
            {item.href === NAV_ADMIN.href && (
              <Crown
                className={clsx('h-3.5 w-3.5 shrink-0', panoColor ? 'text-white/90' : 'text-amber-500')}
                strokeWidth={1.75}
                aria-hidden
              />
            )}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 hidden h-[calc(100vh-4rem)] flex-col border-r border-[var(--border)] bg-[var(--bg-card)] md:flex',
        `transition-all duration-300 ${Z.sidebar}`,
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="h-4" />

      <nav className={clsx('flex-1 space-y-1 overflow-y-auto py-1', collapsed ? 'px-2' : 'px-3')}>
        {sidebarItems.map(renderLink)}
      </nav>

      <div className={clsx('border-t border-[var(--border)] p-2')}>
        <button
          onClick={onToggle}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className={clsx(
            'flex items-center rounded-xl text-xs font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
            collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} /> {t('nav.collapse')}
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
