'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart2, PenLine, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { logoutAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'

const NAV_ITEMS = [
  { href: '/pano',     label: 'Pano',       icon: LayoutDashboard },
  { href: '/pipeline', label: 'Boru Hattı', icon: BarChart2       },
  { href: '/yazar',    label: 'Mesaj Yaz',  icon: PenLine         },
  { href: '/ekip',     label: 'Ekibim',     icon: Users           },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: ws } = useWorkspace()

  const initials = ws?.fullName
    ? ws.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 hidden h-full flex-col border-r border-[var(--border)] bg-[var(--bg-card)] md:flex',
        'transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center border-b border-[var(--border)] py-4',
        collapsed ? 'justify-center px-0' : 'gap-3 px-4 pr-2'
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#534AB7]">
          <span className="text-[10px] font-black tracking-tight text-white">NMM</span>
        </div>
        {!collapsed && (
          <span className="flex-1 text-[9px] font-black uppercase tracking-widest leading-snug text-[var(--text-1)]">
            Network<br />Marketing<br />Master
          </span>
        )}
      </div>

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

      {/* Alt kısım: kullanıcı + tema toggle (collapsed'da) + çıkış + toggle */}
      <div className={clsx('border-t border-[var(--border)] pb-2 pt-2', collapsed ? 'px-2' : 'px-3 space-y-1')}>
        {/* Kullanıcı */}
        {ws && (
          <div className={clsx(
            'flex items-center rounded-xl',
            collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2.5'
          )}>
            <div
              title={collapsed ? (ws.fullName ?? undefined) : undefined}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]"
            >
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--text-1)]">{ws.fullName}</p>
                <p className="text-[10px] text-[var(--text-3)] capitalize">
                  {ws.role === 'leader' ? 'Lider' : 'Üye'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Çıkış */}
        <form action={logoutAction}>
          <button
            type="submit"
            title={collapsed ? 'Çıkış Yap' : undefined}
            className={clsx(
              'flex items-center rounded-xl text-sm font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
              collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed && 'Çıkış Yap'}
          </button>
        </form>

        {/* Collapse toggle */}
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
