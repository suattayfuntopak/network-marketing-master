'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Crown } from 'lucide-react'
import { clsx } from 'clsx'
import { setNavDir } from './DashboardShell'
import { useWorkspace } from '@/hooks/useWorkspace'
import { NAV_ITEMS } from '@/lib/domain/navigation'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'
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
  const items = useMemo(() => {
    return isSuperAdmin
      ? [...NAV_ITEMS, { href: '/platform-yonetim', translationKey: 'nav.platformYonetim', icon: Crown }]
      : NAV_ITEMS
  }, [isSuperAdmin])

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
    prefetchRouteData(queryClient, targetHref, ws?.workspaceId)
    const currentIdx = items.findIndex(({ href }) => pathname === href || (href !== '/pano' && pathname.startsWith(href)))
    const targetIdx = items.findIndex(({ href }) => href === targetHref)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx !== targetIdx) {
      setNavDir(targetIdx > currentIdx ? 'forward' : 'back')
    }
    router.prefetch(targetHref)
    router.push(targetHref)
  }

  return (
    <nav className={clsx(
      `fixed bottom-0 left-0 right-0 ${Z.bottomNav} flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden transition-transform duration-300 ease-in-out transform overflow-x-auto scrollbar-none`,
      visible ? 'translate-y-0' : 'translate-y-full'
    )}>
      {items.map(({ href, translationKey, icon: Icon }) => {
        const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
        const pending = pendingHref === href
        const isCrown = href === '/platform-yonetim'

        const label = t(translationKey.replace('nav.', 'navMobile.'))

        return (
          <button
            key={href}
            ref={active ? activeRef : undefined}
            onClick={() => navigate(href)}
            className={clsx(
              'flex flex-col items-center gap-1 py-3 text-[10px] font-bold transition-all duration-150 shrink-0 px-2 min-w-[76px] sm:min-w-[84px] text-center cursor-pointer',
              active
                ? isCrown
                  ? 'text-amber-500'
                  : 'text-[#534AB7] dark:text-[#FACC15]'
                : isCrown
                  ? 'text-amber-600/80 hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300 font-medium'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400',
              pending && (
                isCrown
                  ? 'scale-110 text-amber-500 dark:text-amber-400'
                  : 'scale-110 text-[#534AB7] dark:text-[#FACC15]'
              )
            )}
          >
            <Icon
              className={clsx(
                'h-5 w-5',
                active && 'drop-shadow-sm',
                isCrown && !active && 'animate-pulse'
              )}
              strokeWidth={active || pending || isCrown ? 2.25 : 1.75}
            />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
