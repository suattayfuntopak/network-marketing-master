'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { LayoutDashboard, Zap, TrendingUp, Bot, Users, CalendarDays, Trophy, MessageCircleQuestion, BookOpen, ChevronLeft, ChevronRight, Shield, BarChart2, Target, Crown } from 'lucide-react'
import { clsx } from 'clsx'
import { useAIUsage } from '@/hooks/useAIUsage'

const NAV_ITEMS = [
  { href: '/pano',          translationKey: 'nav.pano',          icon: LayoutDashboard          },
  { href: '/bugun/ilgilen', translationKey: 'nav.todayFocus',    icon: Zap                      },
  { href: '/pipeline',      translationKey: 'nav.pipeline',      icon: TrendingUp               },
  { href: '/takvim',        translationKey: 'nav.takvim',        icon: CalendarDays             },
  { href: '/ekip',          translationKey: 'nav.ekip',          icon: Users                    },
  { href: '/egitim',        translationKey: 'nav.egitim',        icon: BookOpen                 },
  { href: '/itirazlar',     translationKey: 'nav.itirazlar',     icon: MessageCircleQuestion    },
  { href: '/yazar',         translationKey: 'nav.yazar',         icon: Bot                      },
  { href: '/saha-provasi',  translationKey: 'nav.sahaProvasi',   icon: Target                   },
  { href: '/uyum',          translationKey: 'nav.uyum',          icon: Shield                   },
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart2                },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { data: usage } = useAIUsage()
  const isSuperAdmin = usage?.isSuperAdmin ?? false

  const items = isSuperAdmin
    ? [...NAV_ITEMS, { href: '/platform-yonetim', translationKey: 'nav.platformYonetim', icon: Crown }]
    : NAV_ITEMS

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 hidden h-[calc(100vh-4rem)] flex-col border-r border-[var(--border)] bg-[var(--bg-card)] md:flex',
        'transition-all duration-300 z-35',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Spacer / Top padding to replace the old logo area */}
      <div className="h-4" />

      {/* Nav */}
      <nav className={clsx('flex-1 space-y-1 py-1', collapsed ? 'px-2' : 'px-3')}>
        {items.map(({ href, translationKey, icon: Icon }) => {
          const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
          const label = t(translationKey)
          const isCrown = href === '/platform-yonetim'

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                'flex items-center rounded-xl transition-colors',
                collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2.5',
                'text-sm font-medium',
                isCrown
                  ? active
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                    : 'text-amber-600/90 dark:text-amber-400/90 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 font-bold'
                  : active
                    ? 'bg-[#EEEDFE] text-[#534AB7] dark:bg-[#2d2a5e] dark:text-[#a09be8]'
                    : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]'
              )}
            >
              <Icon 
                className={clsx(
                  'h-4 w-4 shrink-0',
                  isCrown && !active && 'animate-pulse'
                )} 
                strokeWidth={active || isCrown ? 2.25 : 1.75} 
              />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Alt kısım: sadece collapse toggle */}
      <div className={clsx('border-t border-[var(--border)] p-2')}>
        <button
          onClick={onToggle}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className={clsx(
            'flex items-center rounded-xl text-xs font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
            collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            : <><ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} /> {t('nav.collapse')}</>
          }
        </button>
      </div>
    </aside>
  )
}

