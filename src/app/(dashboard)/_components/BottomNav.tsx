'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Bot, Users } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/pano',     label: 'Pano',           icon: LayoutDashboard },
  { href: '/pipeline', label: 'Boru Hattı',     icon: TrendingUp      },
  { href: '/yazar',    label: 'YZ Mesajı Üret', icon: Bot             },
  { href: '/ekip',     label: 'Ekibim',         icon: Users           },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors',
              active ? 'text-[#534AB7]' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon
              className={clsx('h-5 w-5', active && 'drop-shadow-sm')}
              strokeWidth={active ? 2.25 : 1.75}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
