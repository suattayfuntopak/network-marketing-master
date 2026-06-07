import {
  LayoutDashboard, TrendingUp, Bot, Users,
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

export type PanoLauncherItem = NavItem & {
  color: ButtonColor
  desktopColor?: ButtonColor
}

/** Pano — kişisel yolculuk + araç kutuları (12 adet, 4×3 / mobil 2×6). */
export const PANO_ORGANIZATION_ITEMS: readonly PanoLauncherItem[] = [
  { href: '/hedefim', translationKey: 'dashboard.panoActionPlan', icon: Target, color: 'indigo', desktopColor: 'indigo' },
  { href: '/bugunku-takibim', translationKey: 'dashboard.panoDailyWhatIDid', icon: ClipboardList, color: 'purple', desktopColor: 'purple' },
  { href: '/haftalik-ozet', translationKey: 'dashboard.crownMockWeeklySummary', icon: BarChart3, color: 'teal', desktopColor: 'teal' },
  { href: '/aylik-ozet', translationKey: 'dashboard.crownMockMonthlySummary', icon: CalendarRange, color: 'rose', desktopColor: 'rose' },
  { href: '/ilk-30-gun', translationKey: 'dashboard.crownMockFirst30Days', icon: CalendarDays, color: 'coral', desktopColor: 'coral' },
  { href: '/canli-egitim', translationKey: 'dashboard.crownMockLiveTraining', icon: Video, color: 'blue', desktopColor: 'blue' },
  { href: '/yazar', translationKey: 'nav.yazar', icon: Bot, color: 'indigo', desktopColor: 'indigo' },
  { href: '/egitim', translationKey: 'nav.vaktinVarsa', icon: BookOpen, color: 'chick', desktopColor: 'chick' },
  { href: '/pipeline', translationKey: 'nav.pipeline', icon: TrendingUp, color: 'teal', desktopColor: 'teal' },
  { href: '/ekip', translationKey: 'nav.ekip', icon: Users, color: 'amber', desktopColor: 'amber' },
  { href: '/takvim', translationKey: 'nav.takvim', icon: CalendarDays, color: 'purple', desktopColor: 'purple' },
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart2, color: 'coral', desktopColor: 'coral' },
]

/** @deprecated Pano artık PANO_ORGANIZATION_ITEMS kullanır */
export const PANO_LAUNCHER_ITEMS = PANO_ORGANIZATION_ITEMS

function panoToNavItem({ href, translationKey, icon }: PanoLauncherItem): NavItem {
  return { href, translationKey, icon }
}

/** Alt nav / sidebar — pano hub + kutularla aynı sıra. */
export const NAV_SIDEBAR_MODULES: readonly NavItem[] = [
  { href: '/pano', translationKey: 'nav.pano', icon: LayoutDashboard },
  ...PANO_ORGANIZATION_ITEMS.map(panoToNavItem),
]

/** @deprecated NAV_SIDEBAR_MODULES kullanın */
export const NAV_MODULE_ITEMS: readonly NavItem[] = PANO_ORGANIZATION_ITEMS.map(panoToNavItem)

export const NAV_PRIMARY: readonly NavItem[] = NAV_SIDEBAR_MODULES

export const NAV_MORE_ITEMS: readonly NavItem[] = []

export const NAV_ADMIN: NavItem = {
  href: '/platform-yonetim',
  translationKey: 'nav.platformYonetim',
  icon: Crown,
}

/** @deprecated Prefer NAV_SIDEBAR_MODULES */
export const NAV_SECONDARY: readonly NavItem[] = NAV_MORE_ITEMS
export const NAV_EXPERT: readonly NavItem[] = []

export const NAV_ITEMS = [
  ...NAV_SIDEBAR_MODULES,
] as const

export const NAV_ROUTES = [
  '/pano',
  ...PANO_ORGANIZATION_ITEMS.map(i => i.href),
] as const

export const NAV_MOBILE_BAR = NAV_SIDEBAR_MODULES

export const NAV_MORE_ICON = Ellipsis

const MORE_ROUTE_PREFIXES = [
  '/itirazlar',
  '/saha-provasi',
  '/uyum',
  '/platform-yonetim',
] as const

export function isNavMoreRouteActive(pathname: string): boolean {
  return MORE_ROUTE_PREFIXES.some(p => pathname === p || pathname.startsWith(p))
}

/** Alt nav kısa etiketleri — nav.* → navMobile.*; dashboard.* olduğu gibi. */
export function navBarLabelKey(translationKey: string): string {
  return translationKey.startsWith('nav.') ? translationKey.replace('nav.', 'navMobile.') : translationKey
}
