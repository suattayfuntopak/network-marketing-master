'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useEffect, useRef, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Ellipsis } from 'lucide-react'
import { setNavDir } from './DashboardShell'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  NAV_ADMIN,
  NAV_SIDEBAR_MODULES,
  NAV_MOBILE_PRIMARY_HREFS,
  navBarLabelKey,
  type NavItem,
} from '@/lib/domain/navigation'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'
import { NavItemIcon } from '@/components/ui/NavItemIcon'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Z } from '@/lib/ui/zIndex'

interface BottomNavProps {
  pendingHref?: string | null
  visible?: boolean
}

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/pano' && pathname.startsWith(href))
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
  // Birincil 5 (sıralı) + gerisi "Diğer" çekmecesinde.
  const primaryItems = useMemo(
    () =>
      NAV_MOBILE_PRIMARY_HREFS.map(h => items.find(i => i.href === h)).filter(
        (i): i is NavItem => !!i,
      ),
    [items],
  )
  const secondaryItems = useMemo(
    () => items.filter(i => !NAV_MOBILE_PRIMARY_HREFS.includes(i.href)),
    [items],
  )

  const [moreOpen, setMoreOpen] = useState(false)
  useBodyScrollLock(moreOpen)
  // Rota değişince çekmeceyi kapat (geri/ileri gibi handler-dışı geçişler için güvenlik ağı).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoreOpen(false)
  }, [pathname])

  const moreActive = secondaryItems.some(i => isRouteActive(pathname, i.href))

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [pathname])

  function navigate(targetHref: string) {
    prefetchRouteData(queryClient, targetHref, ws?.workspaceId, ws)
    const currentIdx = items.findIndex(({ href }) => isRouteActive(pathname, href))
    const targetIdx = items.findIndex(({ href }) => href === targetHref)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx !== targetIdx) {
      setNavDir(targetIdx > currentIdx ? 'forward' : 'back')
    }
    router.prefetch(targetHref)
    router.push(targetHref)
  }

  /** Alt bar için kısa etiket (uzun "Saha Radarım" → "Radar"). */
  function barLabel(item: NavItem): string {
    if (item.href === '/saha-radar') return t('navMobile.sahaRadar')
    return t(navBarLabelKey(item.translationKey))
  }

  function renderNavButton(item: NavItem) {
    const { href } = item
    const active = isRouteActive(pathname, href)
    const pending = pendingHref === href
    const isCrown = href === '/platform-yonetim'

    return (
      <button
        key={href}
        ref={active ? activeRef : undefined}
        onClick={() => navigate(href)}
        onPointerEnter={() => prefetchRouteData(queryClient, href, ws?.workspaceId, ws)}
        className={clsx(
          'flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 px-1 py-3 text-center text-[10px] font-bold transition-all duration-150',
          active
            ? isCrown ? 'text-amber-500' : 'text-brand dark:text-[#FACC15]'
            : isCrown
              ? 'font-medium text-amber-600/80 hover:text-amber-700 dark:text-amber-400/80'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500',
          pending && (isCrown ? 'scale-110 text-amber-500' : 'scale-110 text-brand dark:text-[#FACC15]'),
        )}
      >
        <span className="relative">
          <NavItemIcon
            item={item}
            className={clsx('h-5 w-5', active && 'drop-shadow-sm', isCrown && !active && 'animate-pulse')}
            strokeWidth={active || pending || isCrown ? 2.25 : 1.75}
          />
        </span>
        <span className="max-w-full truncate">{barLabel(item)}</span>
      </button>
    )
  }

  return (
    <>
      <nav
        className={clsx(
          `fixed bottom-0 left-0 right-0 ${Z.bottomNav} flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden transition-transform duration-300 ease-in-out transform`,
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {primaryItems.map(renderNavButton)}

        {/* Diğer — kalan modüller alttan açılan çekmecede */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={clsx(
            'flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 px-1 py-3 text-center text-[10px] font-bold transition-all duration-150',
            moreActive ? 'text-brand dark:text-[#FACC15]' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500',
          )}
        >
          <Ellipsis className="h-5 w-5" strokeWidth={moreActive ? 2.25 : 1.75} />
          <span className="max-w-full truncate">{t('navMobile.more')}</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div
            className={clsx('fixed inset-0 md:hidden bg-black/40', Z.sheetBackdrop)}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className={clsx(
              'fixed inset-x-0 bottom-0 md:hidden rounded-t-3xl border-t border-[var(--border)] bg-[var(--bg-card)] p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200',
              Z.sheet,
            )}
            role="dialog"
            aria-label={t('navMobile.more')}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border)]" />
            <div className="grid grid-cols-4 gap-2">
              {secondaryItems.map(item => {
                const active = isRouteActive(pathname, item.href)
                const isCrown = item.href === '/platform-yonetim'
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => { setMoreOpen(false); navigate(item.href) }}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 active:scale-95 transition"
                  >
                    <span
                      className={clsx(
                        'flex h-12 w-12 items-center justify-center rounded-2xl transition',
                        active
                          ? 'bg-brand/15 text-brand dark:text-[#FACC15]'
                          : isCrown
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-2)]',
                      )}
                    >
                      <NavItemIcon item={item} className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                    </span>
                    <span className="max-w-full truncate text-center text-[10px] font-semibold leading-tight text-[var(--text-2)]">
                      {barLabel(item)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
