'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { LayoutDashboard, TrendingUp, Bot, Users, MessageCircleQuestion } from 'lucide-react'
import { clsx } from 'clsx'
import { setNavDir } from './DashboardShell'

const NAV_ITEMS = [
  { href: '/pano',      translationKey: 'nav.pano',      icon: LayoutDashboard        },
  { href: '/pipeline',  translationKey: 'nav.pipeline',  icon: TrendingUp             },
  { href: '/yazar',     translationKey: 'nav.yazar',     icon: Bot                    },
  { href: '/itirazlar', translationKey: 'nav.itirazlar', icon: MessageCircleQuestion  },
  { href: '/ekip',      translationKey: 'nav.ekip',      icon: Users                  },
]

interface BottomNavProps {
  pendingHref?: string | null
}

export function BottomNav({ pendingHref }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  function navigate(targetHref: string) {
    const currentIdx = NAV_ITEMS.findIndex(({ href }) => pathname === href || (href !== '/pano' && pathname.startsWith(href)))
    const targetIdx = NAV_ITEMS.findIndex(({ href }) => href === targetHref)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx !== targetIdx) {
      setNavDir(targetIdx > currentIdx ? 'forward' : 'back')
    }
    router.push(targetHref)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden">
      {NAV_ITEMS.map(({ href, translationKey, icon: Icon }) => {
        const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
        const pending = pendingHref === href
        const label = t(translationKey)
        return (
          <button
            key={href}
            onClick={() => navigate(href)}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-all duration-150',
              active ? 'text-[#534AB7]' : 'text-gray-400 hover:text-gray-600',
              pending && 'scale-110 text-[#534AB7]'
            )}
          >
            <Icon
              className={clsx('h-5 w-5', active && 'drop-shadow-sm')}
              strokeWidth={active || pending ? 2.25 : 1.75}
            />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

