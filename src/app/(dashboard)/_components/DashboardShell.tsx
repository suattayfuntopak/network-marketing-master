'use client'

import { useState, useRef } from 'react'
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [touchOffset, setTouchOffset] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setPendingHref(null)
    setIsDragging(false)
    setTouchOffset(0)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    
    if (!isDragging) {
      if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setIsDragging(true)
      } else if (Math.abs(dy) > 15) {
        // Cancel swipe if user scroll vertically
        touchStart.current = null
        return
      }
    }

    if (isDragging) {
      // Prevent browser default bounce while swiping
      if (e.cancelable) e.preventDefault()
      
      const idx = getRouteIndex(pathname)
      if (idx === -1) return
      
      const isFirstTab = idx === 0
      const isLastTab = idx === NAV_ROUTES.length - 1
      
      let offset = dx
      if ((isFirstTab && dx > 0) || (isLastTab && dx < 0)) {
        // Apple-style resistance bounce
        offset = dx * 0.3
      }
      
      setTouchOffset(offset)
      
      const target = dx < 0 ? NAV_ROUTES[idx + 1] : NAV_ROUTES[idx - 1]
      setPendingHref(target ?? null)
    }
  }

  function handleTouchCancel() {
    touchStart.current = null
    setPendingHref(null)
    setIsDragging(false)
    setTouchOffset(0)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    touchStart.current = null
    setPendingHref(null)
    setIsDragging(false)

    if (!isDragging) {
      setTouchOffset(0)
      return
    }

    const idx = getRouteIndex(pathname)
    if (idx === -1) {
      setTouchOffset(0)
      return
    }

    const swipeThreshold = 100 //px
    const isFirstTab = idx === 0
    const isLastTab = idx === NAV_ROUTES.length - 1

    if (dx < -swipeThreshold && !isLastTab) {
      // Swipe left successful -> Move forward
      setTouchOffset(-window.innerWidth)
      setTimeout(() => {
        setNavDir('forward')
        router.push(NAV_ROUTES[idx + 1])
        setTouchOffset(0)
      }, 200)
    } else if (dx > swipeThreshold && !isFirstTab) {
      // Swipe right successful -> Move back
      setTouchOffset(window.innerWidth)
      setTimeout(() => {
        setNavDir('back')
        router.push(NAV_ROUTES[idx - 1])
        setTouchOffset(0)
      }, 200)
    } else {
      // Swipe cancelled, snap back to center
      setTouchOffset(0)
    }
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Header />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div
        className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 [view-transition-name:main-content] ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          transform: touchOffset ? `translateX(${touchOffset}px)` : 'translateX(0px)',
          transition: isDragging ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Spacer to clear the fixed h-16 Header */}
        <div className="h-16" />
        {children}
      </div>
      <BottomNav pendingHref={pendingHref} />
    </div>
  )
}

