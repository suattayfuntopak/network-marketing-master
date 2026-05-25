'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useEffect, useRef } from 'react'
import { 
  LayoutDashboard, Zap, TrendingUp, Bot, Users, 
  CalendarDays, MessageCircleQuestion, BookOpen, Trophy, Shield, BarChart2 
} from 'lucide-react'
import { clsx } from 'clsx'
import { setNavDir } from './DashboardShell'

const NAV_ITEMS = [
  { href: '/pano',          translationKey: 'nav.pano',          icon: LayoutDashboard        },
  { href: '/bugun/ilgilen', translationKey: 'nav.todayFocus',    icon: Zap                    },
  { href: '/pipeline',      translationKey: 'nav.pipeline',      icon: TrendingUp             },
  { href: '/takvim',        translationKey: 'nav.takvim',        icon: CalendarDays           },
  { href: '/ekip',          translationKey: 'nav.ekip',          icon: Users                  },
  { href: '/egitim',        translationKey: 'nav.egitim',        icon: BookOpen               },
  { href: '/itirazlar',     translationKey: 'nav.itirazlar',     icon: MessageCircleQuestion  },
  { href: '/yazar',         translationKey: 'nav.yazar',         icon: Bot                    },
  { href: '/kazanimlar',    translationKey: 'nav.kazanimlar',    icon: Trophy                 },
  { href: '/uyum',          translationKey: 'nav.uyum',          icon: Shield                 },
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart2                },
]

interface BottomNavProps {
  pendingHref?: string | null
  visible?: boolean
}

export function BottomNav({ pendingHref, visible = true }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { lang, t } = useTranslation()
  const activeRef = useRef<HTMLButtonElement | null>(null)

  // Automatically scroll & center active item horizontally
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [pathname])

  function navigate(targetHref: string) {
    const currentIdx = NAV_ITEMS.findIndex(({ href }) => pathname === href || (href !== '/pano' && pathname.startsWith(href)))
    const targetIdx = NAV_ITEMS.findIndex(({ href }) => href === targetHref)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx !== targetIdx) {
      setNavDir(targetIdx > currentIdx ? 'forward' : 'back')
    }
    router.push(targetHref)
  }

  return (
    <nav className={clsx(
      "fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-safe md:hidden transition-transform duration-300 ease-in-out transform overflow-x-auto scrollbar-none",
      visible ? 'translate-y-0' : 'translate-y-full'
    )}>
      {NAV_ITEMS.map(({ href, translationKey, icon: Icon }) => {
        const active = pathname === href || (href !== '/pano' && pathname.startsWith(href))
        const pending = pendingHref === href

        // Dynamic premium labels to fit perfectly
        let label = t(translationKey)
        if (translationKey === 'nav.todayFocus') {
          label = lang === 'en' ? 'Today' : 'Bugün İlgilen'
        } else if (translationKey === 'nav.pipeline') {
          label = lang === 'en' ? 'Pipeline' : 'Boru Hattı'
        } else if (translationKey === 'nav.yazar') {
          label = lang === 'en' ? 'AI Coach' : 'YZ Koçu'
        } else if (translationKey === 'nav.ekip') {
          label = lang === 'en' ? 'Team' : 'Ekibim'
        } else if (translationKey === 'nav.takvim') {
          label = lang === 'en' ? 'Calendar' : 'Takvim'
        } else if (translationKey === 'nav.itirazlar') {
          label = lang === 'en' ? 'Objections' : 'İtirazlar'
        } else if (translationKey === 'nav.egitim') {
          label = lang === 'en' ? 'Training' : 'Vaktin Varsa'
        } else if (translationKey === 'nav.kazanimlar') {
          label = lang === 'en' ? 'Awards' : 'Kazanımlar'
        } else if (translationKey === 'nav.uyum') {
          label = lang === 'en' ? 'Compliance' : 'Uyum Merkezi'
        } else if (translationKey === 'nav.istatistikler') {
          label = lang === 'en' ? 'Stats' : 'İstatistikler'
        }

        return (
          <button
            key={href}
            ref={active ? activeRef : undefined}
            onClick={() => navigate(href)}
            className={clsx(
              'flex flex-col items-center gap-1 py-3 text-[10px] font-bold transition-all duration-150 shrink-0 px-2 min-w-[76px] sm:min-w-[84px] text-center cursor-pointer',
              active ? 'text-[#534AB7] dark:text-[#FACC15]' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400',
              pending && 'scale-110 text-[#534AB7] dark:text-[#FACC15]'
            )}
          >
            <Icon
              className={clsx('h-5 w-5', active && 'drop-shadow-sm')}
              strokeWidth={active || pending ? 2.25 : 1.75}
            />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
