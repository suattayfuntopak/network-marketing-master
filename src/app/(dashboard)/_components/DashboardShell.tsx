'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

const NAV_ROUTES = ['/pano', '/pipeline', '/yazar', '/itirazlar', '/ekip']

function getRouteIndex(pathname: string) {
  return NAV_ROUTES.findIndex(r => pathname === r)
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
  const [visible, setVisible] = useState(true)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY

      // Always show at the very top of the page
      if (scrollY < 20) {
        setVisible(true)
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
        }
        return
      }

      // Hide immediately during active scroll events
      setVisible(false)

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      // Re-enable visibility after scroll stops for 400ms
      scrollTimeout.current = setTimeout(() => {
        setVisible(true)
      }, 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    let target = e.target as HTMLElement | null
    while (target) {
      if (target.dataset?.noSwipe === 'true' || target.classList?.contains('no-swipe')) {
        touchStart.current = null
        return
      }
      target = target.parentElement
    }
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
      <Header visible={visible} />
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
        <div className="mx-auto max-w-[1360px] w-full">
          {children}
        </div>
      </div>
      <BottomNav pendingHref={pendingHref} visible={visible} />
    </div>
  )
}
