'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

const NAV_ROUTES = ['/pano', '/pipeline', '/yazar', '/itirazlar', '/ekip']

function getRouteIndex(pathname: string) {
  return NAV_ROUTES.findIndex(r => pathname === r || (r !== '/pano' && pathname.startsWith(r)))
}

export function setNavDir(dir: 'forward' | 'back') {
  document.documentElement.dataset.navDir = dir
  setTimeout(() => { delete document.documentElement.dataset.navDir }, 500)
}

const SIDEBAR_KEY = 'nmm_sidebar_collapsed'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_KEY) === 'true'
    }
    return false
  })
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

  function handleTouchCancel() {
    touchStart.current = null
    setPendingHref(null)
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Header />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => {
          const next = !v
          localStorage.setItem(SIDEBAR_KEY, String(next))
          return next
        })}
      />
      <div
        className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 [view-transition-name:main-content] ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Spacer to clear the fixed h-16 Header */}
        <div className="h-16" />
        {children}
      </div>
      <BottomNav pendingHref={pendingHref} />
    </div>
  )
}
