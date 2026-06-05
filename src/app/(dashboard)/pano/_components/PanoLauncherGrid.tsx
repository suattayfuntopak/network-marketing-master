'use client'

import { Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { SquareButton } from '@/components/ui/SquareButton'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { PANO_LAUNCHER_ITEMS } from '@/lib/domain/navigation'

const TODAY_HUB_HREF = '/bugun/ilgilen'

interface PanoLauncherGridProps {
  todayHubOpen: boolean
  onTodayHubToggle: () => void
}

export function PanoLauncherGrid({ todayHubOpen, onTodayHubToggle }: PanoLauncherGridProps) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false
  const teamLocked = !hasTeamPageAccess(ws?.licenseType, isSuperAdmin)

  return (
    <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-[1.125rem]">
      {PANO_LAUNCHER_ITEMS.map(({ href, translationKey, icon, color }) => {
        const isTeamLocked = href === '/ekip' && teamLocked
        const isTodayHub = href === TODAY_HUB_HREF
        const active = isTodayHub && todayHubOpen

        return (
          <div key={href} className="relative min-w-0">
            <SquareButton
              icon={icon}
              label={t(translationKey)}
              color={color}
              variant="crown"
              href={isTodayHub ? undefined : isTeamLocked ? '/odeme' : href}
              onClick={isTodayHub ? onTodayHubToggle : undefined}
              prominent
              className={clsx('w-full', active && 'ring-2 ring-[#534AB7]/40 dark:ring-[#FACC15]/35')}
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
  )
}
