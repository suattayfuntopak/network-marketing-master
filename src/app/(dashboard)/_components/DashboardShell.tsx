'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'
import { UserMenu } from './UserMenu'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className={`flex-1 transition-[margin] duration-300 ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
        <MobileHeader />
        {children}
      </div>
      <BottomNav />
      {/* Desktop user menu — fixed top-right */}
      <div className="fixed right-4 top-3 z-50 hidden md:block">
        <UserMenu />
      </div>
    </div>
  )
}
