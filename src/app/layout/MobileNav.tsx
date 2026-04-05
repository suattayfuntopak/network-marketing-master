import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, GitMerge, MessageSquare, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

const mobileNavItems = [
  { title: 'Pano', href: ROUTES.DASHBOARD, Icon: LayoutDashboard },
  { title: 'Kontaklar', href: ROUTES.CONTACTS, Icon: Users },
  { title: 'Pipeline', href: ROUTES.PIPELINE, Icon: GitMerge },
  { title: 'Mesajlar', href: ROUTES.MESSAGES, Icon: MessageSquare },
  { title: 'Takvim', href: ROUTES.CALENDAR, Icon: Calendar },
]

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <ul className="flex">
        {mobileNavItems.map(({ title, href, Icon }) => (
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
              <span>{title}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
