import {
  LayoutDashboard, Zap, TrendingUp, Bot, Users,
  CalendarDays, MessageCircleQuestion, BookOpen,
  Target, Shield, BarChart2,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/pano',          translationKey: 'nav.pano',          icon: LayoutDashboard       },
  { href: '/bugun/ilgilen', translationKey: 'nav.todayFocus',    icon: Zap                   },
  { href: '/pipeline',      translationKey: 'nav.pipeline',      icon: TrendingUp            },
  { href: '/takvim',        translationKey: 'nav.takvim',        icon: CalendarDays          },
  { href: '/ekip',          translationKey: 'nav.ekip',          icon: Users                 },
  { href: '/egitim',        translationKey: 'nav.egitim',        icon: BookOpen              },
  { href: '/itirazlar',     translationKey: 'nav.itirazlar',     icon: MessageCircleQuestion },
  { href: '/yazar',         translationKey: 'nav.yazar',         icon: Bot                   },
  { href: '/saha-provasi',  translationKey: 'nav.sahaProvasi',   icon: Target                },
  { href: '/uyum',          translationKey: 'nav.uyum',          icon: Shield                },
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart2             },
] as const

export const NAV_ROUTES = NAV_ITEMS.map(i => i.href)
