import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GitMerge, MessageSquare, Calendar,
  GraduationCap, Users2, BarChart2, Settings, ChevronLeft, ChevronRight,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'

const navConfig = [
  { key: 'dashboard', href: ROUTES.DASHBOARD, Icon: LayoutDashboard },
  { key: 'contacts', href: ROUTES.CONTACTS, Icon: Users },
  { key: 'pipeline', href: ROUTES.PIPELINE, Icon: GitMerge },
  { key: 'messages', href: ROUTES.MESSAGES, Icon: MessageSquare },
  { key: 'calendar', href: ROUTES.CALENDAR, Icon: Calendar },
  { key: 'academy', href: ROUTES.ACADEMY, Icon: GraduationCap },
  { key: 'team', href: ROUTES.TEAM, Icon: Users2, roles: ['leader', 'admin'] as string[] },
  { key: 'analytics', href: ROUTES.ANALYTICS, Icon: BarChart2 },
  { key: 'settings', href: ROUTES.SETTINGS, Icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useAuth()
  const { t } = useTranslation()

  const navItems = navConfig.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(profile?.role ?? 'distributor')
  })

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0',
        collapsed && 'justify-center px-0'
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm leading-tight">
            Network<br />Marketing Master
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map(({ key, href, Icon }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
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

      {/* Collapse button */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>{t('nav.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
