'use client'

import { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV_ROUTES = ['/pano', '/pipeline', '/yazar', '/itirazlar', '/ekip']

function getRouteIndex(pathname: string) {
  return NAV_ROUTES.findIndex(r => pathname === r || (r !== '/pano' && pathname.startsWith(r)))
}

export function setNavDir(dir: 'forward' | 'back') {
  document.documentElement.dataset.navDir = dir
  setTimeout(() => { delete document.documentElement.dataset.navDir }, 500)
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setPendingHref(null)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy) * 1.5) {
      setPendingHref(null)
      return
    }
    const idx = getRouteIndex(pathname)
    if (idx === -1) { setPendingHref(null); return }
    const target = dx < 0 ? NAV_ROUTES[idx + 1] : NAV_ROUTES[idx - 1]
    setPendingHref(target ?? null)
  }

  function handleTouchCancel() {
    touchStart.current = null
    setPendingHref(null)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    setPendingHref(null)
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return
    const idx = getRouteIndex(pathname)
    if (idx === -1) return
    if (dx < 0 && idx < NAV_ROUTES.length - 1) {
      setNavDir('forward')
      router.push(NAV_ROUTES[idx + 1])
    } else if (dx > 0 && idx > 0) {
      setNavDir('back')
      router.push(NAV_ROUTES[idx - 1])
    }
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div
        className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 [view-transition-name:main-content] ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <MobileHeader />
        {/* Mobile spacer — clears fixed MobileHeader (~56px tall) */}
        <div className="block md:hidden h-14" />
        {/* Desktop spacer — clears fixed ThemeToggle + UserMenu at top-3 (~48px tall) */}
        <div className="hidden md:block h-14" />
        {children}
      </div>
      <BottomNav pendingHref={pendingHref} />
      {/* Theme toggle + user menu — fixed top-right on all screens */}
      <div className="fixed right-4 top-3 z-50 flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  )
}
