'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'

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
    </div>
  )
}
