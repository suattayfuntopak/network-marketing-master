'use client'

import { Lock } from 'lucide-react'
import { SquareButton } from '@/components/ui/SquareButton'
import { LauncherGrid, LauncherGridItem } from '@/components/ui/LauncherGrid'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { PANO_LAUNCHER_ITEMS } from '@/lib/domain/navigation'

export function PanoLauncherGrid() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false
  const teamLocked = !hasTeamPageAccess(ws?.licenseType, isSuperAdmin)

  return (
    <LauncherGrid>
      {PANO_LAUNCHER_ITEMS.map(({ href, translationKey, icon, color }) => {
        const isTeamLocked = href === '/ekip' && teamLocked

        return (
          <LauncherGridItem key={href}>
            <SquareButton
              icon={icon}
              label={t(translationKey)}
              color={color}
              variant="crown"
              href={isTeamLocked ? '/odeme' : href}
              prominent
              fill
            />
            {isTeamLocked && (
              <span
                className="pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm md:right-3 md:top-3"
                aria-hidden
              >
                <Lock className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={2.25} />
              </span>
            )}
          </LauncherGridItem>
        )
      })}
    </LauncherGrid>
  )
}
