'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, BarChart2, PenLine, Users, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { logoutAction } from '../actions'

const NAV_ITEMS = [
  { href: '/bugun',    label: 'Bugün',    icon: Zap       },
  { href: '/pipeline', label: 'Boru Hattı', icon: BarChart2 },
  { href: '/yazar',    label: 'Yazar',    icon: PenLine   },
  { href: '/ekip',     label: 'Ekibim',   icon: Users     },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-gray-100 bg-white md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#534AB7]">
          <span className="text-sm font-black text-white">N</span>
        </div>
        <span className="text-sm font-bold text-gray-900">NM Master</span>
      </div>

      {/* Nav linkleri */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#EEEDFE] text-[#534AB7]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Çıkış */}
      <div className="border-t border-gray-100 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Çıkış Yap
          </button>
        </form>
      </div>
    </aside>
  )
}
