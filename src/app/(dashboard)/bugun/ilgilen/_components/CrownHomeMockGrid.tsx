'use client'

import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { SquareButton, type ButtonColor } from '@/components/ui/SquareButton'
import { useTranslation } from '@/providers/LanguageProvider'

type CrownItem = {
  id: string
  labelKey: string
  icon: LucideIcon
  color: ButtonColor
  href: string
}

const CROWN_ITEMS: readonly CrownItem[] = [
  { id: 'daily', labelKey: 'dashboard.crownMockDailyFollow', icon: ClipboardList, color: 'purple', href: '/bugunku-takibim' },
  { id: 'live', labelKey: 'dashboard.crownMockLiveTraining', icon: Video, color: 'blue', href: '/canli-egitim' },
  { id: 'team', labelKey: 'nav.ekip', icon: Users, color: 'amber', href: '/ekibim' },
  { id: 'weekly', labelKey: 'dashboard.crownMockWeeklySummary', icon: BarChart3, color: 'teal', href: '/haftalik-ozet' },
  { id: 'monthly', labelKey: 'dashboard.crownMockMonthlySummary', icon: CalendarRange, color: 'pink', href: '/aylik-ozet' },
  { id: 'first30', labelKey: 'dashboard.crownMockFirst30Days', icon: CalendarDays, color: 'coral', href: '/ilk-30-gun' },
]

export function CrownHomeMockGrid() {
  const { t } = useTranslation()

  return (
    <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-[1.125rem]">
      {CROWN_ITEMS.map(({ id, labelKey, icon, color, href }) => (
        <div key={id} className="relative min-w-0">
          <SquareButton
            icon={icon}
            label={t(labelKey)}
            color={color}
            variant="crown"
            href={href}
            prominent
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}
