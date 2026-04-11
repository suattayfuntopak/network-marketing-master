import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GitMerge, MessageSquare, Calendar,
  GraduationCap, Users2, BarChart2, Settings, ChevronLeft, ChevronRight,
  Zap, Package2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useTranslation } from 'react-i18next'

const navConfig = [
  { key: 'dashboard', href: ROUTES.DASHBOARD, Icon: LayoutDashboard },
  { key: 'contacts', href: ROUTES.CONTACTS, Icon: Users },
  { key: 'pipeline', href: ROUTES.PIPELINE, Icon: GitMerge },
  { key: 'calendar', href: ROUTES.CALENDAR, Icon: Calendar },
  { key: 'messages', href: ROUTES.MESSAGES, Icon: MessageSquare },
  { key: 'academy', href: ROUTES.ACADEMY, Icon: GraduationCap },
  { key: 'team', href: ROUTES.TEAM, Icon: Users2 },
  { key: 'productCustomers', href: ROUTES.PRODUCT_CUSTOMERS, Icon: Package2 },
  { key: 'analytics', href: ROUTES.ANALYTICS, Icon: BarChart2 },
  { key: 'settings', href: ROUTES.SETTINGS, Icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-sidebar-border/80 bg-sidebar/85 text-sidebar-foreground shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center h-16 border-b border-sidebar-border shrink-0 px-3 gap-2">
        {collapsed ? (
          /* Collapsed: only the toggle button, centered */
          <button
            onClick={() => setCollapsed(false)}
            title={t('nav.expand')}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-sidebar-border/80 bg-sidebar-accent/50 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          /* Expanded: logo left, toggle right, no overlap */
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_rgba(45,212,191,0.28)]">
              <Zap className="w-4 h-4" />
            </div>
            <span className="min-w-0 flex-1 text-xs font-bold leading-tight tracking-[0.02em]">
              Network Marketing Master
            </span>
            <button
              onClick={() => setCollapsed(true)}
              title={t('nav.collapse')}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sidebar-border/80 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navConfig.map(({ key, href, Icon }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all',
                    'hover:border-sidebar-border/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'border-primary/25 bg-sidebar-primary/95 text-sidebar-primary-foreground shadow-[inset_0_0_22px_rgba(45,212,191,0.12),0_0_18px_rgba(45,212,191,0.12)]'
                      : 'text-sidebar-foreground/70',
                    collapsed && 'justify-center px-0 py-3'
                  )
                }
                title={collapsed ? t(`nav.${key}`) : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{t(`nav.${key}`)}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Version footer */}
      <div className="p-3 border-t border-sidebar-border">
        <p className={cn(
          'text-center text-xs text-sidebar-foreground/40',
          collapsed && 'opacity-0'
        )}>
          NMM v1.0
        </p>
      </div>
    </aside>
  )
}
