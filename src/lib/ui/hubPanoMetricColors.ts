import type { ButtonColor } from '@/components/ui/SquareButton'
import type { FunnelMetricKey } from '@/lib/ui/funnelMetricVisuals'

/**
 * Saha Özetim metrik kutuları — pano launcher renkleri.
 * 2×2 huni + 2×3 aktivite ızgarasında komşu hücrelerde aynı renk yok.
 *
 * Huni:  indigo | teal
 *        coral  | amber
 * Aktivite: rose | blue
 *           chick | purple
 *           teal  | indigo  (Takvim / İstatistikler — üstteki teal/indigo ile komşu değil)
 */
export const HUB_FUNNEL_PANO_COLOR: Record<FunnelMetricKey, ButtonColor> = {
  arama: 'indigo',
  tanisma: 'teal',
  sunum: 'coral',
  yeniUye: 'amber',
}

export const HUB_ACTIVITY_PANO_COLOR = {
  whatsapp: 'rose',
  notes: 'blue',
  stage: 'chick',
  ai: 'purple',
  active: 'teal',
  total: 'indigo',
} as const satisfies Record<string, ButtonColor>
