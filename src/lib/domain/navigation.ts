import {
  LayoutDashboard, ScanEye, TrendingUp, Bot, Users,
  CalendarDays, CalendarRange, BookOpen, Target,
  BarChart3, ClipboardList, Video,
  BarChart2, Crown, Ellipsis,
  type LucideIcon,
} from 'lucide-react'
import type { ButtonColor } from '@/components/ui/SquareButton'

export type NavItem = {
  readonly href: string
  readonly translationKey: string
  readonly icon: LucideIcon
}

/** Pano mobil grid + sidebar modül listesi (6 kutu) */
export const NAV_MODULE_ITEMS: readonly NavItem[] = [
  { href: '/pano', translationKey: 'nav.todayFocus', icon: ScanEye },
  { href: '/pipeline',      translationKey: 'nav.pipeline',   icon: TrendingUp },
  { href: '/takvim',        translationKey: 'nav.takvim',   icon: CalendarDays },
  { href: '/ekip',          translationKey: 'nav.ekip',     icon: Users },
  { href: '/yazar',         translationKey: 'nav.yazar',    icon: Bot },
  { href: '/egitim',        translationKey: 'nav.vaktinVarsa', icon: BookOpen },
]

export const NAV_PRIMARY: readonly NavItem[] = [
  { href: '/pano', translationKey: 'nav.pano', icon: LayoutDashboard },
  ...NAV_MODULE_ITEMS.slice(0, 4),
]

export const NAV_SIDEBAR_MODULES: readonly NavItem[] = [
  { href: '/pano', translationKey: 'nav.pano', icon: LayoutDashboard },
  ...NAV_MODULE_ITEMS,
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart2 },
]

export const NAV_MORE_ITEMS: readonly NavItem[] = [
  ...NAV_MODULE_ITEMS.slice(4),
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart2 },
]

export const NAV_ADMIN: NavItem = {
  href: '/platform-yonetim',
  translationKey: 'nav.platformYonetim',
  icon: Crown,
}

/** @deprecated Prefer NAV_MODULE_ITEMS / NAV_SIDEBAR_MODULES */
export const NAV_SECONDARY: readonly NavItem[] = NAV_MORE_ITEMS
export const NAV_EXPERT: readonly NavItem[] = []

export const NAV_ITEMS = [
  ...NAV_SIDEBAR_MODULES,
] as const

export const NAV_ROUTES = [
  '/pano',
  ...NAV_MODULE_ITEMS.map(i => i.href),
  '/istatistikler',
] as const

export const NAV_MOBILE_BAR = NAV_PRIMARY

export const NAV_MORE_ICON = Ellipsis

export type PanoLauncherItem = NavItem & {
  color: ButtonColor
  desktopColor?: ButtonColor
}

const MORE_ROUTE_PREFIXES = [
  '/itirazlar',
  '/takvim',
  '/egitim',
  '/istatistikler',
  '/yazar',
  '/saha-provasi',
  '/uyum',
  '/platform-yonetim',
] as const

export function isNavMoreRouteActive(pathname: string): boolean {
  return MORE_ROUTE_PREFIXES.some(p => pathname === p || pathname.startsWith(p))
}

/** Pano — Crown Organizasyon: kişisel yolculuk kutuları (+ YZ Koçu, Vaktin Varsa). */
export const PANO_ORGANIZATION_ITEMS: readonly PanoLauncherItem[] = [
  { href: '/hedefim', translationKey: 'dashboard.panoActionPlan', icon: Target, color: 'indigo', desktopColor: 'indigo' },
  { href: '/bugunku-takibim', translationKey: 'dashboard.panoDailyWhatIDid', icon: ClipboardList, color: 'purple', desktopColor: 'purple' },
  { href: '/haftalik-ozet', translationKey: 'dashboard.crownMockWeeklySummary', icon: BarChart3, color: 'teal', desktopColor: 'teal' },
  { href: '/aylik-ozet', translationKey: 'dashboard.crownMockMonthlySummary', icon: CalendarRange, color: 'pink', desktopColor: 'pink' },
  { href: '/ilk-30-gun', translationKey: 'dashboard.crownMockFirst30Days', icon: CalendarDays, color: 'coral', desktopColor: 'coral' },
  { href: '/canli-egitim', translationKey: 'dashboard.crownMockLiveTraining', icon: Video, color: 'blue', desktopColor: 'blue' },
  { href: '/yazar', translationKey: 'nav.yazar', icon: Bot, color: 'cyan', desktopColor: 'cyan' },
  { href: '/egitim', translationKey: 'nav.vaktinVarsa', icon: BookOpen, color: 'chick', desktopColor: 'chick' },
]

/** @deprecated Pano artık PANO_ORGANIZATION_ITEMS kullanır */
export const PANO_LAUNCHER_ITEMS = PANO_ORGANIZATION_ITEMS
