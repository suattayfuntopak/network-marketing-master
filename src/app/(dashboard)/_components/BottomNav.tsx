'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { setNavDir } from './DashboardShell'
import { useWorkspace } from '@/hooks/useWorkspace'
import { NAV_MOBILE_BAR, NAV_MORE_ICON, isNavMoreRouteActive } from '@/lib/domain/navigation'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'
import { Z } from '@/lib/ui/zIndex'
import { NavMoreSheet } from './NavMoreSheet'

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
  const teamLocked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin ?? false)
  const [moreOpen, setMoreOpen] = useState(false)

  const barItems = NAV_MOBILE_BAR
  const moreActive = isNavMoreRouteActive(pathname)

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
    const routes = [...barItems.map(i => i.href), '/more']
    const currentIdx = routes.findIndex(
      href =>
        href === '/more'
          ? moreActive
          : pathname === href || (href !== '/pano' && pathname.startsWith(href)),
    )
    const targetIdx = routes.findIndex(href => href === targetHref)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx !== targetIdx) {
      setNavDir(targetIdx > currentIdx ? 'forward' : 'back')
    }
    router.prefetch(targetHref)
    router.push(targetHref)
  }

  return (
    <>
      <nav
        className={clsx(
          `fixed bottom-0 left-0 right-0 ${Z.bottomNav} flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden transition-transform duration-300 ease-in-out`,
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {barItems.map(({ href, translationKey, icon: Icon }) => {
          const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
          const pending = pendingHref === href
          const label = t(translationKey.replace('nav.', 'navMobile.'))
          const isTeamLocked = href === '/ekip' && teamLocked

          return (
            <button
              key={href}
              ref={active ? activeRef : undefined}
              onClick={() => navigate(isTeamLocked ? '/odeme' : href)}
              className={clsx(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold transition-all duration-150 min-w-0 px-1 text-center cursor-pointer',
                active
                  ? 'text-[#534AB7] dark:text-[#FACC15]'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400',
                pending && 'scale-110 text-[#534AB7] dark:text-[#FACC15]',
              )}
            >
              <span className="relative">
                <Icon
                  className={clsx('h-5 w-5', active && 'drop-shadow-sm')}
                  strokeWidth={active || pending ? 2.25 : 1.75}
                />
                {isTeamLocked && (
                  <Lock
                    className="absolute -right-1 -top-0.5 h-2.5 w-2.5 text-[var(--text-3)]"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                )}
              </span>
              <span className="max-w-full truncate leading-tight">{label}</span>
            </button>
          )
        })}

        <button
          type="button"
          ref={moreActive ? activeRef : undefined}
          onClick={() => setMoreOpen(true)}
          className={clsx(
            'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold transition-all duration-150 min-w-0 px-1 text-center cursor-pointer',
            moreActive
              ? 'text-[#534AB7] dark:text-[#FACC15]'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400',
          )}
          aria-expanded={moreOpen}
        >
          <NAV_MORE_ICON className="h-5 w-5" strokeWidth={moreActive ? 2.25 : 1.75} />
          <span className="max-w-full truncate leading-tight">{t('nav.more')}</span>
        </button>
      </nav>

      <NavMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
