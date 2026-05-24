'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
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
