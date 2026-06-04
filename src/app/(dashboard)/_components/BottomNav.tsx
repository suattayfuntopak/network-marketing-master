'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { setNavDir } from './DashboardShell'
import { useWorkspace } from '@/hooks/useWorkspace'
import { NAV_ADMIN, NAV_SIDEBAR_MODULES } from '@/lib/domain/navigation'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
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
  const teamLocked = !hasTeamPageAccess(ws?.licenseType, isSuperAdmin)

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
    prefetchRouteData(queryClient, targetHref, ws?.workspaceId)
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
      {items.map(({ href, translationKey, icon: Icon }) => {
        const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
        const pending = pendingHref === href
        const isCrown = href === '/platform-yonetim'
        const isTeamLocked = href === '/ekip' && teamLocked
        const label = t(translationKey.replace('nav.', 'navMobile.'))

        return (
          <button
            key={href}
            ref={active ? activeRef : undefined}
            onClick={() => navigate(isTeamLocked ? '/odeme' : href)}
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
              <Icon
                className={clsx('h-5 w-5', active && 'drop-shadow-sm', isCrown && !active && 'animate-pulse')}
                strokeWidth={active || pending || isCrown ? 2.25 : 1.75}
              />
              {isTeamLocked && (
                <Lock
                  className="absolute -right-1 -top-0.5 h-2.5 w-2.5 text-[var(--text-3)]"
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
            </span>
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
