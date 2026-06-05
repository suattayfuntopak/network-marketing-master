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
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'

type MockItem = {
  id: string
  labelKey: string
  icon: LucideIcon
  color: ButtonColor
  href?: string
}

const CROWN_MOCK_ITEMS: readonly MockItem[] = [
  { id: 'daily', labelKey: 'dashboard.crownMockDailyFollow', icon: ClipboardList, color: 'purple' },
  { id: 'live', labelKey: 'dashboard.crownMockLiveTraining', icon: Video, color: 'blue' },
  { id: 'team', labelKey: 'nav.ekip', icon: Users, color: 'amber', href: '/ekip' },
  { id: 'weekly', labelKey: 'dashboard.crownMockWeeklySummary', icon: BarChart3, color: 'teal' },
  { id: 'monthly', labelKey: 'dashboard.crownMockMonthlySummary', icon: CalendarRange, color: 'pink' },
  { id: 'first30', labelKey: 'dashboard.crownMockFirst30Days', icon: CalendarDays, color: 'coral' },
]

export function CrownHomeMockGrid() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false
  const teamLocked = !hasTeamPageAccess(ws?.licenseType, isSuperAdmin)

  function mockTap() {
    toast.message(t('dashboard.crownMockSoon'))
  }

  return (
    <div className="space-y-3">
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-[1.125rem]">
        {CROWN_MOCK_ITEMS.map(({ id, labelKey, icon, color, href }) => {
          const isTeam = id === 'team'
          const isTeamLocked = isTeam && teamLocked
          const targetHref = isTeamLocked ? '/odeme' : href

          return (
            <div key={id} className="relative min-w-0">
              <SquareButton
                icon={icon}
                label={t(labelKey)}
                color={color}
                variant="crown"
                href={targetHref}
                onClick={!targetHref ? mockTap : undefined}
                prominent
                className="w-full"
              />
              {isTeamLocked && (
                <span
                  className="pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm md:right-3 md:top-3"
                  aria-hidden
                >
                  <Lock className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={2.25} />
                </span>
              )}
            </div>
          )
        })}
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
