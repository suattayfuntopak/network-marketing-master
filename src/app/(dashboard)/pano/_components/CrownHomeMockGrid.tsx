'use client'

import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Key,
  Lock,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { SquareButton, type ButtonColor } from '@/components/ui/SquareButton'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'

type MockItem = {
  id: string
  labelKey: string
  icon: LucideIcon
  color: ButtonColor
}

const CROWN_MOCK_ITEMS: readonly MockItem[] = [
  { id: 'daily', labelKey: 'dashboard.crownMockDailyFollow', icon: ClipboardList, color: 'purple' },
  { id: 'live', labelKey: 'dashboard.crownMockLiveTraining', icon: Video, color: 'blue' },
  { id: 'team', labelKey: 'nav.ekip', icon: Users, color: 'amber' },
  { id: 'weekly', labelKey: 'dashboard.crownMockWeeklySummary', icon: BarChart3, color: 'teal' },
  { id: 'monthly', labelKey: 'dashboard.crownMockMonthlySummary', icon: CalendarRange, color: 'pink' },
  { id: 'first30', labelKey: 'dashboard.crownMockFirst30Days', icon: CalendarDays, color: 'coral' },
]

export function CrownHomeMockGrid() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()

  function mockTap() {
    toast.message(t('dashboard.crownMockSoon'))
  }

  return (
    <div className="space-y-3">
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-[1.125rem]">
        {CROWN_MOCK_ITEMS.map(({ id, labelKey, icon, color }) => (
          <div key={id} className="relative min-w-0">
            <SquareButton
              icon={icon}
              label={t(labelKey)}
              color={color}
              variant="crown"
              onClick={mockTap}
              prominent
              className="w-full"
            />
          </div>
        ))}
      </div>

      <SquareButton
        icon={Key}
        label={t('dashboard.crownMockInviteCode', { code: ws?.inviteCode ?? '——' })}
        color="yellow"
        variant="crown"
        onClick={mockTap}
        className="aspect-auto w-full min-h-[92px] py-5 md:mx-auto md:max-w-md"
      />
    </div>
  )
}
