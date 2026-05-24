'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Bot, Users, CalendarDays, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/pano',       label: 'Pano',           icon: LayoutDashboard },
  { href: '/pipeline',   label: 'Boru Hattı',     icon: TrendingUp      },
  { href: '/yazar',      label: 'YZ Mesajı Üret', icon: Bot             },
  { href: '/ekip',       label: 'Ekibim',         icon: Users           },
  { href: '/takvim',     label: 'Takvim',         icon: CalendarDays    },
  { href: '/kazanimlar', label: 'Kazanımlar',     icon: Trophy          },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 hidden h-full flex-col border-r border-[var(--border)] bg-[var(--bg-card)] md:flex',
        'transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <Link
        href="/pano"
        className={clsx(
          'flex items-center border-b border-[var(--border)] py-4 transition hover:opacity-85',
          collapsed ? 'justify-center px-0' : 'gap-3 px-4 pr-2'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#534AB7]">
          <span className="text-[10px] font-black tracking-tight text-white">NMM</span>
        </div>
        {!collapsed && (
          <span className="flex-1 text-[9px] font-black uppercase tracking-widest leading-snug text-[var(--text-1)]">
            Network<br />Marketing<br />Master
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className={clsx('flex-1 space-y-1 py-3', collapsed ? 'px-2' : 'px-3')}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                'flex items-center rounded-xl transition-colors',
                collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2.5',
                'text-sm font-medium',
                active
                  ? 'bg-[#EEEDFE] text-[#534AB7] dark:bg-[#2d2a5e] dark:text-[#a09be8]'
                  : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Alt kısım: sadece collapse toggle */}
      <div className={clsx('border-t border-[var(--border)] p-2')}>
        <button
          onClick={onToggle}
          title={collapsed ? 'Genişlet' : 'Daralt'}
          className={clsx(
            'flex items-center rounded-xl text-xs font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
            collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            : <><ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} /> Daralt</>
          }
        </button>
      </div>
    </aside>
  )
}
