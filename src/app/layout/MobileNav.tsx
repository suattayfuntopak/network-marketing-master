import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, GitMerge, MessageSquare, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useTranslation } from 'react-i18next'

const mobileNavConfig = [
  { key: 'dashboard', href: ROUTES.DASHBOARD, Icon: LayoutDashboard },
  { key: 'contacts', href: ROUTES.CONTACTS, Icon: Users },
  { key: 'pipeline', href: ROUTES.PIPELINE, Icon: GitMerge },
  { key: 'messages', href: ROUTES.MESSAGES, Icon: MessageSquare },
  { key: 'calendar', href: ROUTES.CALENDAR, Icon: Calendar },
]

export function MobileNav() {
  const { t } = useTranslation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <ul className="flex">
        {mobileNavConfig.map(({ key, href, Icon }) => (
          <li key={href} className="flex-1">
            <NavLink
              to={href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{t(`nav.${key}`)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
