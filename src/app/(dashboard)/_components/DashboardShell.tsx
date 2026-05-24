'use client'

import { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV_ROUTES = ['/pano', '/pipeline', '/yazar', '/ekip']

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    // Only navigate for clearly horizontal swipes (dx > 60px, dx > 2× vertical)
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return
    const idx = NAV_ROUTES.findIndex(r => pathname === r || (r !== '/pano' && pathname.startsWith(r)))
    if (idx === -1) return
    if (dx < 0 && idx < NAV_ROUTES.length - 1) router.push(NAV_ROUTES[idx + 1])
    else if (dx > 0 && idx > 0) router.push(NAV_ROUTES[idx - 1])
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div
        className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <MobileHeader />
        {/* Mobile spacer — clears fixed MobileHeader (~56px tall) */}
        <div className="block md:hidden h-14" />
        {/* Desktop spacer — clears fixed ThemeToggle + UserMenu at top-3 (~48px tall) */}
        <div className="hidden md:block h-14" />
        {children}
      </div>
      <BottomNav />
      {/* Theme toggle + user menu — fixed top-right on all screens */}
      <div className="fixed right-4 top-3 z-50 flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  )
}
