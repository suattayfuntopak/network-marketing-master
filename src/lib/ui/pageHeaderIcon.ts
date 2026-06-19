import { getPanoLauncherColor } from '@/lib/domain/navigation'
import { crownSolidMap } from '@/components/ui/SquareButton'
import { EKIP_MODULE_ACCENT_CLASS } from '@/lib/ui/brandGradients'

/** Sayfa başlık ikon kutusu — pano grid + sidebar ile aynı gradient. */
export function pageHeaderIconClass(href: string): string {
  if (href === '/ekip') return EKIP_MODULE_ACCENT_CLASS
  const color = getPanoLauncherColor(href)
  if (!color) return 'bg-[var(--bg-subtle)] text-[var(--text-2)]'
  return crownSolidMap[color]
}

/** Gradient kutu içindeki Lucide ikon sınıfı (light/dark'ta net görünür). */
export const PAGE_HEADER_ICON_GLYPH = 'h-5 w-5 shrink-0 text-white'
