'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { setNavDir } from './DashboardShell'
import { useWorkspace } from '@/hooks/useWorkspace'
import { NAV_ADMIN, NAV_SIDEBAR_MODULES, navBarLabelKey } from '@/lib/domain/navigation'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'
import { NavItemIcon } from '@/components/ui/NavItemIcon'
import { Z } from '@/lib/ui/zIndex'

interface BottomNavProps {
  pendingHref?: string | null
  visible?: boolean
}

export function BottomNav({ pendingHref, visible = true }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const activeRef = useRef<HTMLButtonElement | null>(null)
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false

  const items = useMemo(
    () => (isSuperAdmin ? [...NAV_SIDEBAR_MODULES, NAV_ADMIN] : NAV_SIDEBAR_MODULES),
    [isSuperAdmin],
  )

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [pathname])

  function navigate(targetHref: string) {
    prefetchRouteData(queryClient, targetHref, ws?.workspaceId, ws)
    const currentIdx = items.findIndex(
      ({ href }) => pathname === href || (href !== '/pano' && pathname.startsWith(href)),
    )
    const targetIdx = items.findIndex(({ href }) => href === targetHref)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx !== targetIdx) {
      setNavDir(targetIdx > currentIdx ? 'forward' : 'back')
    }
    router.prefetch(targetHref)
    router.push(targetHref)
  }

  return (
    <nav
      className={clsx(
        `fixed bottom-0 left-0 right-0 ${Z.bottomNav} flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden transition-transform duration-300 ease-in-out transform overflow-x-auto scrollbar-none`,
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      {items.map(item => {
        const { href, translationKey } = item
        const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
        const pending = pendingHref === href
        const isCrown = href === '/platform-yonetim'
        const label = t(navBarLabelKey(translationKey))

        return (
          <button
            key={href}
            ref={active ? activeRef : undefined}
            onClick={() => navigate(href)}
            onPointerEnter={() => prefetchRouteData(queryClient, href, ws?.workspaceId, ws)}
            className={clsx(
              'flex shrink-0 cursor-pointer flex-col items-center gap-1 px-2 py-3 text-center text-[10px] font-bold transition-all duration-150 min-w-[76px] sm:min-w-[84px]',
              active
                ? isCrown
                  ? 'text-amber-500'
                  : 'text-[#534AB7] dark:text-[#FACC15]'
                : isCrown
                  ? 'font-medium text-amber-600/80 hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400',
              pending &&
                (isCrown
                  ? 'scale-110 text-amber-500 dark:text-amber-400'
                  : 'scale-110 text-[#534AB7] dark:text-[#FACC15]'),
            )}
          >
            <span className="relative">
              <NavItemIcon
                item={item}
                className={clsx('h-5 w-5', active && 'drop-shadow-sm', isCrown && !active && 'animate-pulse')}
                strokeWidth={active || pending || isCrown ? 2.25 : 1.75}
              />
            </span>
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
