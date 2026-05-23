'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, BarChart2, PenLine, Users, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { logoutAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV_ITEMS = [
  { href: '/bugun',    label: 'Bugün',      icon: Zap       },
  { href: '/pipeline', label: 'Boru Hattı', icon: BarChart2 },
  { href: '/yazar',    label: 'Yazar',      icon: PenLine   },
  { href: '/ekip',     label: 'Ekibim',     icon: Users     },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: ws } = useWorkspace()

  const initials = ws?.fullName
    ? ws.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-card)] md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 pr-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#534AB7]">
          <span className="text-sm font-black text-white">N</span>
        </div>
        <span className="flex-1 text-xs font-bold leading-tight text-gray-900 dark:text-gray-100">
          Network Marketing<br />Master
        </span>
        <ThemeToggle />
      </div>

      {/* Nav linkleri */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-[#EEEDFE] text-[#534AB7] dark:bg-[#2d2a5e] dark:text-[#a09be8]' : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Kullanıcı + Çıkış */}
      <div className="border-t border-[var(--border)] p-3 space-y-1">
        {ws && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--text-1)]">{ws.fullName}</p>
              <p className="text-[10px] text-[var(--text-3)] capitalize">{ws.role === 'leader' ? 'Lider' : 'Üye'}</p>
            </div>
          </div>
        )}
        <form action={logoutAction}>
          <button type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Çıkış Yap
          </button>
        </form>
      </div>
    </aside>
  )
}
