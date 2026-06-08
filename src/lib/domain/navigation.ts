import {
  LayoutDashboard, TrendingUp, Bot, Users,
  CalendarDays, BookOpen, Target,
  GraduationCap, History, Crown, Ellipsis, Activity,
  type LucideIcon,
} from 'lucide-react'
import type { ButtonColor } from '@/components/ui/SquareButton'

export type NavItem = {
  readonly href: string
  readonly translationKey: string
  readonly icon: LucideIcon
  /** Sidebar / alt nav — ajanda ikonu (7 haftalık, 30 aylık) */
  readonly calendarPeriod?: 7 | 30
}

export type PanoLauncherItem = NavItem & {
  color: ButtonColor
  desktopColor?: ButtonColor
}
/** Pano 3×3 — renkler komşu kutularda tekrar etmez. */
export const PANO_ORGANIZATION_ITEMS: readonly PanoLauncherItem[] = [
  { href: '/hedefim', translationKey: 'dashboard.panoActionPlan', icon: Target, color: 'indigo', desktopColor: 'indigo' },
  { href: '/saha-ozetim', translationKey: 'dashboard.panoFieldSummary', icon: History, color: 'teal', desktopColor: 'teal' },
  { href: '/saha-radar', translationKey: 'dashboard.crownMockSahaRadar', icon: Activity, color: 'coral', desktopColor: 'coral' },
  { href: '/pipeline', translationKey: 'nav.pipeline', icon: TrendingUp, color: 'amber', desktopColor: 'amber' },
  { href: '/ekip', translationKey: 'nav.ekip', icon: Users, color: 'rose', desktopColor: 'rose' },
  { href: '/egitim', translationKey: 'nav.vaktinVarsa', icon: BookOpen, color: 'blue', desktopColor: 'blue' },
  { href: '/canli-egitim', translationKey: 'dashboard.crownMockLiveTraining', icon: GraduationCap, color: 'chick', desktopColor: 'chick' },
  { href: '/yazar', translationKey: 'nav.yazar', icon: Bot, color: 'purple', desktopColor: 'purple' },
  { href: '/takvim', translationKey: 'nav.takvim', icon: CalendarDays, color: 'coral', desktopColor: 'coral' },
]

/** @deprecated Pano artık PANO_ORGANIZATION_ITEMS kullanır */
export const PANO_LAUNCHER_ITEMS = PANO_ORGANIZATION_ITEMS

function panoToNavItem({ href, translationKey, icon, calendarPeriod }: PanoLauncherItem): NavItem {
  return { href, translationKey, icon, calendarPeriod }
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
