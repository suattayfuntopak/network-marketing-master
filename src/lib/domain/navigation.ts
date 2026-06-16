import {
  LayoutDashboard, ClipboardList, Bot, Users,
  CalendarDays, BookOpen, Target,
  GraduationCap, History, Crown, Ellipsis, Activity,
  BarChart3, ShoppingBag, Megaphone,
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
/** Pano 5×2 — komşu kutularda aynı renk yok; Takvim=Saha Özetim (teal), İstatistikler=Hedefim (indigo). */
export const PANO_ORGANIZATION_ITEMS: readonly PanoLauncherItem[] = [
  { href: '/hedefim', translationKey: 'dashboard.panoActionPlan', icon: Target, color: 'indigo', desktopColor: 'indigo' },
  { href: '/saha-ozetim', translationKey: 'dashboard.panoFieldSummary', icon: History, color: 'teal', desktopColor: 'teal' },
  { href: '/saha-radar', translationKey: 'dashboard.crownMockSahaRadar', icon: Activity, color: 'coral', desktopColor: 'coral' },
  { href: '/pipeline', translationKey: 'nav.pipeline', icon: ClipboardList, color: 'amber', desktopColor: 'amber' },
  { href: '/ekip', translationKey: 'nav.ekip', icon: Users, color: 'rose', desktopColor: 'rose' },
  { href: '/egitim', translationKey: 'nav.vaktinVarsa', icon: BookOpen, color: 'blue', desktopColor: 'blue' },
  { href: '/canli-egitim', translationKey: 'dashboard.crownMockLiveTraining', icon: GraduationCap, color: 'chick', desktopColor: 'chick' },
  { href: '/yazar', translationKey: 'nav.yazar', icon: Bot, color: 'purple', desktopColor: 'purple' },
  { href: '/takvim', translationKey: 'nav.takvim', icon: CalendarDays, color: 'teal', desktopColor: 'teal' },
  { href: '/istatistikler', translationKey: 'nav.istatistikler', icon: BarChart3, color: 'indigo', desktopColor: 'indigo' },
]

/** @deprecated Pano artık PANO_ORGANIZATION_ITEMS kullanır */
export const PANO_LAUNCHER_ITEMS = PANO_ORGANIZATION_ITEMS

function panoToNavItem({ href, translationKey, icon, calendarPeriod }: PanoLauncherItem): NavItem {
  return { href, translationKey, icon, calendarPeriod }
}

/**
 * Alt nav / sidebar. Pano 5×2 launcher'ına (PANO_ORGANIZATION_ITEMS) dokunulmaz;
 * yalnız nav sırası ayarlanır. İstatistikler nav'da en sona alınır → ekibe eklenen
 * Admin (NAV_ADMIN, bileşende append edilir) hariç son sırada görünür.
 */
const PANO_NAV_ITEMS = PANO_ORGANIZATION_ITEMS.map(panoToNavItem)
const STATS_HREF = '/istatistikler'

export const NAV_SIDEBAR_MODULES: readonly NavItem[] = [
  { href: '/pano', translationKey: 'nav.pano', icon: LayoutDashboard },
  ...PANO_NAV_ITEMS.filter(i => i.href !== STATS_HREF),
  // Müşterilerim / Duyurular — launcher'a dokunmadan yalnız sidebar + (kaydırılabilir) alt nav.
  { href: '/musteriler', translationKey: 'nav.musteriler', icon: ShoppingBag },
  { href: '/duyurular', translationKey: 'nav.duyurular', icon: Megaphone },
  // İstatistikler — Admin'den hemen önce (kullanıcı talebi).
  ...PANO_NAV_ITEMS.filter(i => i.href === STATS_HREF),
]

/** @deprecated NAV_SIDEBAR_MODULES kullanın */
export const NAV_MODULE_ITEMS: readonly NavItem[] = PANO_ORGANIZATION_ITEMS.map(panoToNavItem)

export const NAV_PRIMARY: readonly NavItem[] = NAV_SIDEBAR_MODULES

/**
 * Mobil alt bar — birincil (her zaman görünür) 5 modül; gerisi "Diğer" çekmecesinde.
 * Masaüstü sidebar tüm listeyi gösterir (dikey alan bol). Sıra: bu dizinin sırası.
 */
export const NAV_MOBILE_PRIMARY_HREFS: readonly string[] = [
  '/pano',
  '/pipeline',
  '/ekip',
  '/hedefim',
  '/saha-radar',
]

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

const PANO_COLOR_BY_HREF = Object.fromEntries(
  PANO_ORGANIZATION_ITEMS.map((item) => [item.href, item.color]),
) as Record<string, ButtonColor>

/** Sidebar aktif vurgusu — pano kutusu rengi; platform yönetimi amber (başlık taç ikonu). */
export function getPanoLauncherColor(href: string): ButtonColor | undefined {
  if (href === '/pano') return 'purple'
  if (href === NAV_ADMIN.href) return 'amber'
  return PANO_COLOR_BY_HREF[href]
}
